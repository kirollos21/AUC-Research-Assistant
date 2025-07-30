"""
Query endpoint for RAG-based academic research assistance
"""

from typing import List, Dict, Any, Optional, AsyncIterator, cast
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from langchain_core.messages.base import BaseMessageChunk
from pydantic import BaseModel, Field
import json
import asyncio
import logging
from app.core.config import settings
from app.schemas.search import SearchQuery, SearchResult, FederatedSearchResponse
from app.services.llm_client import get_llm_client
from app.services.embedding_client import get_embedding_client
from app.services.federated_search_service import FederatedSearchService
from app.services.cohere_reranker import get_cohere_reranker

logger = logging.getLogger(__name__)
logging.basicConfig(
    format="%(asctime)s,%(msecs)03d %(levelname)-8s [%(filename)s:%(lineno)d] %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
    level=logging.DEBUG,
)
router = APIRouter()


class QueryRequest(BaseModel):
    """Request model for research queries"""

    query: str = Field(..., description="User's research question")
    max_results: Optional[int] = Field(
        default=None, description="Maximum number of results per database"
    )
    top_k: Optional[int] = Field(
        default=None, description="Number of top documents for RAG"
    )
    databases: Optional[List[str]] = Field(
        default=None, description="List of databases to search"
    )


class DocumentResult(BaseModel):
    """Document result from vector search"""

    title: str
    authors: str
    year: str
    source: str
    url: str
    abstract: str
    score: float


class QueryResponse(BaseModel):
    """Response model for queries"""

    query: str
    database_queries: List[Dict[str, str]]
    top_documents: List[DocumentResult]
    llm_response: str
    total_documents_found: int
    processing_time: float


