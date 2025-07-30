"""
Application configuration management
"""

from typing import List, Literal, Optional
from pydantic import PositiveFloat, PositiveInt
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

    # LLM settings
    LLM_PROVIDER: Literal["openai", "mistral"] = "mistral"
    LLM_MODEL: str = "mistral-medium-latest"
    LLM_TEMPERATURE: PositiveFloat = 0.7
    LLM_MAX_OUTPUT_TOKENS: PositiveInt = 2000
    # In case the provider is chosen to be `openai`, you can choose a different API base URL
    LLM_OPENAI_BASEURL: str = "https://api.openai.com/v1"
    OPENAI_API_KEY: Optional[str] = None

    # Mistral AI
    MISTRAL_API_KEY: Optional[str] = None
    MISTRAL_EMBEDDING_MODEL: str = "mistral-embed"  # 1024 dimensions

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
    # Tells Chroma not to send anonymous telemetry data
    ANONYMIZED_TELEMETRY: bool = False

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
    LOG_LEVEL: str = "DEBUG"
    LOG_FORMAT: str = "{asctime} [{levelname}] {name}: {message}"
    # Default will be True if running in a TTY and not on Windows
    LOG_USE_COLORED_OUTPUT: Literal[True, False, "Default"] = "Default"

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    CORS_CREDENTIALS: bool = True
    CORS_METHODS: List[str] = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    CORS_HEADERS: List[str] = ["*"]

    # TODO: implement
    EMBEDDING_PROVIDER: Literal["local", "mistral"] = "local"

    # Mistral embedding uses the hf_token to download the tokenizer. Without it it uses a len()
    # based tokenizer that is not optimized. More can be found here https://github.com/langchain-ai/langchain/issues/20618
    HF_TOKEN: Optional[str] = None

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


# Global settings instance
settings = get_settings()