"""
Main API router for v1 endpoints
"""

from fastapi import APIRouter

# Import endpoint routers
from app.api.v1.endpoints import query

api_router = APIRouter()


# Health check endpoints (these are already in main.py, but keeping for reference)
@api_router.get("/ping")
async def ping():
    """Simple ping endpoint for API health check"""
    return {"message": "pong", "status": "ok"}


# Include endpoint routers
api_router.include_router(query.router, prefix="/query", tags=["query"])
