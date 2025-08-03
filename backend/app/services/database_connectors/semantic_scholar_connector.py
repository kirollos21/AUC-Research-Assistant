"""
Semantic Scholar database connector for federated search
"""

import asyncio
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import httpx

from app.services.database_connectors.base import DatabaseConnector
from app.schemas.search import SearchResult, SearchQuery, Author, AccessInfo, Citation
from app.core.config import settings


logger = logging.getLogger(__name__)


class SemanticScholarConnector(DatabaseConnector):
    """Connector for Semantic Scholar academic search API"""

    def __init__(self):
        super().__init__("semantic_scholar", "https://api.semanticscholar.org")
        self.api_key = settings.SEMANTIC_SCHOLAR_API_KEY
        self.base_url = "https://api.semanticscholar.org/graph/v1"

    async def search(self, query: SearchQuery) -> List[SearchResult]:
        """Search Semantic Scholar database"""
        logger.debug(f"Starting semantic scholar search with query {query}")
        try:
            # Build search parameters
            params = {
                "query": query.query,
                "limit": min(query.max_results, 100),  # API limit is 100
                "fields": (
                    "paperId,title,abstract,authors,year,publicationDate,citationCount,url,"
                    "journal,venue,publicationTypes,publicationVenue,externalIds,"
                    "isOpenAccess,openAccessPdf,fieldsOfStudy"
                ),
                "offset": 0,
            }
            # Add date filters if specified
            if query.date_range:
                if "start" in query.date_range:
                    params["year"] = f"{query.date_range['start']}:"
                if "end" in query.date_range and "start" in query.date_range:
                    params["year"] = (
                        f"{query.date_range['start']}:{query.date_range['end']}"
                    )
                elif "end" in query.date_range:
                    params["year"] = f":{query.date_range['end']}"

            # Perform search
            async with httpx.AsyncClient() as client:
                headers = {}
                if self.api_key:
                    headers["x-api-key"] = self.api_key

                response = await client.get(
                    f"{self.base_url}/paper/search",
                    params=params,
                    headers=headers,
                    timeout=30.0,
                )

                if response.status_code == 200:
                    data = response.json()
                    results = []

                    if response.status_code == 200:
                        data = response.json()
                        results = []

                        for idx, paper in enumerate(data.get("data", [])):
                            if idx < 3:  # log just a few
                                logger.debug(
                                    "S2 paper OA fields: isOpenAccess=%s, openAccessPdf=%s, url=%s, externalIds=%s",
                                    paper.get("isOpenAccess"),
                                    (paper.get("openAccessPdf") or {}),
                                    paper.get("url"),
                                    paper.get("externalIds"))
                            normalized_result = self._normalize_result(paper)
                            results.append(normalized_result)

                    logger.info(
                        f"Semantic Scholar search returned {len(results)} results for query: {query.query}"
                    )
                    return results
                else:
                    logger.error(
                        f"Semantic Scholar API error: {response.status_code} - {response.text}"
                    )
                    return []

        except Exception as e:
            logger.error(f"Semantic Scholar search error: {e}")
            return []

    def _normalize_result(self, raw_result: Dict[str, Any]) -> SearchResult:
        """Normalize Semantic Scholar result to SearchResult schema"""
        try:
            # Extract authors
            authors = []
            for author_data in raw_result.get("authors", []):
                author = Author(
                    name=author_data.get("name", "Unknown Author"),
                    affiliation=None,  # Semantic Scholar doesn't provide affiliation in search results
                    orcid=None,
                )
                authors.append(author)

            # Extract publication date
            pub_date = None
            if raw_result.get("publicationDate"):
                pub_date = self._parse_date(raw_result["publicationDate"])
            elif raw_result.get("year"):
                try:
                    pub_date = datetime(int(raw_result["year"]), 1, 1)
                except (ValueError, TypeError):
                    pass

            # Determine access info
            access_info = self._determine_access_info_ss(raw_result)

            # Extract citation information
            citation_info = None
            if raw_result.get("citationCount") is not None:
                citation_info = Citation(
                    count=raw_result["citationCount"], recent_count=None
                )

            # Extract DOI from external IDs
            doi = self._extract_doi_from_external_ids(raw_result.get("externalIds", {}))

            # Get source from publication venue or journal
            source_database = self._extract_source_database(raw_result)

            # Extract venue information
            venue = self._extract_venue(raw_result)
            journal = (
                raw_result.get("journal", {}).get("name")
                if raw_result.get("journal")
                else None
            )

            # Create search result
            result = SearchResult(
                id=raw_result.get("paperId", "unknown"),
                title=self._clean_text(raw_result.get("title", "Untitled")),
                authors=authors,
                abstract=self._clean_text(raw_result.get("abstract"))
                if raw_result.get("abstract")
                else None,
                publication_date=pub_date,
                journal=journal,
                venue=venue,
                doi=doi,
                url=raw_result.get("url"),
                source_database=source_database,  # Use actual publisher/database instead of "semantic_scholar"
                access_info=access_info,
                citation_info=citation_info,
                keywords=[],
                subjects=[],
                language="en",  # Semantic Scholar is primarily English
                document_type=self._determine_document_type(raw_result),
                relevance_score=0.0,  # Will be calculated later
                raw_metadata={
                    "paperId": raw_result.get("paperId"),
                    "publicationTypes": raw_result.get("publicationTypes", []),
                    "externalIds": raw_result.get("externalIds", {}),
                    "fieldsOfStudy": raw_result.get("fieldsOfStudy", []),
                    "citationCount": raw_result.get("citationCount"),
                    "year": raw_result.get("year"),
                },
            )

            return result

        except Exception as e:
            logger.exception(f"Error normalizing Semantic Scholar result: {e}")
            # Return minimal result on error
            return SearchResult(
                id=raw_result.get("paperId", "unknown"),
                title=raw_result.get("title", "Unknown Title"),
                authors=[],
                source_database="unknown",
                access_info=AccessInfo(is_open_access=False, access_type="unknown"),
                raw_metadata=raw_result,
            )

    def _extract_source_database(self, raw_result: Dict[str, Any]) -> str:
        """Extract the actual source database/publisher instead of Semantic Scholar"""
        # Check publication venue first
        pub_venue = raw_result.get("publicationVenue")
        if pub_venue and pub_venue.get("name"):
            return pub_venue["name"]

        # Check journal
        journal = raw_result.get("journal")
        if journal and journal.get("name"):
            return journal["name"]

        # Check venue field
        venue = raw_result.get("venue")
        if venue:
            return venue

        # Check external IDs to determine source
        external_ids = raw_result.get("externalIds", {})

        if external_ids.get("DOI"):
            return "CrossRef"
        elif external_ids.get("ArXiv"):
            return "arXiv"
        elif external_ids.get("PubMed"):
            return "PubMed"
        elif external_ids.get("DBLP"):
            return "DBLP"
        elif external_ids.get("ACL"):
            return "ACL Anthology"

        # Default to semantic scholar if we can't determine source
        return "Semantic Scholar"

    def _extract_venue(self, raw_result: Dict[str, Any]) -> Optional[str]:
        """Extract venue information"""
        # Try publication venue first
        pub_venue = raw_result.get("publicationVenue")
        if pub_venue and pub_venue.get("name"):
            return pub_venue["name"]

        # Fallback to venue field
        return raw_result.get("venue")

    def _extract_doi_from_external_ids(
        self, external_ids: Dict[str, Any]
    ) -> Optional[str]:
        """Extract DOI from external IDs"""
        return external_ids.get("DOI")

    def _determine_access_info_ss(self, raw_result: Dict[str, Any]) -> AccessInfo:
        """Determine access information for a Semantic Scholar result.

        Signals we use (in order):
        1) isOpenAccess == True
        2) openAccessPdf.url present
        3) obvious arXiv cases (URL or externalIds)
        """
        # Official signals
        is_oa_flag = raw_result.get("isOpenAccess") is True

        pdf_url = None
        open_access_pdf = raw_result.get("openAccessPdf")
        if isinstance(open_access_pdf, dict):
            pdf_url = open_access_pdf.get("url")

        # Heuristic: arXiv items are OA
        url = (raw_result.get("url") or "").lower()
        external_ids = raw_result.get("externalIds", {}) or {}
        arxiv_like = (
                "arxiv.org" in url
                or bool(external_ids.get("ArXiv"))
        )

        is_oa = bool(is_oa_flag or pdf_url or arxiv_like)

        return AccessInfo(
            is_open_access=is_oa,
            access_type="open_access" if is_oa else "restricted",
            license=None,
            license_url=None,
            repository_url=raw_result.get("url"),
            pdf_url=pdf_url,
        )

    def _determine_document_type(self, raw_result: Dict[str, Any]) -> str:
        """Determine document type from publication types"""
        pub_types = (
            raw_result.get("publicationTypes", [])
            if raw_result.get("publicationTypes", [])
            else []
        )

        if "JournalArticle" in pub_types:
            return "journal_article"
        elif "Conference" in pub_types:
            return "conference_paper"
        elif "Review" in pub_types:
            return "review"
        elif "Book" in pub_types:
            return "book"
        elif "BookSection" in pub_types:
            return "book_chapter"
        else:
            return "article"

    async def _perform_health_check(self):
        """Perform Semantic Scholar-specific health check"""
        try:
            async with httpx.AsyncClient() as client:
                headers = {}
                if self.api_key:
                    headers["x-api-key"] = self.api_key

                # Test with a simple search
                response = await client.get(
                    f"{self.base_url}/paper/search",
                    params={"query": "machine learning", "limit": 1},
                    headers=headers,
                    timeout=10.0,
                )

                if response.status_code != 200:
                    raise Exception(f"API returned status {response.status_code}")

                data = response.json()
                if not data.get("data"):
                    raise Exception("No data returned from test query")

        except Exception as e:
            raise Exception(f"Semantic Scholar health check failed: {e}")
