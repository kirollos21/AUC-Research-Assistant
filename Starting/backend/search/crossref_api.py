import requests
from typing import List, Dict
from ..utils.logger import logger
from ..config import settings

def search_crossref(query: str, rows: int = 5) -> List[Dict]:
    params = {"query": query, "rows": rows}
    logger.info("Calling Crossref API")
    resp = requests.get(settings.CROSSREF_API_URL, params=params, timeout=10)
    resp.raise_for_status()
    items = resp.json()["message"]["items"]
    return [
        {"title": item.get("title", [""])[0], "source": "Crossref"}
        for item in items
    ]

