import logging
from datetime import datetime
from typing import Literal, final, override

import httpx
from pydantic import BaseModel, Field

from app.core.config import settings
from app.schemas import SearchEngineName
from app.schemas.search import AccessInfo, Author, SearchQuery, SearchResult
from app.services.database_connectors.base import DatabaseConnector

logger = logging.getLogger(__name__)


class _SearxNGResult(BaseModel):
    url: str
    title: str
    published_date: str | None = Field(default=None, validation_alias="publishedDate")
    content: str | None = None
    doi: str | None = None
    authors: list[str] | None = None
    journal: str | None = None
    tags: list[str] | None = None
    comments: str | None = None
    pdf_url: str | None = None
    type: str | None = None
    publisher: str | None = None
    volume: str | None = None
    isbn: list[str] | None = None


class _SearxNGAPIReturn(BaseModel):
    results: list[_SearxNGResult]
    unresponsive_engines: list[tuple[str, str]]


@final
class SearxNGConnector(DatabaseConnector):
    """Connector for arXiv preprint repository"""

    def __init__(self, base_url: str | None = settings.SEARXNG_BASE_URL):
        if not base_url:
            raise ValueError(
                "base_url can't be empty for SearxNGConnector. Please set it in the .env file or disable SearxNG."
            )

        super().__init__()
        self.base_url = base_url

    @override
    def get_name(self) -> SearchEngineName:
        return "searxng"

    @override
    async def search(self, query: SearchQuery) -> list[SearchResult]:
        logger.debug(f"Searching with query {query.query}")
        results: list[SearchResult] = []

        try:
            response = await self._search(query)
        except Exception as e:
            logger.exception(e)
            return []

        logger.debug(f"Found {len(response.results)} documents")
        for result in response.results:
            if settings.SEARXNG_EXCLUDE_AUTHORLESS_RESULTS and (
                not result.authors or len(result.authors) == 0
            ):
                continue
            if settings.SEARXNG_EXCLUDE_ABSTRACTLESS_RESULTS and (
                not result.content or result.content == ""
            ):
                continue
            if settings.SEARXNG_EXCLUDE_PUBLISHERLESS_RESULTS and not result.publisher:
                continue

            access_type: Literal["open_access", "licensed", "restricted", "unknown"]
            match settings.SEARXNG_REPORT_ACCESS_TYPE:
                case "open":
                    access_type = "open_access"
                case "restricted":
                    access_type = "restricted"

            results.append(
                SearchResult(
                    id=result.title,
                    title=result.title,
                    authors=[
                        Author(name=author_name)
                        for author_name in (result.authors or [])
                    ],
                    abstract=result.content,
                    source_database=result.publisher or "SearxNG",
                    access_info=AccessInfo(
                        is_open_access=settings.SEARXNG_REPORT_ACCESS_TYPE == "open",
                        access_type=access_type,
                    ),
                    access=settings.SEARXNG_REPORT_ACCESS_TYPE,
                    publication_date=datetime.fromisoformat(result.published_date)
                    if result.published_date
                    else None,
                    journal=result.journal,
                    doi=result.doi,
                    url=result.url,
                )
            )

        return results

    @override
    async def _perform_health_check(self):
        pass

    async def _search(self, query: SearchQuery) -> _SearxNGAPIReturn:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/search?q={query.query.replace(' ', '+')}&category=science&pageno=1&language=all&time_range=&safesearch=0&format=json"
            )
            _ = response.raise_for_status()
            return _SearxNGAPIReturn.model_validate_json(response.text)
