"""
Search API endpoints for federated search functionality
"""

from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import JSONResponse
import logging

from app.schemas.search import SearchQuery, FederatedSearchResponse, DatabaseStatus
from app.services.federated_search_service import federated_search_service
from app.services.llm_service import llm_service
from app.services.database_connectors.arxiv_connector import ArxivConnector


logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/search", response_model=FederatedSearchResponse)
async def federated_search(query: SearchQuery):
    """
    Perform federated search across multiple academic databases

    This endpoint searches across multiple academic databases including:
    - arXiv (preprints)
    - PubMed (biomedical literature)
    - CrossRef (scholarly publications)
    - DOAJ (open access journals)

    The search includes:
    - Query expansion using LLM
    - Semantic similarity scoring
    - Duplicate removal
    - Multi-factor relevance ranking
    """
    try:
        logger.info(f"Federated search request: {query.query}")

        # Validate query
        if not query.query.strip():
            raise HTTPException(status_code=400, detail="Query cannot be empty")

        if len(query.query) > 1000:
            raise HTTPException(
                status_code=400, detail="Query too long (max 1000 characters)"
            )

        # Perform federated search
        response = await federated_search_service.search(query)

        logger.info(
            f"Search completed: {response.stats.total_results} results in "
            f"{response.stats.search_time_ms}ms"
        )

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Search error: {e}")
        raise HTTPException(status_code=500, detail="Internal search error")


@router.get("/databases", response_model=List[str])
async def get_available_databases():
    """
    Get list of available academic databases for search
    """
    try:
        databases = federated_search_service.get_available_databases()
        return databases
    except Exception as e:
        logger.error(f"Error getting databases: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving database list")


@router.get("/databases/status", response_model=List[DatabaseStatus])
async def get_database_status():
    """
    Get health status of all database connectors
    """
    try:
        status_list = await federated_search_service.get_database_status()
        return status_list
    except Exception as e:
        logger.error(f"Error getting database status: {e}")
        raise HTTPException(status_code=500, detail="Error checking database status")


@router.post("/query/expand")
async def expand_query(
    query: str = Query(..., description="Query to expand"),
    context: str = Query(None, description="Optional context for expansion"),
):
    """
    Expand a search query using LLM to generate related terms and synonyms

    This endpoint helps users improve their search queries by providing:
    - Synonyms and related terms
    - Semantic variations
    - Academic terminology suggestions
    """
    try:
        if not query.strip():
            raise HTTPException(status_code=400, detail="Query cannot be empty")

        if len(query) > 500:
            raise HTTPException(
                status_code=400, detail="Query too long (max 500 characters)"
            )

        expansion = await llm_service.expand_query(query, context)

        return {
            "original_query": expansion.original_query,
            "expanded_queries": expansion.expanded_queries,
            "synonyms": expansion.synonyms,
            "related_terms": expansion.related_terms,
            "semantic_variants": expansion.semantic_variants,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Query expansion error: {e}")
        raise HTTPException(status_code=500, detail="Error expanding query")


@router.get("/suggestions")
async def get_search_suggestions(
    query: str = Query(..., description="Original query"),
    results_count: int = Query(..., description="Number of results found"),
):
    """
    Get search suggestions for improving query results
    """
    try:
        if not query.strip():
            raise HTTPException(status_code=400, detail="Query cannot be empty")

        suggestions = await llm_service.generate_search_suggestions(
            query, results_count
        )

        return {
            "query": query,
            "results_count": results_count,
            "suggestions": suggestions,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Suggestions error: {e}")
        raise HTTPException(status_code=500, detail="Error generating suggestions")


@router.get("/categories/arxiv")
async def get_arxiv_categories():
    """
    Get available arXiv subject categories for filtering
    """
    try:
        from app.services.database_connectors.arxiv_connector import ArxivConnector

        connector = ArxivConnector()
        categories = connector.get_categories()
        return categories
    except Exception as e:
        logger.error(f"Error getting arXiv categories: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving categories")


@router.post("/analyze")
async def analyze_search_results(query: str, results: List[Dict[str, Any]]):
    """
    Analyze search results to extract insights and patterns

    This endpoint provides:
    - Key concept extraction
    - Topic clustering
    - Trend analysis
    - Research gap identification
    """
    try:
        if not query.strip():
            raise HTTPException(status_code=400, detail="Query cannot be empty")

        if not results:
            return {
                "query": query,
                "analysis": {
                    "key_concepts": [],
                    "trends": [],
                    "insights": ["No results to analyze"],
                },
            }

        # Extract text from results for analysis
        texts = []
        for result in results[:20]:  # Limit to first 20 results
            text = result.get("title", "")
            if result.get("abstract"):
                text += " " + result["abstract"]
            texts.append(text)

        # Analyze combined text
        combined_text = " ".join(texts)
        key_concepts = await llm_service.extract_key_concepts(combined_text)

        return {
            "query": query,
            "results_analyzed": len(results),
            "analysis": {
                "key_concepts": key_concepts,
                "total_papers": len(results),
                "insights": [
                    f"Found {len(results)} relevant papers",
                    f"Identified {len(key_concepts)} key concepts",
                    "Consider exploring related terms for broader coverage",
                ],
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail="Error analyzing results")


@router.post("/search_arxiv")
async def search_arxiv(s: str):
    """Search arXiv database for academic papers"""
    q = SearchQuery(
        query=s,
        max_results=10,
        enable_semantic_search=False,
        access_preferences=["open_access", "licensed", "any"],
    )

    arxiv_connector = ArxivConnector()
    search_query = SearchQuery(
        query=q.query,
        max_results=q.max_results,
        enable_semantic_search=False,  # or True if you want
    )
    results = await arxiv_connector.search(search_query)

    if not results:
        raise HTTPException(status_code=404, detail="No results found")
    else:
        return [r.dict() if hasattr(r, "dict") else r for r in results]
