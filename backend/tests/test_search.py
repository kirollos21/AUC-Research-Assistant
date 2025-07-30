"""
Test cases for federated search functionality
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime

from app.schemas.search import SearchQuery, SearchResult, Author, AccessInfo


@pytest.fixture
def mock_search_result():
    """Create a mock search result for testing"""
    return SearchResult(
        id="test_id_123",
        title="Test Paper on Machine Learning",
        authors=[Author(name="John Doe", affiliation="Test University")],
        abstract="This is a test abstract about machine learning research.",
        publication_date=datetime(2023, 1, 1),
        journal="Test Journal",
        venue="Test Conference",
        doi="10.1000/test.doi",
        url="https://example.com/paper",
        source_database="arxiv",
        access_info=AccessInfo(is_open_access=True, access_type="open_access"),
        relevance_score=0.85,
        raw_metadata={},
    )


@pytest.fixture
def mock_federated_search_response(mock_search_result):
    """Create a mock federated search response"""
    from app.schemas.search import FederatedSearchResponse, SearchStats

    return FederatedSearchResponse(
        query="machine learning",
        results=[mock_search_result],
        stats=SearchStats(
            total_results=1,
            results_per_database={"arxiv": 1},
            search_time_ms=500,
            query_expansion_used=True,
            semantic_search_used=True,
            duplicates_removed=0,
        ),
        suggestions=[],
        related_queries=[],
    )


class TestSearchAPI:
    """Test search API endpoints"""

    @patch("app.services.federated_search_service.federated_search_service")
    def test_federated_search_success(
        self, mock_service, mock_federated_search_response
    ):
        """Test successful federated search"""
        from main import app

        # Mock the service
        mock_service.search = AsyncMock(return_value=mock_federated_search_response)

        client = TestClient(app)

        # Test search request
        search_data = {
            "query": "machine learning",
            "databases": ["arxiv"],
            "max_results": 10,
            "enable_semantic_search": True,
        }

        response = client.post("/api/v1/search/search", json=search_data)

        assert response.status_code == 200
        data = response.json()
        assert data["query"] == "machine learning"
        assert len(data["results"]) == 1
        assert data["stats"]["total_results"] == 1

    def test_federated_search_empty_query(self):
        """Test federated search with empty query"""
        from main import app

        client = TestClient(app)

        search_data = {"query": "", "databases": ["arxiv"], "max_results": 10}

        response = client.post("/api/v1/search/search", json=search_data)

        assert response.status_code == 400
        assert "empty" in response.json()["detail"].lower()

    def test_federated_search_long_query(self):
        """Test federated search with overly long query"""
        from main import app

        client = TestClient(app)

        search_data = {
            "query": "x" * 1001,  # Too long
            "databases": ["arxiv"],
            "max_results": 10,
        }

        response = client.post("/api/v1/search/search", json=search_data)

        assert response.status_code == 400
        assert "too long" in response.json()["detail"].lower()

    @patch("app.services.federated_search_service.federated_search_service")
    def test_get_available_databases(self, mock_service):
        """Test getting available databases"""
        from main import app

        mock_service.get_available_databases.return_value = ["arxiv", "pubmed"]

        client = TestClient(app)
        response = client.get("/api/v1/search/databases")

        assert response.status_code == 200
        databases = response.json()
        assert "arxiv" in databases

    @patch("app.services.federated_search_service.federated_search_service")
    def test_get_database_status(self, mock_service):
        """Test getting database status"""
        from main import app
        from app.schemas.search import DatabaseStatus

        mock_status = [
            DatabaseStatus(
                name="arxiv",
                available=True,
                response_time_ms=100,
                error_message=None,
                last_checked=datetime.now(),
            )
        ]
        mock_service.get_database_status = AsyncMock(return_value=mock_status)

        client = TestClient(app)
        response = client.get("/api/v1/search/databases/status")

        assert response.status_code == 200
        status_list = response.json()
        assert len(status_list) == 1
        assert status_list[0]["name"] == "arxiv"
        assert status_list[0]["available"] is True

    @patch("app.services.llm_service.llm_service")
    def test_expand_query(self, mock_llm_service):
        """Test query expansion endpoint"""
        from main import app
        from app.schemas.search import QueryExpansion

        mock_expansion = QueryExpansion(
            original_query="ML",
            expanded_queries=["ML", "machine learning", "artificial intelligence"],
            synonyms=["machine learning", "AI"],
            related_terms=["deep learning", "neural networks"],
            semantic_variants=["artificial intelligence research"],
        )
        mock_llm_service.expand_query = AsyncMock(return_value=mock_expansion)

        client = TestClient(app)
        response = client.post("/api/v1/search/query/expand?query=ML")

        assert response.status_code == 200
        data = response.json()
        assert data["original_query"] == "ML"
        assert "machine learning" in data["synonyms"]

    def test_expand_query_empty(self):
        """Test query expansion with empty query"""
        from main import app

        client = TestClient(app)

        response = client.post("/api/v1/search/query/expand?query=")

        assert response.status_code == 400
        assert "empty" in response.json()["detail"].lower()

    @patch("app.services.llm_service.llm_service")
    def test_get_search_suggestions(self, mock_llm_service):
        """Test search suggestions endpoint"""
        from main import app

        mock_llm_service.generate_search_suggestions = AsyncMock(
            return_value=["machine learning algorithms", "deep learning methods"]
        )

        client = TestClient(app)
        response = client.get("/api/v1/search/suggestions?query=ML&results_count=2")

        assert response.status_code == 200
        data = response.json()
        assert data["query"] == "ML"
        assert data["results_count"] == 2
        assert len(data["suggestions"]) == 2

    def test_get_arxiv_categories(self):
        """Test getting arXiv categories"""
        from main import app

        client = TestClient(app)

        response = client.get("/api/v1/search/categories/arxiv")

        assert response.status_code == 200
        categories = response.json()
        assert isinstance(categories, dict)
        # Should contain some expected categories
        assert any("AI" in key or "ML" in key for key in categories.keys())

    @patch("app.services.llm_service.llm_service")
    def test_analyze_search_results(self, mock_llm_service):
        """Test search results analysis"""
        from main import app

        mock_llm_service.extract_key_concepts = AsyncMock(
            return_value=["machine learning", "neural networks", "deep learning"]
        )

        client = TestClient(app)

        # Mock results data
        results_data = [
            {
                "title": "Machine Learning in Healthcare",
                "abstract": "This paper discusses the application of ML in medical diagnosis.",
            },
            {
                "title": "Deep Neural Networks for Image Recognition",
                "abstract": "We present a novel approach using deep learning for image classification.",
            },
        ]

        response = client.post(
            "/api/v1/search/analyze",
            json={"query": "machine learning", "results": results_data},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["query"] == "machine learning"
        assert data["results_analyzed"] == 2
        assert "key_concepts" in data["analysis"]
        assert "machine learning" in data["analysis"]["key_concepts"]


class TestArxivConnector:
    """Test arXiv connector functionality"""

    @pytest.mark.asyncio
    async def test_arxiv_connector_initialization(self):
        """Test arXiv connector can be initialized"""
        from app.services.database_connectors.arxiv_connector import ArxivConnector

        connector = ArxivConnector()
        assert connector.name == "arxiv"
        assert connector.base_url == "https://arxiv.org"

    @pytest.mark.asyncio
    @patch("arxiv.Client")
    async def test_arxiv_search(self, mock_arxiv_client):
        """Test arXiv search functionality"""
        from app.services.database_connectors.arxiv_connector import ArxivConnector
        from app.schemas.search import SearchQuery

        # Mock arXiv result
        mock_result = Mock()
        mock_result.entry_id = "2023.1234"
        mock_result.title = "Test Paper"
        mock_result.authors = [Mock()]
        mock_result.authors[0].__str__ = lambda: "John Doe"
        mock_result.summary = "Test abstract"
        mock_result.published = datetime(2023, 1, 1)
        mock_result.categories = ["cs.LG"]
        mock_result.doi = None
        mock_result.pdf_url = "https://arxiv.org/pdf/2023.1234"
        mock_result.comment = None
        mock_result.journal_ref = None
        mock_result.primary_category = "cs.LG"

        # Mock client
        mock_client_instance = Mock()
        mock_client_instance.results.return_value = [mock_result]
        mock_arxiv_client.return_value = mock_client_instance

        connector = ArxivConnector()
        query = SearchQuery(query="machine learning", max_results=10)

        # Note: This test would need more sophisticated mocking for async operations
        # For now, we're testing the basic structure


class TestLLMService:
    """Test LLM service functionality"""

    @pytest.mark.asyncio
    async def test_llm_service_initialization(self):
        """Test LLM service can be initialized"""
        from app.services.llm_service import LLMService

        service = LLMService()
        # Should not raise an exception
        assert service is not None

    @pytest.mark.asyncio
    async def test_query_expansion_without_openai(self):
        """Test query expansion when OpenAI is not available"""
        from app.services.llm_service import LLMService

        service = LLMService()
        service.openai_client = None  # Simulate no OpenAI

        expansion = await service.expand_query("machine learning")

        assert expansion.original_query == "machine learning"
        assert "machine learning" in expansion.expanded_queries
        # Should still provide some synonyms from the built-in mapping
        assert len(expansion.synonyms) > 0