@router.post("/stream")
async def process_research_query_stream(request: QueryRequest):
    """
    Process research query with streaming response

    First sends top-k documents, then streams LLM response
    """

    async def generate_stream():
        """Generate streaming response"""
        import time

        start_time = time.time()

        try:
            logger.info(f"Processing streaming research query: {request.query}")

            # Initialize services
            llm_client = get_llm_client()
            embedding_client = get_embedding_client()
            search_service = FederatedSearchService()

            # Step 1: Generate database queries
            yield f"data: {json.dumps({'type': 'status', 'message': 'Generating search queries...'})}\n\n"

            database_queries: List[
                Dict[str, str]
            ] = await llm_client.generate_database_queries(request.query)

            yield f"data: {json.dumps({'type': 'queries', 'queries': database_queries})}\n\n"

            # Step 2: Search databases
            yield f"data: {json.dumps({'type': 'status', 'message': 'Searching academic databases...'})}\n\n"

            all_documents: List[SearchResult] = []
            max_results: int = request.max_results or settings.RAG_DATABASE_CANDIDATES

            for i, query_info in enumerate(database_queries):
                search_query: str = query_info["query"]
                yield f"data: {json.dumps({'type': 'status', 'message': f'Searching with query {i + 1}/{len(database_queries)}: {query_info["focus"]}'})}\n\n"

                try:
                    search_response: FederatedSearchResponse = (
                        await search_service.search(
                            SearchQuery(
                                query=search_query,
                                max_results=max_results,
                                databases=request.databases,
                            )
                        )
                    )
                    if search_response and search_response.results:
                        all_documents.extend(search_response.results)
                except Exception as e:
                    yield f"data: {json.dumps({'type': 'error', 'message': f'Error searching with query: {str(e)}'})}\n\n"
                    continue

            # Remove duplicates
            unique_documents: List[SearchResult] = []
            seen_titles: set[str] = set()
            for doc in all_documents:
                title_lower: str = doc.title.lower().strip()
                if title_lower and title_lower not in seen_titles:
                    seen_titles.add(title_lower)
                    unique_documents.append(doc)

            yield f"data: {json.dumps({'type': 'status', 'message': f'Found {len(unique_documents)} unique documents'})}\n\n"

            # Step 3: Process and embed documents
            yield f"data: {json.dumps({'type': 'status', 'message': 'Processing and embedding documents...'})}\n\n"

            if unique_documents:
                await embedding_client.process_and_store_documents(unique_documents)

            # Step 4: Retrieve top-k documents
            yield f"data: {json.dumps({'type': 'status', 'message': 'Finding most relevant documents...'})}\n\n"

            top_k: int = request.top_k or settings.RAG_TOP_K
            top_documents: List[
                Dict[str, Any]
            ] = await embedding_client.similarity_search(query=request.query, k=top_k)

            # Step 4.5: Rerank documents using Cohere
            top_n: int = settings.COHERE_TOP_N
            reranker = get_cohere_reranker()
            if reranker.is_available() and top_documents:
                yield f"data: {json.dumps({'type': 'status', 'message': 'Reranking documents with Cohere...'})}\n\n"
                top_documents = await reranker.rerank_documents(
                    query=request.query, documents=top_documents, top_n=top_n
                )

            # Send top documents
            document_results: List[Dict[str, Any]] = [
                {
                    "title": doc.get("title", "Unknown Title"),
                    "authors": doc.get("authors", "Unknown Authors"),
                    "year": doc.get("year", "Unknown"),
                    "source": doc.get("source", "Unknown"),
                    "url": doc.get("url", ""),
                    "abstract": doc.get("abstract", ""),
                    "score": doc.get("score", 0.0),
                }
                for doc in top_documents
            ]

            yield f"data: {json.dumps({'type': 'documents', 'documents': document_results})}\n\n"

            # Step 5: Generate streaming LLM response
            yield f"data: {json.dumps({'type': 'status', 'message': 'Generating response...'})}\n\n"

            if top_documents:
                llm_response_gen: AsyncIterator[BaseMessageChunk] = cast(
                    AsyncIterator[BaseMessageChunk],
                    await llm_client.generate_rag_response(
                        user_query=request.query,
                        context_documents=top_documents,
                    ),
                )

                async for chunk in llm_response_gen:
                    yield f"data: {json.dumps({'type': 'response_chunk', 'chunk': chunk.content})}\n\n"

            else:
                error_message: str = "I couldn't find relevant academic documents to answer your question. Please try rephrasing your query or being more specific about the research area."
                yield f"data: {json.dumps({'type': 'response_chunk', 'chunk': error_message})}\n\n"

            # Send completion
            processing_time: float = time.time() - start_time
            yield f"data: {json.dumps({'type': 'complete', 'processing_time': processing_time, 'total_documents': len(unique_documents)})}\n\n"

        except Exception as e:
            logger.exception(f"Error in streaming query: {e}")
            yield f"data: {json.dumps({'type': 'error', 'message': f'Error processing query: {str(e)}'})}\n\n"

    return StreamingResponse(
        generate_stream(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream",
        },
    )


@router.get("/health")
async def health_check():
    """Health check for query service"""
    try:
        # Test LLM client
        llm_client = get_llm_client()

        # Test embedding client
        embedding_client = get_embedding_client()

        # Test federated search
        search_service = FederatedSearchService()

        # Test Cohere reranker
        reranker = get_cohere_reranker()

        return {
            "status": "healthy",
            "services": {
                "llm_client": "available",
                "embedding_client": "available",
                "search_service": "available",
                "cohere_reranker": "available"
                if reranker.is_available()
                else "unavailable",
            },
            "config": {
                "llm_model": settings.MISTRAL_LLM_MODEL,
                "embedding_model": settings.MISTRAL_EMBEDDING_MODEL,
                "cohere_rerank_model": settings.COHERE_RERANK_MODEL,
                "top_k": settings.RAG_TOP_K,
                "reranker_top_n": settings.COHERE_TOP_N,
                "database_candidates": settings.RAG_DATABASE_CANDIDATES,
            },
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=500, detail=f"Service unhealthy: {str(e)}")


@router.delete("/clear-vector-db")
async def clear_vector_database():
    """Clear the vector database collection (useful for fixing embedding dimension issues)"""
    try:
        embedding_client = get_embedding_client()
        await embedding_client.clear_collection()
        return {"message": "Vector database collection cleared successfully"}
    except Exception as e:
        logger.error(f"Error clearing vector database: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error clearing vector database: {str(e)}"
        )
