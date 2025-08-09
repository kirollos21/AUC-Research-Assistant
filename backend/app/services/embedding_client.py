"""
Embedding client service for Mistral integration
"""

import hashlib
import logging
import os
from typing import Any, Dict, List, Optional, Union, cast

import chromadb
from chromadb.api import ClientAPI
from chromadb.config import Settings as ChromaSettings
from langchain_chroma import Chroma
from langchain_core.documents import Document as LCDocument
from langchain_core.embeddings import Embeddings
from langchain_core.vectorstores import VectorStore
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_mistralai.embeddings import MistralAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pydantic import ValidationError

from app.core.config import settings
from app.schemas.search import (
    AccessType,
    EmbeddedDocumentMetadata,
    SearchResult,
    SentDocument,
)

logger = logging.getLogger(__name__)


class EmbeddingClient:
    """Mistral embedding client for document embedding and vector search"""

    def __init__(self) -> None:
        self.embeddings: Embeddings
        match settings.EMBEDDING_PROVIDER:
            case "local":
                self.embeddings = HuggingFaceEmbeddings(
                    model_name=settings.EMBEDDING_MODEL
                )
            case "mistral":
                if not settings.MISTRAL_API_KEY:
                    raise ValueError("MISTRAL_API_KEY not found in settings")
                else:
                    self.embeddings = MistralAIEmbeddings(
                        model=settings.EMBEDDING_MODEL,
                    )

        # Initialize text splitter
        self.text_splitter: RecursiveCharacterTextSplitter = (
            RecursiveCharacterTextSplitter(
                chunk_size=settings.RAG_CHUNK_SIZE,
                chunk_overlap=settings.RAG_CHUNK_OVERLAP,
                length_function=len,
                separators=["\n\n", "\n", ". ", " ", ""],
            )
        )

        # Ensure chroma directory exists
        os.makedirs(settings.CHROMA_PERSIST_DIRECTORY, exist_ok=True)

        # Initialize ChromaDB client
        self.chroma_client: ClientAPI = chromadb.PersistentClient(
            path=settings.CHROMA_PERSIST_DIRECTORY,
            settings=ChromaSettings(anonymized_telemetry=False),
        )

        # Collection name for this session
        self.collection_name: str = "research_documents"

        # Initialize vector store
        self.vector_store: Chroma
        self._initialize_vector_store()

    def _initialize_vector_store(self) -> None:
        """Initialize or get existing vector store"""
        try:
            self.vector_store = Chroma(
                client=self.chroma_client,
                collection_name=self.collection_name,
                embedding_function=self.embeddings,
                persist_directory=settings.CHROMA_PERSIST_DIRECTORY,
            )
        except Exception as e:
            # If there's a dimension mismatch or other error, delete the collection and recreate
            print(f"Error initializing vector store: {e}")
            print("Deleting existing collection and recreating...")
            try:
                self.chroma_client.delete_collection(self.collection_name)
            except:
                pass  # Collection might not exist

            # Recreate the vector store
            self.vector_store = Chroma(
                client=self.chroma_client,
                collection_name=self.collection_name,
                embedding_function=self.embeddings,
                persist_directory=settings.CHROMA_PERSIST_DIRECTORY,
            )

    def _create_document_hash(self, title: str, abstract: str) -> str:
        """Create a hash for document deduplication"""
        content = f"{title}_{abstract}"
        return hashlib.md5(content.encode()).hexdigest()[:12]

    async def process_and_store_documents(self, documents: List[SearchResult]) -> str:
        """
        Process academic documents, split text, embed, and store in vector database

        Args:
            documents: List of SearchResult objects from academic database search

        Returns:
            Collection ID for retrieval
        """
        if not documents:
            return self.collection_name

        # Create langchain documents from academic papers
        langchain_docs: List[LCDocument] = []

        for doc in documents:
            title: str = doc.title or "Unknown Title"
            abstract: str = doc.abstract or ""
            # Convert Author objects to string list
            authors: List[str] = (
                [author.name for author in doc.authors] if doc.authors else []
            )
            year: str = (
                str(doc.publication_date.year) if doc.publication_date else "n.d."
            )
            month: str = (
                str(doc.publication_date.month) if doc.publication_date else "n.d."
            )
            source: str = doc.source_database
            url: str = doc.url or ""

            # Create document hash for deduplication
            doc_hash: str = self._create_document_hash(title, abstract)

            # Combine title and abstract for better context
            content: str = f"Title: {title}\n\nAbstract: {abstract}"

            # Create metadata
            metadata: EmbeddedDocumentMetadata = EmbeddedDocumentMetadata(
                title=title,
                authors=", ".join(authors) if authors else "Unknown Authors",
                year=year,
                abstract=abstract,
                month=month,
                source=source,
                url=url,
                doc_hash=doc_hash,
                type="academic_paper",
                # TODO: verify that this check is needed. If not, get rid of it
                access=(
                    "open"
                    if getattr(
                        getattr(doc, "access_info", None), "is_open_access", False
                    )
                    else "restricted"
                ),
            )

            # Create langchain document
            langchain_doc: LCDocument = LCDocument(
                page_content=content, metadata=metadata.model_dump()
            )

            langchain_docs.append(langchain_doc)

        # Split documents into chunks
        split_docs: List[LCDocument] = []
        for doc in langchain_docs:
            # For academic papers, we might want to keep title+abstract together
            # But if they're too long, split them
            if len(doc.page_content) > settings.RAG_CHUNK_SIZE:
                chunks: List[LCDocument] = self.text_splitter.split_documents([doc])
                split_docs.extend(chunks)
            else:
                split_docs.append(doc)

        # Check for existing documents to avoid duplicates
        existing_hashes: set[str] = set()
        try:
            # Get existing documents from the collection
            existing_docs = self.vector_store.get()
            if existing_docs and existing_docs["metadatas"]:
                existing_hashes = {
                    meta.get("doc_hash")
                    for meta in existing_docs["metadatas"]
                    if meta and meta.get("doc_hash")
                }
        except Exception as e:
            # Collection might be empty or not exist yet
            logger.exception(e)

        # Filter out duplicates
        new_docs: List[LCDocument] = [
            doc
            for doc in split_docs
            if doc.metadata.get("doc_hash") not in existing_hashes
        ]

        # Add documents to vector store
        if new_docs:
            try:
                self.vector_store.add_documents(new_docs)
                logger.debug(
                    f"Added {len(new_docs)} new document chunks to vector store"
                )
            except Exception as e:
                logger.exception(f"Error adding documents to vector store: {e}")
                # Try to recreate the vector store
                self._initialize_vector_store()
                self.vector_store.add_documents(new_docs)
        else:
            print("No new documents to add (all were duplicates)")

        return self.collection_name

    async def similarity_search(
        self,
        query: str,
        k: int | None = settings.RAG_TOP_K,
        access_filter: AccessType | None = None,
    ) -> list[SentDocument]:
        """
        Perform similarity search on stored documents

        Args:
            query: Search query
            k: Number of top results to return. If `None`, will use `settings.RAG_TOP_K`

        Returns:
            List of most similar documents with metadata
        """
        if k is None:
            k = settings.RAG_TOP_K

        try:
            # Perform similarity search
            chroma_filter = (
                {"access": access_filter}
                if access_filter in ("open", "restricted")
                else None
            )
            results = self.vector_store.similarity_search_with_score(
                query, k=k, filter=chroma_filter
            )

            # Format results
            formatted_results: list[SentDocument] = []
            for lcdoc, score in results:
                try:
                    metadata: EmbeddedDocumentMetadata = EmbeddedDocumentMetadata(
                        **lcdoc.metadata
                    )

                    result: SentDocument = SentDocument(
                        content=lcdoc.page_content,
                        score=float(score),
                        title=metadata.title,
                        year=metadata.year,
                        month=metadata.month,
                        authors=metadata.authors,
                        source=metadata.source,
                        url=metadata.url,
                        abstract=metadata.abstract,
                        access=metadata.access,
                    )

                    formatted_results.append(result)
                except ValidationError as e:
                    logger.exception(
                        f"Failed to construct EmbeddedDocumentMetadata from metadata fetched from vector database. Document with metadata {lcdoc.metadata} will not be accounted for in this transaction. Error: {e}"
                    )

            return formatted_results

        except Exception as e:
            print(f"Error during similarity search: {e}")
            return []

    async def clear_collection(self) -> None:
        """Clear the document collection"""
        try:
            self.chroma_client.delete_collection(self.collection_name)
            self._initialize_vector_store()
        except Exception as e:
            print(f"Error clearing collection: {e}")


# Global instance
_embedding_client: Optional[EmbeddingClient] = None


def get_embedding_client() -> EmbeddingClient:
    """Get or create embedding client instance"""
    global _embedding_client
    if _embedding_client is None:
        _embedding_client = EmbeddingClient()
    return _embedding_client
