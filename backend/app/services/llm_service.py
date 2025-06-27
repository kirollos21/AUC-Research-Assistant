"""
LLM Service for query expansion and semantic enrichment
"""

from app.core.config import settings
from app.schemas.search import QueryExpansion

import asyncio
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import openai
import google.generativeai as genai
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from abc import ABC, abstractmethod

if getattr(settings, "EMBEDDING_MODE", "local") == "local":
    from sentence_transformers import SentenceTransformer


logger = logging.getLogger(__name__)


class EmbeddingModel(ABC):
    """Abstract base class for embedding models."""

    @abstractmethod
    def get_embeddings(self, texts: List[str]) -> np.ndarray:
        """Generate embeddings for a list of texts."""
        pass


class SentenceTransformerEmbedding(EmbeddingModel):
    """Embedding model using sentence-transformers."""

    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model = SentenceTransformer(model_name)
        logger.info(f"SentenceTransformer embedding model initialized: {model_name}")

    def get_embeddings(self, texts: List[str]) -> np.ndarray:
        return self.model.encode(texts)


class OpenAIEmbedding(EmbeddingModel):
    """Embedding model using an OpenAI-compatible API."""

    def __init__(
        self, api_key: str, model_name: str, api_endpoint: Optional[str] = None
    ):
        if not api_key:
            raise ValueError("OpenAI API key is required for OpenAIEmbedding model.")

        self.client = openai.OpenAI(
            api_key=api_key, base_url=api_endpoint if api_endpoint else None
        )
        self.model_name = model_name
        logger.info(
            f"OpenAI embedding model initialized: {self.model_name} at endpoint: {api_endpoint or 'default OpenAI'}"
        )

    def get_embeddings(self, texts: List[str]) -> np.ndarray:
        try:
            # Filter out empty or whitespace-only strings which the API may reject
            valid_texts_with_indices = [
                (i, text) for i, text in enumerate(texts) if text and text.strip()
            ]
            if not valid_texts_with_indices:
                return np.array([])

            indices, valid_texts = zip(*valid_texts_with_indices)

            response = self.client.embeddings.create(
                input=list(valid_texts), model=self.model_name
            )

            api_embeddings = [item.embedding for item in response.data]

            # Reconstruct the embeddings array, inserting zero vectors for empty texts
            embedding_dim = len(api_embeddings[0])
            final_embeddings = [np.zeros(embedding_dim) for _ in range(len(texts))]

            for i, embedding in zip(indices, api_embeddings):
                final_embeddings[i] = np.array(embedding)

            return np.array(final_embeddings)
        except Exception as e:
            logger.error(f"Error getting embeddings from OpenAI: {e}")
            return np.array([])


