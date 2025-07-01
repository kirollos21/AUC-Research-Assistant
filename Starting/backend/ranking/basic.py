from typing import List, Dict

def keyword_rank(results: List[Dict], query: str) -> List[Dict]:
    query_terms = set(query.lower().split())
    for r in results:
        title_terms = set(r["title"].lower().split())
        r["score"] = len(query_terms & title_terms)
    return sorted(results, key=lambda x: x["score"], reverse=True)

