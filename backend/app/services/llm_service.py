"""
LLM Service for query expansion and semantic enrichment
"""

import asyncio
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import openai
from sentence_transformers import SentenceTransformer
import google.generativeai as genai
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

from app.core.config import settings
from app.schemas.search import QueryExpansion


logger = logging.getLogger(__name__)


class LLMService:
    """Service for LLM-based query understanding and expansion"""
    
    def __init__(self):
        self.openai_client = None
        self.embedding_model = None
        self.API_key = "AIzaSyCYh4ZfYLhhPy_TrLFuid8Qz5QRXrayX64"  # THis is Tawfik's Gemini API key
        self._initialize_models()
    
    def _initialize_models(self):
        """Initialize LLM and embedding models"""
        try:
            # Initialize OpenAI client if API key is available
            if settings.OPENAI_API_KEY:
                openai.api_key = settings.OPENAI_API_KEY
                self.openai_client = openai
                logger.info("OpenAI client initialized")
            
            # Initialize local embedding model
            self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
            logger.info("Local embedding model initialized")
            
        except Exception as e:
            logger.error(f"Error initializing LLM service: {e}")
    
    async def expand_query(self, query: str, context: Optional[str] = None) -> QueryExpansion:
        """
        Expand a search query using LLM to improve recall
        """
        try:
            # Generate query variants using different strategies
            synonyms = await self._generate_synonyms(query)
            related_terms = await self._generate_related_terms(query, context)
            semantic_variants = await self._generate_semantic_variants(query)
            
            # Combine all expansions
            expanded_queries = list(set([
                query,  # Original query
                *synonyms,
                *related_terms,
                *semantic_variants
            ]))
            
            return QueryExpansion(
                original_query=query,
                expanded_queries=expanded_queries,
                synonyms=synonyms,
                related_terms=related_terms,
                semantic_variants=semantic_variants
            )
            
        except Exception as e:
            logger.error(f"Error expanding query '{query}': {e}")
            # Return minimal expansion on error
            return QueryExpansion(
                original_query=query,
                expanded_queries=[query],
                synonyms=["Exception generating synonyms"],
                related_terms=["Exception generating related terms"],
                semantic_variants=["Exception"]
            )
    
    async def _generate_synonyms(self, query: str) -> List[str]:
        """Generate synonyms for query terms"""
        synonyms = []
        
        # Simple academic synonym mapping (can be enhanced with thesaurus)
        academic_synonyms = {
            "machine learning": ["artificial intelligence", "AI", "ML", "deep learning"],
            "artificial intelligence": ["machine learning", "AI", "ML", "neural networks"],
            "neural networks": ["deep learning", "artificial neural networks", "ANN"],
            "climate change": ["global warming", "climate crisis", "environmental change"],
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
    

    # async def _generate_related_terms(self, query: str, context: Optional[str] = None) -> List[str]:
    #     """Generate related academic terms"""
    #     if not self.openai_client:
    #         return []
        
    #     try:
    #         prompt = f"""
    #         Given the academic search query: "{query}"
    #         {f"Context: {context}" if context else ""}
            
    #         Generate 3-5 related academic terms or phrases that would help find relevant research papers.
    #         Focus on:
    #         - Technical terminology
    #         - Related research areas
    #         - Methodological approaches
    #         - Key concepts
            
    #         Return only the terms, one per line, without explanations.
    #         """
            
    #         response = await self._call_openai(prompt, max_tokens=100)
    #         if response:
    #             terms = [term.strip() for term in response.split('\n') if term.strip()]
    #             return terms[:5]
            
    #     except Exception as e:
    #         logger.error(f"Error generating related terms: {e}")
        
    #     return []
    
    # async def _generate_semantic_variants(self, query: str) -> List[str]:
    #     """Generate semantic variants of the query"""
    #     if not self.openai_client:
    #         return []
        
    #     try:
    #         prompt = f"""
    #         Rephrase this academic search query in 3 different ways while maintaining the same meaning:
    #         "{query}"
            
    #         Focus on:
    #         - Different word choices
    #         - Alternative phrasings
    #         - Academic language variations
            
    #         Return only the rephrased queries, one per line.
    #         """
            
    #         response = await self._call_openai(prompt, max_tokens=150)
    #         if response:
    #             variants = [variant.strip() for variant in response.split('\n') if variant.strip()]
    #             return variants[:3]
            
    #     except Exception as e:
    #         logger.error(f"Error generating semantic variants: {e}")
        
    #     return []
    
    ## We will not be using OpenAI for generating related terms & semantic variants, instead we will use Gemini API since it is FREE!!
    async def _generate_semantic_variants(self, query: str) -> List[str]:
        """Generate semantic variants of the query using Gemini API"""
        if not hasattr(self, 'API_key') or not self.API_key:
            return []
        
        try:
            # Configure Gemini API
            genai.configure(api_key=self.API_key)
            
            # Initialize the model
            model = genai.GenerativeModel('gemini-1.5-flash')
            
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
                )
            )
            
            if response and response.text:
                variants = [variant.strip() for variant in response.text.split('\n') if variant.strip()]
                return variants[:3]
                
        except Exception as e:
            logger.error(f"Error generating semantic variants with Gemini: {e}")
        
        return []
    
    async def _generate_related_terms(self, query: str, context: Optional[str] = None) -> List[str]:
        """Generate related academic terms using Gemini API"""
        if not hasattr(self, 'API_key') or not self.API_key:
            return []
        
        try:
            # Configure Gemini API
            genai.configure(api_key=self.API_key)
            
            # Initialize the model
            model = genai.GenerativeModel('gemini-1.5-flash')
            
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
                )
            )
            
            if response and response.text:
                terms = [term.strip() for term in response.text.split('\n') if term.strip()]
                return terms[:5]
                
        except Exception as e:
            logger.error(f"Error generating related terms with Gemini: {e}")
        
        return []
    
    async def _call_openai(self, prompt: str, max_tokens: int = 100) -> Optional[str]:
        """Call OpenAI API with error handling"""
        try:
            response = await asyncio.to_thread(
                self.openai_client.ChatCompletion.create,
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=max_tokens,
                temperature=0.7
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            return None
    
    def get_embeddings(self, texts: List[str]) -> np.ndarray:
        """Generate embeddings for texts using local model"""
        try:
            if not self.embedding_model:
                logger.warning("Embedding model not available")
                return np.array([])
            
            embeddings = self.embedding_model.encode(texts)
            return embeddings
        except Exception as e:
            logger.error(f"Error generating embeddings: {e}")
            return np.array([])
    
    def calculate_semantic_similarity(self, query: str, texts: List[str]) -> List[float]:
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
                concepts = [concept.strip() for concept in response.split('\n') if concept.strip()]
                return concepts[:10]
            
        except Exception as e:
            logger.error(f"Error extracting key concepts: {e}")
        
        return []
    
    async def generate_search_suggestions(self, query: str, results_count: int) -> List[str]:
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
                suggestions = [suggestion.strip() for suggestion in response.split('\n') if suggestion.strip()]
                return suggestions[:5]
            
        except Exception as e:
            logger.error(f"Error generating search suggestions: {e}")
        
        return []


# Global instance
llm_service = LLMService() 