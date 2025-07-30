"""
Base database connector class for federated search
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import asyncio
import logging
from datetime import datetime

from app.schemas.search import SearchResult, SearchQuery


logger = logging.getLogger(__name__)


class DatabaseConnector(ABC):
    """Abstract base class for database connectors"""

    def __init__(self, name: str, base_url: str):
        self.name = name
        self.base_url = base_url
        self.is_available = True
        self.last_error = None
        self.response_time_ms = None

    @abstractmethod
    async def search(self, query: SearchQuery) -> List[SearchResult]:
        """
        Search the database with the given query

        Args:
            query: SearchQuery object containing search parameters

        Returns:
            List of SearchResult objects
        """
        pass

    @abstractmethod
    def _normalize_result(self, raw_result: Dict[str, Any]) -> SearchResult:
        """
        Normalize raw database result to SearchResult schema

        Args:
            raw_result: Raw result from database API

        Returns:
            Normalized SearchResult object
        """
        pass

    async def health_check(self) -> bool:
        """
        Check if the database is available

        Returns:
            True if database is healthy, False otherwise
        """
        try:
            start_time = datetime.now()
            # Implement database-specific health check
            await self._perform_health_check()
            end_time = datetime.now()

            self.response_time_ms = int((end_time - start_time).total_seconds() * 1000)
            self.is_available = True
            self.last_error = None
            return True

        except Exception as e:
            self.is_available = False
            self.last_error = str(e)
            logger.error(f"Health check failed for {self.name}: {e}")
            return False

    @abstractmethod
    async def _perform_health_check(self):
        """Database-specific health check implementation"""
        pass

    def _extract_authors(self, raw_authors: Any) -> List[Dict[str, str]]:
        """
        Extract and normalize author information

        Args:
            raw_authors: Raw author data from database

        Returns:
            List of author dictionaries
        """
        authors = []

        if isinstance(raw_authors, list):
            for author in raw_authors:
                if isinstance(author, str):
                    authors.append({"name": author, "affiliation": None, "orcid": None})
                elif isinstance(author, dict):
                    authors.append(
                        {
                            "name": author.get("name", ""),
                            "affiliation": author.get("affiliation"),
                            "orcid": author.get("orcid"),
                        }
                    )
        elif isinstance(raw_authors, str):
            # Split comma-separated authors
            for author_name in raw_authors.split(","):
                authors.append(
                    {"name": author_name.strip(), "affiliation": None, "orcid": None}
                )

        return authors

    def _determine_access_info(self, raw_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Determine access information for the result

        Args:
            raw_result: Raw result data

        Returns:
            Access information dictionary
        """
        # Default access info (override in specific connectors)
        return {
            "is_open_access": False,
            "access_type": "unknown",
            "license": None,
            "license_url": None,
            "repository_url": None,
            "pdf_url": None,
        }

    def _parse_date(self, date_str: Any) -> Optional[datetime]:
        """
        Parse various date formats to datetime

        Args:
            date_str: Date string in various formats

        Returns:
            Parsed datetime or None
        """
        if not date_str:
            return None

        try:
            # Handle different date formats
            if isinstance(date_str, datetime):
                return date_str

            if isinstance(date_str, str):
                # Try common academic date formats
                formats = [
                    "%Y-%m-%d",
                    "%Y-%m-%dT%H:%M:%SZ",
                    "%Y-%m-%d %H:%M:%S",
                    "%d %b %Y",
                    "%B %d, %Y",
                    "%Y",
                ]

                for fmt in formats:
                    try:
                        return datetime.strptime(date_str, fmt)
                    except ValueError:
                        continue

                # If none work, try just the year
                try:
                    year = int(date_str[:4])
                    return datetime(year, 1, 1)
                except:
                    pass

        except Exception as e:
            logger.warning(f"Could not parse date '{date_str}': {e}")

        return None

    def _clean_text(self, text: str) -> str:
        """
        Clean and normalize text content

        Args:
            text: Raw text

        Returns:
            Cleaned text
        """
        if not text:
            return ""

        # Remove extra whitespace and normalize
        text = " ".join(text.split())

        # Remove common HTML entities
        text = text.replace("&amp;", "&")
        text = text.replace("&lt;", "<")
        text = text.replace("&gt;", ">")
        text = text.replace("&quot;", '"')
        text = text.replace("&#39;", "'")

        return text.strip()

    def _extract_doi(self, raw_result: Dict[str, Any]) -> Optional[str]:
        """
        Extract DOI from various fields

        Args:
            raw_result: Raw result data

        Returns:
            DOI string or None
        """
        doi = None

        # Check common DOI fields
        doi_fields = ["doi", "DOI", "doi_url", "doi_link"]
        for field in doi_fields:
            if field in raw_result and raw_result[field]:
                doi = raw_result[field]
                break

        if doi:
            # Clean DOI format
            if doi.startswith("http"):
                # Extract DOI from URL
                if "doi.org/" in doi:
                    doi = doi.split("doi.org/")[-1]

            # Remove common prefixes
            if doi.startswith("doi:"):
                doi = doi[4:]

            return doi.strip()

        return None

    async def search_with_timeout(
        self, query: SearchQuery, timeout: int = 30
    ) -> List[SearchResult]:
        """
        Search with timeout protection

        Args:
            query: Search query
            timeout: Timeout in seconds

        Returns:
            List of search results
        """
        try:
            return await asyncio.wait_for(self.search(query), timeout=timeout)
        except asyncio.TimeoutError:
            logger.warning(f"Search timeout for {self.name} after {timeout}s")
            return []
        except Exception as e:
            logger.error(f"Search error for {self.name}: {e}")
            return []
