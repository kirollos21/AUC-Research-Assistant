"""
Application configuration management
"""

from typing import List, Optional
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings"""

    # Application
    APP_NAME: str = "AUC Research Assistant"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Database
    DATABASE_URL: Optional[str] = None
    DATABASE_TEST_URL: Optional[str] = None

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Security
    SECRET_KEY: str = "your-super-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # AI/ML APIs
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_ORG_ID: Optional[str] = None

    # Mistral AI
    MISTRAL_API_KEY: Optional[str] = None
    MISTRAL_LLM_MODEL: str = "mistral-medium-latest"
    MISTRAL_EMBEDDING_MODEL: str = "mistral-embed"  # 1024 dimensions
    # Alternative models for 384 dimensions: "all-MiniLM-L6-v2", "all-mpnet-base-v2"

    # Cohere AI
    # If not set, will skip the reranking step
    COHERE_API_KEY: Optional[str] = None
    COHERE_RERANK_MODEL: str = "rerank-v3.5"
    COHERE_TOP_N: int = 10

    # Semantic Scholar API
    # If not set, will proceed without API key (higher rate limits apply)
    SEMANTIC_SCHOLAR_API_KEY: Optional[str] = None

    # Vector Database
    VECTOR_DB_TYPE: str = "chromadb"
    CHROMA_PERSIST_DIRECTORY: str = "./data/chroma_db"

    # RAG Configuration
    RAG_TOP_K: int = 20
    RAG_DATABASE_CANDIDATES: int = 50
    RAG_CHUNK_SIZE: int = 1000
    RAG_CHUNK_OVERLAP: int = 200
    RAG_MAX_DATABASE_QUERIES: int = 5

    # File Upload
    MAX_FILE_SIZE: int = 10485760  # 10MB
    UPLOAD_DIRECTORY: str = "./uploads"
    ALLOWED_EXTENSIONS: List[str] = ["pdf", "txt", "docx", "xlsx", "csv"]

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    CORS_CREDENTIALS: bool = True
    CORS_METHODS: List[str] = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    CORS_HEADERS: List[str] = ["*"]

    EMBEDDING_MODE: str = "local"

    # Settings for 'openai' embedding mode
    # You can use a different key for embeddings if needed, otherwise OPENAI_API_KEY will be used
    OPENAI_EMBEDDING_API_KEY: str = "your-openai-api-key"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"
    # Optional: specify a different endpoint for OpenAI-compatible APIs
    OPENAI_EMBEDDING_API_ENDPOINT: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


# Global settings instance
settings = get_settings()
