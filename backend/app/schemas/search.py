"""
Pydantic schemas for search functionality
"""

from pydantic import model_validator
from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field
from datetime import datetime




class SearchQuery(BaseModel):
    """Search query request schema"""

    query: str = Field(..., description="Main search query")
    databases: Optional[List[str]] = Field(
        default=None, description="List of databases to search"
    )
    max_results: int = Field(
        default=20, ge=1, le=100, description="Maximum results per database"
    )
    date_range: Optional[Dict[str, str]] = Field(
        default=None,
        description="Date range filter with 'start' and 'end' keys (YYYY-MM-DD)",
    )
    filters: Optional[Dict[str, Any]] = Field(
        default_factory=dict, description="Additional filters specific to databases"
    )
    enable_semantic_search: bool = Field(
        default=True, description="Enable semantic search and query expansion"
    )
    access_preferences: List[Literal["open_access", "licensed", "any"]] = Field(
        default=["open_access", "licensed"], description="Preferred access types"
    )


class Author(BaseModel):
    """Author information schema"""

    name: str
    affiliation: Optional[str] = None
    orcid: Optional[str] = None


class AccessInfo(BaseModel):
    """Access information for a publication"""

    is_open_access: bool
    access_type: Literal["open_access", "licensed", "restricted", "unknown"]
    license: Optional[str] = None
    license_url: Optional[str] = None
    repository_url: Optional[str] = None
    pdf_url: Optional[str] = None


class Citation(BaseModel):
    """Citation information"""

    count: Optional[int] = None
    recent_count: Optional[int] = None  # Citations in last 2 years
    h_index: Optional[float] = None
    impact_factor: Optional[float] = None


class SearchResult(BaseModel):
    """Individual search result schema"""

    id: str = Field(..., description="Unique identifier for the result")
    title: str
    authors: List[Author]
    abstract: Optional[str] = None
    publication_date: Optional[datetime] = None
    journal: Optional[str] = None
    venue: Optional[str] = None  # Conference/journal name
    doi: Optional[str] = None
    url: Optional[str] = None
    source_database: str = Field(..., description="Database that provided this result")
    access_info: AccessInfo

    # NEW — normalized flag we’ll use for filtering & vector-store metadata
    access: Literal["open", "restricted"] = "restricted"

    citation_info: Optional[Citation] = None
    keywords: List[str] = Field(default_factory=list)
    subjects: List[str] = Field(default_factory=list)
    language: Optional[str] = "en"
    document_type: Optional[str] = None  # article, preprint, book, etc.

    # Relevance scoring
    relevance_score: float = Field(default=0.0, ge=0.0, le=1.0)
    lexical_score: Optional[float] = None
    semantic_score: Optional[float] = None
    citation_score: Optional[float] = None
    recency_score: Optional[float] = None

    # Raw metadata from source
    raw_metadata: Dict[str, Any] = Field(default_factory=dict)

    # ---- NEW: derive `access` automatically from `access_info` if caller didn't set it
    @model_validator(mode="after")
    def _derive_access_from_access_info(self):
        # if access already set explicitly, keep it
        if getattr(self, "access", None) in ("open", "restricted"):
            return self

        ai = getattr(self, "access_info", None)
        if ai:
            # Treat 'open_access' (and is_open_access=True) as open; others default to restricted
            if getattr(ai, "is_open_access", False) or getattr(ai, "access_type", "") == "open_access":
                self.access = "open"
            else:
                # licensed / restricted / unknown → default to restricted for filtering purposes
                self.access = "restricted"
        else:
            self.access = "restricted"

        return self

class SearchStats(BaseModel):
    """Search statistics"""

    total_results: int
    results_per_database: Dict[str, int]
    search_time_ms: int
    query_expansion_used: bool
    semantic_search_used: bool
    duplicates_removed: int


class FederatedSearchResponse(BaseModel):
    """Complete federated search response"""

    query: str
    results: List[SearchResult]
    stats: SearchStats
    suggestions: Optional[List[str]] = Field(
        default_factory=list, description="Query suggestions for better results"
    )
    related_queries: Optional[List[str]] = Field(
        default_factory=list, description="Related search queries"
    )


class QueryExpansion(BaseModel):
    """Query expansion result"""

    original_query: str
    expanded_queries: List[str]
    synonyms: List[str]
    related_terms: List[str]
    semantic_variants: List[str]


class DatabaseStatus(BaseModel):
    """Status of individual database"""

    name: str
    available: bool
    response_time_ms: Optional[int] = None
    error_message: Optional[str] = None
    last_checked: datetime


class SearchMetrics(BaseModel):
    """Search performance metrics"""

    query: str
    timestamp: datetime
    total_results: int
    response_time_ms: int
    databases_queried: List[str]
    successful_databases: List[str]
    failed_databases: List[str]
    user_satisfaction: Optional[float] = None  # 0-5 rating
