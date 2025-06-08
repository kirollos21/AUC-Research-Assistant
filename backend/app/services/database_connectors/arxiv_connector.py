"""
arXiv database connector for federated search
"""

import asyncio
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import arxiv
import httpx

from app.services.database_connectors.base import DatabaseConnector
from app.schemas.search import SearchResult, SearchQuery, Author, AccessInfo


logger = logging.getLogger(__name__)


class ArxivConnector(DatabaseConnector):
    """Connector for arXiv preprint repository"""
    
    def __init__(self):
        super().__init__("arxiv", "https://arxiv.org")
        self.client = arxiv.Client()
    
    async def search(self, query: SearchQuery) -> List[SearchResult]:
        """Search arXiv database"""
        try:
            # Build arXiv query
            arxiv_query = self._build_arxiv_query(query)
            
            # Perform search
            search = arxiv.Search(
                query=arxiv_query,
                max_results=query.max_results,
                sort_by=arxiv.SortCriterion.Relevance
            )
            
            results = []
            async for result in self._async_search_generator(search):
                normalized_result = self._normalize_result(result)
                results.append(normalized_result)
            
            logger.info(f"ArXiv search returned {len(results)} results for query: {query.query}")
            return results
            
        except Exception as e:
            logger.error(f"ArXiv search error: {e}")
            return []
    
    def _build_arxiv_query(self, query: SearchQuery) -> str:
        """Build arXiv-specific query string"""
        # arXiv supports field-specific searches
        base_query = query.query
        
        # Add date filter if specified
        if query.date_range:
            # arXiv uses submittedDate format
            if "start" in query.date_range:
                base_query += f' AND submittedDate:[{query.date_range["start"]}0101 TO *]'
            if "end" in query.date_range:
                base_query += f' AND submittedDate:[* TO {query.date_range["end"]}1231]'
        
        # Add category filters if specified
        if query.filters and "categories" in query.filters:
            categories = query.filters["categories"]
            if isinstance(categories, list):
                category_query = " OR ".join([f"cat:{cat}" for cat in categories])
                base_query += f" AND ({category_query})"
        
        return base_query
    
    async def _async_search_generator(self, search):
        """Async generator wrapper for arxiv search"""
        loop = asyncio.get_event_loop()
        
        def sync_search():
            return list(self.client.results(search))
        
        results = await loop.run_in_executor(None, sync_search)
        for result in results:
            yield result
    
    def _normalize_result(self, raw_result) -> SearchResult:
        """Normalize arXiv result to SearchResult schema"""
        try:
            # Extract authors
            authors = []
            for author in raw_result.authors:
                authors.append(Author(
                    name=str(author),
                    affiliation=None,  # arXiv doesn't provide affiliation
                    orcid=None
                ))
            
            # arXiv papers are open access preprints
            access_info = AccessInfo(
                is_open_access=True,
                access_type="open_access",
                license="arXiv.org perpetual, non-exclusive license",
                license_url="https://arxiv.org/licenses/nonexclusive-distrib/1.0/",
                repository_url=raw_result.entry_id,
                pdf_url=raw_result.pdf_url
            )
            
            # Extract categories/subjects
            categories = [cat for cat in raw_result.categories]
            
            # Create search result
            result = SearchResult(
                id=raw_result.entry_id,
                title=self._clean_text(raw_result.title),
                authors=authors,
                abstract=self._clean_text(raw_result.summary) if raw_result.summary else None,
                publication_date=raw_result.published,
                journal=None,  # arXiv doesn't have journals
                venue="arXiv",
                doi=raw_result.doi if hasattr(raw_result, 'doi') and raw_result.doi else None,
                url=raw_result.entry_id,
                source_database=self.name,
                access_info=access_info,
                citation_info=None,  # arXiv doesn't provide citation counts
                keywords=[],
                subjects=categories,
                language="en",
                document_type="preprint",
                relevance_score=0.0,  # Will be calculated later
                raw_metadata={
                    "arxiv_id": raw_result.entry_id,
                    "categories": categories,
                    "comment": raw_result.comment,
                    "journal_ref": raw_result.journal_ref,
                    "primary_category": raw_result.primary_category
                }
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Error normalizing arXiv result: {e}")
            # Return minimal result on error
            return SearchResult(
                id=getattr(raw_result, 'entry_id', 'unknown'),
                title=getattr(raw_result, 'title', 'Unknown Title'),
                authors=[],
                source_database=self.name,
                access_info=AccessInfo(
                    is_open_access=True,
                    access_type="open_access"
                ),
                raw_metadata={}
            )
    
    async def _perform_health_check(self):
        """Perform arXiv-specific health check"""
        # Try a simple search to test connectivity
        try:
            search = arxiv.Search(
                query="machine learning",
                max_results=1
            )
            
            # Get first result to test API
            results = list(self.client.results(search))
            if not results:
                raise Exception("No results returned from test query")
                
        except Exception as e:
            raise Exception(f"arXiv health check failed: {e}")
    
    def get_categories(self) -> Dict[str, str]:
        """Get arXiv subject categories"""
        return {
            "cs.AI": "Artificial Intelligence",
            "cs.CL": "Computation and Language",
            "cs.CV": "Computer Vision and Pattern Recognition",
            "cs.LG": "Machine Learning",
            "cs.NE": "Neural and Evolutionary Computing",
            "stat.ML": "Machine Learning (Statistics)",
            "q-bio": "Quantitative Biology",
            "physics": "Physics",
            "math": "Mathematics",
            "econ": "Economics",
            "eess": "Electrical Engineering and Systems Science"
        } 