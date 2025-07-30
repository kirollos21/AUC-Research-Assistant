#!/usr/bin/env python3
"""
Utility script to clear the ChromaDB vector database collection.
Useful for fixing embedding dimension mismatch issues.
"""

import asyncio
import os
import sys

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.embedding_client import get_embedding_client
from app.core.config import settings


async def clear_vector_database():
    """Clear the ChromaDB collection"""
    try:
        print("Initializing embedding client...")
        embedding_client = get_embedding_client()

        print("Clearing vector database collection...")
        await embedding_client.clear_collection()

        print("✅ Vector database collection cleared successfully!")
        print(f"Collection directory: {settings.CHROMA_PERSIST_DIRECTORY}")
        print(
            "\nYou can now restart your application and it will create a new collection"
        )
        print("with the correct embedding dimensions.")

    except Exception as e:
        print(f"❌ Error clearing vector database: {e}")
        return False

    return True


if __name__ == "__main__":
    print("🧹 ChromaDB Collection Cleaner")
    print("=" * 40)

    result = asyncio.run(clear_vector_database())

    if result:
        print("\n🎉 Success! Your vector database has been cleared.")
    else:
        print("\n💥 Failed to clear vector database.")
        sys.exit(1)
