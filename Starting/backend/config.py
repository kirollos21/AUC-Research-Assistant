from pydantic import BaseModel
import os
from dotenv import load_dotenv

load_dotenv()  # reads .env file in project root

class Settings(BaseModel):
    ARXIV_API_URL: str = "https://export.arxiv.org/api/query"
    CROSSREF_API_URL: str = "https://api.crossref.org/works"
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_USER: str = os.getenv("DB_USER", "root")
    DB_PASS: str = os.getenv("DB_PASS", "root")
    DB_NAME: str = os.getenv("DB_NAME", "research_assistant")

settings = Settings()

