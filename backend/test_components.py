#!/usr/bin/env python3
"""
Component testing script for AUC Research Assistant Backend
"""

import sys
import traceback
from datetime import datetime

def test_config():
    """Test configuration module"""
    try:
        from app.core.config import settings
        print(f"✅ Config: {settings.APP_NAME} v{settings.APP_VERSION}")
        return True
    except Exception as e:
        print(f"❌ Config failed: {e}")
        return False

def test_logging():
    """Test logging setup"""
    try:
        from app.core.logging import setup_logging
        setup_logging()
        print("✅ Logging setup successful")
        return True
    except Exception as e:
        print(f"❌ Logging failed: {e}")
        return False

def test_basic_schemas():
    """Test basic schema creation"""
    try:
        from pydantic import BaseModel
        from typing import List, Optional
        
        class TestSchema(BaseModel):
            name: str
            items: List[str] = []
            optional_field: Optional[str] = None
        
        test_obj = TestSchema(name="test", items=["a", "b"])
        print(f"✅ Basic schema: {test_obj.name} with {len(test_obj.items)} items")
        return True
    except Exception as e:
        print(f"❌ Basic schema failed: {e}")
        return False

def test_search_schemas():
    """Test search-specific schemas"""
    try:
        from app.schemas.search import SearchQuery
        
        query = SearchQuery(
            query="machine learning",
            max_results=10,
            enable_semantic_search=True
        )
        print(f"✅ Search schema: query='{query.query}', max_results={query.max_results}")
        return True
    except Exception as e:
        print(f"❌ Search schema failed: {e}")
        traceback.print_exc()
        return False

def test_api_structure():
    """Test API structure"""
    try:
        from app.api.v1.router import api_router
        print(f"✅ API router created with {len(api_router.routes)} routes")
        return True
    except Exception as e:
        print(f"❌ API structure failed: {e}")
        return False

def test_simplified_app():
    """Test simplified FastAPI app creation"""
    try:
        from fastapi import FastAPI
        from app.core.config import settings
        
        app = FastAPI(title=settings.APP_NAME)
        
        @app.get("/test")
        def test_endpoint():
            return {"status": "ok"}
        
        print(f"✅ FastAPI app created: {app.title}")
        return True
    except Exception as e:
        print(f"❌ FastAPI app failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Testing AUC Research Assistant Backend Components")
    print("=" * 50)
    
    tests = [
        ("Configuration", test_config),
        ("Logging", test_logging),
        ("Basic Schemas", test_basic_schemas),
        ("Search Schemas", test_search_schemas),
        ("API Structure", test_api_structure),
        ("FastAPI App", test_simplified_app),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n🔍 Testing {test_name}...")
        try:
            if test_func():
                passed += 1
        except Exception as e:
            print(f"❌ {test_name} crashed: {e}")
    
    print(f"\n📊 Test Results: {passed}/{total} passed")
    
    if passed == total:
        print("🎉 All core components are working!")
        return True
    else:
        print("⚠️  Some components need attention")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 