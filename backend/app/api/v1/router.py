"""
Main API router for v1 endpoints
"""

from fastapi import APIRouter

# Import endpoint routers
from app.api.v1.endpoints import search

api_router = APIRouter()

# Health check endpoints (these are already in main.py, but keeping for reference)
@api_router.get("/ping")
async def ping():
    """Simple ping endpoint for API health check"""
    return {"message": "pong", "status": "ok"}

# Include endpoint routers
api_router.include_router(search.router, prefix="/search", tags=["search"])

# Future endpoint routers (to be implemented)
# api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
# api_router.include_router(users.router, prefix="/users", tags=["users"])
# api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
# api_router.include_router(research.router, prefix="/research", tags=["research"]) 