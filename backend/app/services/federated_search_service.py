"""
Federated Search Service - Orchestrates searches across multiple academic databases
"""

import asyncio
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import hashlib
from collections import defaultdict

from app.services.database_connectors.arxiv_connector import ArxivConnector
from app.services.database_connectors.semantic_scholar_connector import (
    SemanticScholarConnector,
)
from app.schemas.search import (
    SearchQuery,
    SearchResult,
    FederatedSearchResponse,
    SearchStats,
    DatabaseStatus,
)
from app.services.database_connectors.base import DatabaseConnector


logger = logging.getLogger(__name__)


class FederatedSearchService:
    """Service for coordinating federated search across academic databases"""

    def __init__(self):
        self.connectors = {
            "arxiv": ArxivConnector(),
            "semantic_scholar": SemanticScholarConnector(),
            # Add more connectors as they're implemented
            # "pubmed": PubmedConnector(),
            # "crossref": CrossrefConnector(),
            # "doaj": DOAJConnector(),
        }
        self.available_databases = list(self.connectors.keys())
        logger.info(
            f"Initialized FederatedSearchService with connectors {self.connectors}"
        )

    async def search(
        self, query: SearchQuery, access_filter: Optional[str] = None
    ) -> FederatedSearchResponse:
        """
        Perform federated search across multiple databases

        Args:
            query: SearchQuery object with search parameters

        Returns:
            FederatedSearchResponse with aggregated results
        """
        start_time = datetime.now()

        try:
            # Determine which databases to search
            databases_to_search = self._get_databases_to_search(query.databases)
            logger.info(f"Searching in databases {databases_to_search}")

            # Execute searches in parallel
            search_tasks = []
            for db_name in databases_to_search:
                if db_name in self.connectors:
                    connector = self.connectors[db_name]
                    task = self._search_database_simple(connector, query)
                    search_tasks.append((db_name, task))

            # Wait for all searches to complete
            search_results = await asyncio.gather(
                *[task for _, task in search_tasks], return_exceptions=True
            )

            # Consolidate results
            all_results = []
            results_per_database = {}
            successful_databases = []
            failed_databases = []

            for i, (db_name, result) in enumerate(
                zip([name for name, _ in search_tasks], search_results)
            ):
                if isinstance(result, Exception):
                    logger.error(f"Search failed for {db_name}: {result}")
                    failed_databases.append(db_name)
                    results_per_database[db_name] = 0
                else:
                    # Apply access filter before counting/adding
                    if access_filter in ("open", "restricted"):
                        want_open = access_filter == "open"
                        result = [
                            r
                            for r in result
                            if bool(
                                getattr(r, "access_info", None)
                                and r.access_info.is_open_access
                            )
                            == want_open
                        ]
                        # Optional debug to verify what you’re getting:
                        logger.debug(
                            f"[{db_name}] access_filter={access_filter} -> {len(result)} results after filtering"
                        )

                    successful_databases.append(db_name)
                    results_per_database[db_name] = len(result)
                    all_results.extend(result)

            # Remove duplicates
            deduplicated_results, duplicates_removed = self._remove_duplicates(
                all_results
            )

            # Sort by publication date (most recent first)
            deduplicated_results.sort(
                key=lambda x: x.publication_date
                if x.publication_date
                else datetime.min,
                reverse=True,
            )

            # Calculate search time
            end_time = datetime.now()
            search_time_ms = int((end_time - start_time).total_seconds() * 1000)

            # Create response
            stats = SearchStats(
                total_results=len(deduplicated_results),
                results_per_database=results_per_database,
                search_time_ms=search_time_ms,
                query_expansion_used=False,
                semantic_search_used=False,
                duplicates_removed=duplicates_removed,
            )

            response = FederatedSearchResponse(
                query=query.query,
                results=deduplicated_results,
                stats=stats,
                related_queries=[],
            )

            logger.info(
                f"Federated search completed: {len(deduplicated_results)} results "
                f"from {len(successful_databases)} databases in {search_time_ms}ms"
            )

            return response

        except Exception as e:
            logger.error(f"Federated search error: {e}")
            # Return empty response on error
            return FederatedSearchResponse(
                query=query.query,
                results=[],
                stats=SearchStats(
                    total_results=0,
                    results_per_database={},
                    search_time_ms=0,
                    query_expansion_used=False,
                    semantic_search_used=False,
                    duplicates_removed=0,
                ),
                related_queries=[],
            )

    async def _search_database_simple(
        self, connector: DatabaseConnector, query: SearchQuery
    ) -> List[SearchResult]:
        """Search a single database without expansion"""
        try:
            # Search with original query only
            results = await connector.search_with_timeout(query, timeout=30)
            return results

        except Exception as e:
            logger.error(f"Database search error for {connector.name}: {e}")
            return []

    def _get_databases_to_search(
        self,
        requested_databases: Optional[List[str]],
        access_filter: Optional[str] = None,
    ) -> List[str]:
        if not requested_databases:
            if access_filter == "open":
                return ["semantic_scholar", "arxiv"]
            return ["semantic_scholar"]
        return [db for db in requested_databases if db in self.available_databases]

    def _remove_duplicates(
        self, results: List[SearchResult]
    ) -> tuple[List[SearchResult], int]:
        """
        Remove duplicate results based on title and DOI similarity

        Returns:
            Tuple of (deduplicated_results, number_of_duplicates_removed)
        """
        if not results:
            return [], 0

        unique_results = []
        seen_signatures = set()
        duplicates_removed = 0

        for result in results:
            # Create signature for duplicate detection
            signature = self._create_result_signature(result)

            if signature not in seen_signatures:
                seen_signatures.add(signature)
                unique_results.append(result)
            else:
                duplicates_removed += 1

        return unique_results, duplicates_removed

    def _create_result_signature(self, result: SearchResult) -> str:
        """Create a signature for duplicate detection"""
        # Use DOI if available (most reliable)
        if result.doi:
            return f"doi:{result.doi.lower()}"

        # Fall back to normalized title
        title_words = result.title.lower().split()
        # Remove common words and normalize
        stop_words = {
            "a",
            "an",
            "the",
            "and",
            "or",
            "but",
            "in",
            "on",
            "at",
            "to",
            "for",
            "of",
            "with",
            "by",
        }
        meaningful_words = [
            word for word in title_words if word not in stop_words and len(word) > 2
        ]

        if meaningful_words:
            # Create hash of meaningful words
            title_hash = hashlib.md5(
                " ".join(sorted(meaningful_words)).encode()
            ).hexdigest()
            return f"title:{title_hash}"

        # Last resort: use full title hash
        return f"full_title:{hashlib.md5(result.title.lower().encode()).hexdigest()}"

    def _calculate_recency_score(self, publication_date: Optional[datetime]) -> float:
        """Calculate recency score (0-1, higher = more recent)"""
        if not publication_date:
            return 0.5  # Neutral score for unknown dates

        try:
            now = datetime.now()
            days_old = (now - publication_date).days

            # Score decreases with age, but slowly
            # Recent papers (< 1 year) get high scores
            if days_old < 365:
                return 1.0
            elif days_old < 365 * 2:
                return 0.8
            elif days_old < 365 * 5:
                return 0.6
            elif days_old < 365 * 10:
                return 0.4
            else:
                return 0.2

        except:
            return 0.5

    def _calculate_citation_score(self, citation_info) -> float:
        """Calculate citation score (0-1, higher = more cited)"""
        if not citation_info or not citation_info.count:
            return 0.5  # Neutral score for unknown citations

        try:
            # Simple logarithmic scaling for citation counts
            # This is a placeholder - adjust based on field-specific norms
            citation_count = citation_info.count
            if citation_count >= 1000:
                return 1.0
            elif citation_count >= 100:
                return 0.8
            elif citation_count >= 10:
                return 0.6
            elif citation_count >= 1:
                return 0.4
            else:
                return 0.2

        except:
            return 0.5

    async def get_database_status(self) -> List[DatabaseStatus]:
        """Get status of all database connectors"""
        status_list = []

        for name, connector in self.connectors.items():
            try:
                is_healthy = await connector.health_check()
                status = DatabaseStatus(
                    name=name,
                    available=is_healthy,
                    response_time_ms=connector.response_time_ms,
                    error_message=connector.last_error,
                    last_checked=datetime.now(),
                )
            except Exception as e:
                status = DatabaseStatus(
                    name=name,
                    available=False,
                    response_time_ms=None,
                    error_message=str(e),
                    last_checked=datetime.now(),
                )

            status_list.append(status)

        return status_list

    def get_available_databases(self) -> List[str]:
        """Get list of available database names"""
        return list(self.connectors.keys())


# Global instance
federated_search_service = FederatedSearchService()
