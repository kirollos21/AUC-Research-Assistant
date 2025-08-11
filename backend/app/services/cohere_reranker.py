"""
Cohere Reranker Service for improving document relevance ranking
"""

import logging
from typing import Any, Dict, List, Optional

from cohere import Client
from cohere.types import RerankResponse

from app.core.config import settings

logger = logging.getLogger(__name__)


class CohereReranker:
    """Service for reranking documents using Cohere's rerank API"""

    def __init__(self):
        """Initialize the Cohere reranker"""
        self.client: None | Client = None
        self.model: str = settings.COHERE_RERANK_MODEL

        if settings.COHERE_API_KEY:
            try:
                self.client = Client(
                    api_key=settings.COHERE_API_KEY,
                )
                logger.info("Cohere reranker initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Cohere client: {e}")
                self.client = None
        else:
            logger.warning(
                "COHERE_API_KEY not found in settings. Reranking will be skipped."
            )

    def is_available(self) -> bool:
        """Check if the reranker is available"""
        return self.client is not None

    # TODO: fix to comply with new `SentDocument` class in `app.schemas.search`
    async def rerank_documents(
        self, query: str, documents: List[Dict[str, Any]], top_n: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Rerank documents using Cohere's rerank API

        Args:
            query: The user query
            documents: List of documents to rerank
            top_n: Number of top documents to return (defaults to all)

        Returns:
            List of reranked documents with updated relevance scores
        """
        if not self.is_available():
            logger.warning(
                "Cohere reranker not available. Returning original documents."
            )
            return documents

        if not documents:
            logger.info("No documents to rerank")
            return documents

        try:
            # Prepare documents for Cohere reranking
            # Cohere expects a list of text strings
            doc_texts = []
            for doc in documents:
                # Combine title and abstract for better reranking
                title = doc.get("title", "")
                abstract = doc.get("abstract", "")
                combined_text = f"{title}\n{abstract}" if abstract else title
                doc_texts.append(combined_text)

            logger.info(f"Reranking {len(doc_texts)} documents with query: {query}")

            if self.client:
                # Call Cohere rerank API
                response: RerankResponse = self.client.rerank(
                    model=self.model,
                    query=query,
                    documents=doc_texts,
                    top_n=top_n or len(documents),
                )
            else:
                logger.warning(
                    "Cohere reranker not available. Returning original documents."
                )
                return documents

            # Reorder documents based on reranking results
            reranked_docs = []
            for result in response.results:
                original_doc = documents[result.index].copy()
                # Update the score with Cohere's relevance score
                original_doc["score"] = result.relevance_score
                original_doc["rerank_score"] = result.relevance_score
                reranked_docs.append(original_doc)

            logger.info(f"Successfully reranked {len(reranked_docs)} documents")
            return reranked_docs

        except Exception as e:
            logger.error(f"Error during reranking: {e}")
            # Return original documents if reranking fails
            return documents

    def format_documents_for_reranking(
        self, documents: List[Dict[str, Any]]
    ) -> List[str]:
        """
        Format documents for Cohere reranking by combining relevant text fields

        Args:
            documents: List of document dictionaries

        Returns:
            List of formatted text strings for reranking
        """
        formatted_docs = []

        for doc in documents:
            # Combine title, abstract, and other relevant fields
            parts = []

            if doc.get("title"):
                parts.append(f"Title: {doc['title']}")

            if doc.get("abstract"):
                parts.append(f"Abstract: {doc['abstract']}")

            if doc.get("authors"):
                parts.append(f"Authors: {doc['authors']}")

            # Join all parts with newlines
            formatted_text = "\n".join(parts)
            formatted_docs.append(formatted_text)

        return formatted_docs


# Global instance
_reranker_instance = None


def get_cohere_reranker() -> CohereReranker:
    """Get the global Cohere reranker instance"""
    global _reranker_instance
    if _reranker_instance is None:
        _reranker_instance = CohereReranker()
    return _reranker_instance
