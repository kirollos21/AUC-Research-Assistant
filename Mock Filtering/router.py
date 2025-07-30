from fastapi import APIRouter, Request
from typing import List, Dict

api_router = APIRouter()  # Renamed to api_router to match your import in main.py


# Example mock function (replace with your real arXiv search function)
async def search_arxiv_logic(query: str) -> List[Dict]:
    # Simulate returned results from arXiv — replace this with actual API call logic
    return [
        {
            "id": "123",
            "title": "Deep Learning in Healthcare",
            "abstract": "This paper explores deep learning methods...",
            "authors": [{"name": "John Doe"}],
            "publication_date": "2022-01-01",
            "url": "https://arxiv.org/abs/123",
            "doi": "10.1000/xyz123",
            "accessType": "open",
        },
        {
            "id": "456",
            "title": "Restricted Access Paper Example",
            "abstract": "A restricted access study...",
            "authors": [{"name": "Jane Smith"}],
            "publication_date": "2023-01-01",
            "url": "https://example.com/restricted-paper",
            "doi": "10.1000/xyz456",
            "accessType": "restricted",
        },
    ]


@api_router.post("/search_arxiv")
async def search_arxiv(request: Request):
    data = await request.json()
    query = data.get("query")
    access_type = data.get("access_type", "all")

    if not query:
        return {"error": "Query is required"}

    results = await search_arxiv_logic(query)

    # Apply server-side access type filtering
    if access_type != "all":
        results = [r for r in results if r.get("accessType") == access_type]

    return results
