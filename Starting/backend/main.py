"""
backend/main.py
Entry-point for the mini federated-search prototype.
Run from the project root with:
    python -m backend.main "your search query"
"""

import argparse

# ⬇️  use *relative* imports so Python knows we’re inside the “backend” package
from .search import federated_search
from .ranking.basic import keyword_rank
from .utils.logger import logger


def run(query: str, k: int) -> None:
    """Execute federated search, rank results, and print them."""
    combined = federated_search(query, k)
    ranked = keyword_rank(combined, query)

    for idx, item in enumerate(ranked, 1):
        print(f"{idx:02}. ({item['source']}) {item['title']}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Mini federated search POC")
    parser.add_argument("query", help="Search query (e.g. 'computer vision')")
    parser.add_argument(
        "-k", type=int, default=5, help="Number of results per source"
    )
    args = parser.parse_args()

    logger.info("Starting Search")
    run(args.query, args.k)
