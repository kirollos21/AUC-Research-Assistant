"""
Simple test server to verify backend functionality
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from typing import List, Dict, Any

app = FastAPI(
    title="Test Research Assistant API",
    version="1.0.0",
    description="Simple test server",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Test Research Assistant API is running!",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
    }


@app.post("/api/v1/search/search")
async def search_endpoint():
    """Search endpoint that frontend calls"""
    return {
        "query": "test query",
        "results": [
            {
                "title": "Test Research Paper on AI",
                "authors": ["Test Author", "Another Author"],
                "abstract": "This is a test abstract about artificial intelligence and machine learning research.",
                "source": "arxiv",
                "url": "https://arxiv.org/abs/test123",
                "score": 0.95,
                "published_date": "2024-01-15",
                "categories": ["cs.AI", "cs.LG"],
            },
            {
                "title": "Another Test Paper",
                "authors": ["Second Author"],
                "abstract": "This is another test abstract about research methodology.",
                "source": "pubmed",
                "url": "https://pubmed.ncbi.nlm.nih.gov/test456",
                "score": 0.87,
                "published_date": "2024-02-20",
                "categories": ["research", "methodology"],
            },
        ],
        "total_results": 2,
        "search_time_ms": 150,
        "stats": {
            "total_results": 2,
            "search_time_ms": 150,
            "databases_searched": ["arxiv", "pubmed"],
        },
    }


@app.get("/api/v1/search/databases/status")
async def database_status():
    """Database status endpoint"""
    return [
        {
            "name": "arxiv",
            "status": "healthy",
            "response_time_ms": 45,
            "last_check": datetime.utcnow().isoformat(),
        },
        {
            "name": "pubmed",
            "status": "healthy",
            "response_time_ms": 67,
            "last_check": datetime.utcnow().isoformat(),
        },
    ]


@app.post("/api/v1/search/analyze")
async def analyze_endpoint():
    """Analysis endpoint"""
    return {
        "query": "test query",
        "analysis": {
            "key_concepts": ["AI", "machine learning", "research"],
            "trends": ["increasing interest in AI", "focus on practical applications"],
            "insights": [
                "Strong focus on practical AI applications",
                "Growing interdisciplinary research",
            ],
        },
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("test_server:app", host="0.0.0.0", port=8000, reload=True)
