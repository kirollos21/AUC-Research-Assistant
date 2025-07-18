"""
LLM client service for Mistral integration
"""

from typing import List, Dict, Any, Optional, Union
from langchain_mistralai.chat_models import ChatMistralAI
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
from app.core.config import settings


class DatabaseQuery(BaseModel):
    """Structure for database queries generated by LLM"""
    query: str = Field(description="Search query for academic database")
    focus: str = Field(description="Main focus or topic of this query")


class DatabaseQueries(BaseModel):
    """Collection of database queries"""
    queries: List[DatabaseQuery] = Field(
        description="List of 1-5 search queries for academic databases",
        min_length=1,
        max_length=5
    )


class LLMClient:
    """Mistral LLM client for query generation and RAG responses"""
    
    def __init__(self) -> None:
        if not settings.MISTRAL_API_KEY:
            raise ValueError("MISTRAL_API_KEY not found in settings")
        
        self.llm: ChatMistralAI = ChatMistralAI(
            model=settings.MISTRAL_LLM_MODEL,
            mistral_api_key=settings.MISTRAL_API_KEY,
            temperature=0.7,
            max_tokens=2000
        )
        
        self.query_parser: PydanticOutputParser = PydanticOutputParser(pydantic_object=DatabaseQueries)
    
    async def generate_database_queries(self, user_query: str) -> List[Dict[str, str]]:
        """
        Generate 1-5 database search queries from user input using structured output
        
        Args:
            user_query: The user's research question
            
        Returns:
            List of dictionaries with 'query' and 'focus' keys
        """
        system_prompt = """You are an expert academic research assistant. Your task is to generate 1-5 focused search queries for academic databases based on the user's research question.

Guidelines:
- Generate queries that will find relevant academic papers, articles, and research
- Each query should focus on a different aspect or perspective of the topic
- Use academic terminology and keywords
- Keep queries concise but specific
- Generate between 1-5 queries (more complex topics need more queries)
- Each query should have a clear focus description

{format_instructions}"""

        human_prompt: str = f"""User research question: {user_query}

Generate targeted search queries for academic databases that will help find relevant research papers and articles."""

        messages: List[Union[SystemMessage, HumanMessage]] = [
            SystemMessage(content=system_prompt.format(
                format_instructions=self.query_parser.get_format_instructions()
            )),
            HumanMessage(content=human_prompt)
        ]
        
        try:
            response = await self.llm.ainvoke(messages)
            parsed_queries: DatabaseQueries = self.query_parser.parse(response.content)
            
            return [
                {"query": q.query, "focus": q.focus} 
                for q in parsed_queries.queries
            ]
        except Exception as e:
            # Fallback: return the original query if structured output fails
            return [{"query": user_query, "focus": "Original query"}]
    
    async def generate_rag_response(
        self, 
        user_query: str, 
        context_documents: List[Dict[str, Any]]
    ) -> str:
        """
        Generate response using retrieved documents as context
        
        Args:
            user_query: The user's original question
            context_documents: List of relevant documents from vector search
            
        Returns:
            Generated response based on the context
        """
        # Format context documents
        context_text: str = ""
        for i, doc in enumerate(context_documents, 1):
            title: str = doc.get('title', 'Unknown Title')
            abstract: str = doc.get('abstract', 'No abstract available')
            authors: List[str] = doc.get('authors', [])
            authors_str: str = ', '.join(authors) if authors else 'Unknown Authors'
            
            context_text += f"\n--- Document {i} ---\n"
            context_text += f"Title: {title}\n"
            context_text += f"Authors: {authors_str}\n"
            context_text += f"Abstract: {abstract}\n"
        
        system_prompt: str = """You are an expert academic research assistant. Your task is to answer the user's research question based on the provided academic documents.

Guidelines:
- Use only the information from the provided documents
- Cite specific papers when making claims (use the document titles)
- If the documents don't contain enough information to answer the question, say so
- Provide a comprehensive answer that synthesizes information from multiple sources
- Maintain academic tone and accuracy
- If you find conflicting information, acknowledge it and explain the different perspectives"""

        human_prompt: str = f"""User question: {user_query}

Relevant academic documents:
{context_text}

Please provide a comprehensive answer to the user's question based on the academic documents provided above."""

        messages: List[Union[SystemMessage, HumanMessage]] = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=human_prompt)
        ]
        
        try:
            response = await self.llm.ainvoke(messages)
            return response.content
        except Exception as e:
            return f"I apologize, but I encountered an error while generating the response: {str(e)}"


# Global instance
_llm_client: Optional[LLMClient] = None

def get_llm_client() -> LLMClient:
    """Get or create LLM client instance"""
    global _llm_client
    if _llm_client is None:
        _llm_client = LLMClient()
    return _llm_client