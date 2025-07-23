#!/usr/bin/env python3
"""
Database connector testing script
"""

import asyncio
import sys
from datetime import datetime


async def test_base_connector():
    """Test the base database connector"""
    try:
        from app.services.database_connectors.base import DatabaseConnector
        from app.schemas.search import SearchQuery, SearchResult

        # Create a mock connector
        class MockConnector(DatabaseConnector):
            def __init__(self):
                super().__init__("Mock Database", "https://mock.example.com")

            async def search(self, query: SearchQuery):
                return []

            def _normalize_result(self, raw_result):
                return None

            async def _perform_health_check(self):
                pass

        connector = MockConnector()
        health = await connector.health_check()

        print(f"✅ Base connector: {connector.name}, healthy: {health}")
        return True
    except Exception as e:
        print(f"❌ Base connector failed: {e}")
        return False


async def test_arxiv_connector():
    """Test the arXiv connector"""
    try:
        from app.services.database_connectors.arxiv_connector import ArxivConnector
        from app.schemas.search import SearchQuery

        connector = ArxivConnector()
        health = await connector.health_check()

        print(f"✅ ArXiv connector: healthy={health}")

        # Test a simple search
        query = SearchQuery(query="machine learning", max_results=2)
        results = await connector.search(query)
        print(f"✅ ArXiv search returned {len(results)} results")

        if results:
            first_result = results[0]
            print(f"   Sample result: {first_result.title[:50]}...")

        return True
    except Exception as e:
        print(f"❌ ArXiv connector failed: {e}")
        import traceback

        traceback.print_exc()
        return False


async def test_search_schema_validation():
    """Test search schema validation with real data"""
    try:
        from app.schemas.search import SearchResult, Author, AccessInfo

        # Create a test search result
        author = Author(name="John Doe", affiliation="Test University")
        access_info = AccessInfo(
            is_open_access=True,
            access_type="open_access",
            license="CC BY",
            repository_url="https://arxiv.org/abs/test",
        )

        result = SearchResult(
            id="test-123",
            title="Test Paper",
            authors=[author],
            abstract="This is a test abstract.",
            publication_date=datetime.now(),
            source_database="test",
            url="https://example.com",
            access_info=access_info,
        )

        print(
            f"✅ Search result schema: {result.title} by {len(result.authors)} authors"
        )
        print(f"   Open access: {result.access_info.is_open_access}")
        return True
    except Exception as e:
        print(f"❌ Search schema validation failed: {e}")
        return False


async def main():
    """Run all async tests"""
    print("🧪 Testing Database Connectors")
    print("=" * 40)

    tests = [
        ("Base Connector", test_base_connector),
        ("ArXiv Connector", test_arxiv_connector),
        ("Schema Validation", test_search_schema_validation),
    ]

    passed = 0
    total = len(tests)

    for test_name, test_func in tests:
        print(f"\n🔍 Testing {test_name}...")
        try:
            if await test_func():
                passed += 1
        except Exception as e:
            print(f"❌ {test_name} crashed: {e}")

    print(f"\n📊 Test Results: {passed}/{total} passed")

    if passed == total:
        print("🎉 All database connectors are working!")
        return True
    else:
        print("⚠️  Some connectors need attention")
        return False


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
