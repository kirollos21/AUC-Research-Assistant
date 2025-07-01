from typing import List, Dict
from .arxiv_api import search_arxiv
from .crossref_api import search_crossref

def federated_search(query: str, k: int = 5) -> List[Dict]:
    # 1. parallel calls would be better, but sequential is clearer for now
    results = search_arxiv(query, k) + search_crossref(query, k)
    # 2. deduplicate by lower-cased title
    seen = set()
    deduped = []
    for item in results:
        key = item["title"].lower()
        if key not in seen:
            seen.add(key)
            deduped.append(item)
    return deduped