class LLMService:
    """Service for LLM-based query understanding and expansion"""

    def __init__(self):
        self.openai_client: Optional[openai.OpenAI] = None
        self.embedding_model: Optional[EmbeddingModel] = None
        self.API_key = (
            "AIzaSyCYh4ZfYLhhPy_TrLFuid8Qz5QRXrayX64"  # THis is Tawfik's Gemini API key
        )
        self._initialize_models()

    def _initialize_models(self):
        """Initialize LLM and embedding models"""
        try:
            # Initialize OpenAI client if API key is available
            if settings.OPENAI_API_KEY:
                self.openai_client = openai.OpenAI(
                    api_key=settings.OPENAI_API_KEY,
                )
                logger.info("OpenAI client initialized")

            # Initialize embedding model based on config
            embedding_mode = settings.EMBEDDING_MODE
            logger.info(f"Embedding mode: {embedding_mode}")

            if embedding_mode == "openai":
                api_key = getattr(
                    settings,
                    "OPENAI_EMBEDDING_API_KEY",
                    getattr(settings, "OPENAI_API_KEY", None),
                )
                model_name = getattr(
                    settings, "OPENAI_EMBEDDING_MODEL", "text-embedding-3-small"
                )
                api_endpoint = getattr(settings, "OPENAI_EMBEDDING_API_ENDPOINT", None)

                if not api_key:
                    logger.warning(
                        "EMBEDDING_MODE is 'openai' but no API key is configured. Falling back to 'local' mode."
                    )
                    self.embedding_model = SentenceTransformerEmbedding()
                else:
                    self.embedding_model = OpenAIEmbedding(
                        api_key=api_key,
                        model_name=model_name,
                        api_endpoint=api_endpoint,
                    )
            else:  # default to local
                self.embedding_model = SentenceTransformerEmbedding()

        except Exception as e:
            logger.error(f"Error initializing LLM service: {e}")
            self.openai_client = None
            self.embedding_model = None

    async def expand_query(
        self, query: str, context: Optional[str] = None
    ) -> QueryExpansion:
        """
        Expand a search query using LLM to improve recall
        """
        try:
            # Generate query variants using different strategies
            synonyms = await self._generate_synonyms(query)
            related_terms = await self._generate_related_terms(query, context)
            semantic_variants = await self._generate_semantic_variants(query)

            # Combine all expansions
            expanded_queries = list(
                set(
                    [
                        query,  # Original query
                        # *synonyms,
                        *related_terms,
                        *semantic_variants,
                    ]
                )
            )

            return QueryExpansion(
                original_query=query,
                expanded_queries=expanded_queries,
                synonyms=synonyms,
                related_terms=related_terms,
                semantic_variants=semantic_variants,
            )

        except Exception as e:
            logger.error(f"Error expanding query '{query}': {e}")
            # Return minimal expansion on error
            return QueryExpansion(
                original_query=query,
                expanded_queries=[query],
                synonyms=["Exception generating synonyms"],
                related_terms=["Exception generating related terms"],
                semantic_variants=["Exception"],
            )

    # Tawfik: This is hardcoded with academic synonyms for now.
    async def _generate_synonyms(self, query: str) -> List[str]:
        """Generate synonyms for query terms"""
        synonyms = []

        # Simple academic synonym mapping (can be enhanced with thesaurus)
        academic_synonyms = {
            "machine learning": [
                "artificial intelligence",
                "AI",
                "ML",
                "deep learning",
            ],
            "artificial intelligence": [
                "machine learning",
                "AI",
                "ML",
                "neural networks",
            ],
            "neural networks": ["deep learning", "artificial neural networks", "ANN"],
            "climate change": [
                "global warming",
                "climate crisis",
                "environmental change",
            ],
            "renewable energy": ["clean energy", "sustainable energy", "green energy"],
            "covid": ["coronavirus", "sars-cov-2", "pandemic"],
            "cancer": ["oncology", "tumor", "neoplasm", "malignancy"],
            "diabetes": ["diabetes mellitus", "diabetic", "hyperglycemia"],
        }

        query_lower = query.lower()
        for term, syns in academic_synonyms.items():
            if term in query_lower:
                synonyms.extend(syns)

        return synonyms[:5]  # Limit to top 5 synonyms

    ## We will not be using OpenAI for generating related terms & semantic variants, instead we will use Gemini API since it is FREE!!
    async def _generate_semantic_variants(self, query: str) -> List[str]:
        """Generate semantic variants of the query using Gemini API"""
        if not hasattr(self, "API_key") or not self.API_key:
            return []

        try:
            # Configure Gemini API
            genai.configure(api_key=self.API_key)

            # Initialize the model
            model = genai.GenerativeModel("gemini-1.5-flash")

            prompt = f"""
            Rephrase this academic search query in 3 different ways while maintaining the same meaning:
            "{query}"
            
            Focus on:
            - Different word choices
            - Alternative phrasings
            - Academic language variations
            
            Return only the rephrased queries, one per line.
            """

            # Generate response
            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=150,
                    temperature=0.7,
                ),
            )

            if response and response.text:
                variants = [
                    variant.strip()
                    for variant in response.text.split("\n")
                    if variant.strip()
                ]
                return variants[:3]

        except Exception as e:
            logger.error(f"Error generating semantic variants with Gemini: {e}")

        return []

    async def _generate_related_terms(
        self, query: str, context: Optional[str] = None
    ) -> List[str]:
        """Generate related academic terms using Gemini API"""
        if not hasattr(self, "API_key") or not self.API_key:
            return []

        try:
            # Configure Gemini API
            genai.configure(api_key=self.API_key)

            # Initialize the model
            model = genai.GenerativeModel("gemini-1.5-flash")

            prompt = f"""
            Given the academic search query: "{query}"
            {f"Context: {context}" if context else ""}
            
            Generate 3 related academic terms or phrases that would help find relevant research papers.
            Focus on:
            - Technical terminology
            - Related research areas
            - Methodological approaches
            - Key concepts
            
            Return only the terms, one per line, without explanations.
            """

            # Generate response
            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=100,
                    temperature=0.7,
                ),
            )

            if response and response.text:
                terms = [
                    term.strip() for term in response.text.split("\n") if term.strip()
                ]
                return terms[:5]

        except Exception as e:
            logger.error(f"Error generating related terms with Gemini: {e}")

        return []

    async def _call_openai(self, prompt: str, max_tokens: int = 100) -> Optional[str]:
        """Call OpenAI API with error handling"""
        if not self.openai_client:
            logger.warning("OpenAI client not initialized. Cannot make API call.")
            return None
        try:
            response = await asyncio.to_thread(
                self.openai_client.chat.completions.create,
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=max_tokens,
                temperature=0.7,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            return None

    def get_embeddings(self, texts: List[str]) -> np.ndarray:
        """Generate embeddings for texts using the configured model"""
        try:
            if not self.embedding_model:
                logger.warning("Embedding model not available")
                return np.array([])

            return self.embedding_model.get_embeddings(texts)
        except Exception as e:
            logger.error(f"Error generating embeddings: {e}")
            return np.array([])

    def calculate_semantic_similarity(
        self, query: str, texts: List[str]
    ) -> List[float]:
        """Calculate semantic similarity between query and texts"""
        try:
            if not texts:
                return []

            # Get embeddings
            query_embedding = self.get_embeddings([query])
            text_embeddings = self.get_embeddings(texts)

            if query_embedding.size == 0 or text_embeddings.size == 0:
                return [0.0] * len(texts)

            # Calculate cosine similarity
            similarities = cosine_similarity(query_embedding, text_embeddings)[0]
            return similarities.tolist()

        except Exception as e:
            logger.error(f"Error calculating semantic similarity: {e}")
            return [0.0] * len(texts)

    async def extract_key_concepts(self, text: str) -> List[str]:
        """Extract key concepts from text using LLM"""
        if not self.openai_client:
            return []

        try:
            prompt = f"""
            Extract 5-10 key academic concepts, terms, or topics from this text:
            
            "{text[:1000]}..."
            
            Return only the key terms, one per line, focusing on:
            - Technical terms
            - Research methodologies
            - Subject areas
            - Important concepts
            """

            response = await self._call_openai(prompt, max_tokens=200)
            if response:
                concepts = [
                    concept.strip()
                    for concept in response.split("\n")
                    if concept.strip()
                ]
                return concepts[:10]

        except Exception as e:
            logger.error(f"Error extracting key concepts: {e}")

        return []

    async def generate_search_suggestions(
        self, query: str, results_count: int
    ) -> List[str]:
        """Generate search suggestions based on query and results"""
        if not self.openai_client or results_count > 10:
            return []

        try:
            prompt = f"""
            The search query "{query}" returned {results_count} results.
            
            Suggest 3-5 alternative or refined search queries that might yield better results.
            Consider:
            - More specific terms
            - Alternative keywords
            - Broader or narrower scope
            - Different research angles
            
            Return only the suggested queries, one per line.
            """

            response = await self._call_openai(prompt, max_tokens=150)
            if response:
                suggestions = [
                    suggestion.strip()
                    for suggestion in response.split("\n")
                    if suggestion.strip()
                ]
                return suggestions[:5]

        except Exception as e:
            logger.error(f"Error generating search suggestions: {e}")

        return []


# Global instance
llm_service = LLMService()
