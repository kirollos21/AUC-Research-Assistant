import requests
from typing import List, Dict
from ..utils.logger import logger
from ..config import settings

def search_arxiv(query: str, max_results: int = 5) -> List[Dict]:
    params = {"search_query": query, "start": 0, "max_results": max_results}
    logger.info("Calling arXiv API")
    resp = requests.get(settings.ARXIV_API_URL, params=params, timeout=10)
    resp.raise_for_status()
    # Very small XML parser to keep it beginner-friendly
    entries = []
    for line in resp.text.splitlines():
        if line.strip().startswith("<title>") and "arXiv:" not in line:
            title = line.replace("<title>", "").replace("</title>", "").strip()
            entries.append({"title": title, "source": "arXiv"})
    return entries

