"""
OpenAI-compatible chat completions endpoint

NOTE: this module still needs some testing.
"""

import asyncio
import hashlib
import json
import logging
import time
import uuid
from typing import Any, AsyncIterator, Dict, List, Optional, cast

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from langchain_core.messages.base import BaseMessageChunk
from pydantic import BaseModel, Field, PositiveInt

from app.core.config import SearchEngineName, settings
from app.schemas.search import (
    AccessType,
    CitationStyle,
    FederatedSearchResponse,
    SearchQuery,
    SearchResult,
    SentDocument,
)
from app.services.cohere_reranker import get_cohere_reranker
from app.services.embedding_client import get_embedding_client
from app.services.federated_search_service import FederatedSearchService
from app.services.llm_client import ChatMessage, get_llm_client

logger = logging.getLogger(__name__)
router = APIRouter()


class ChatMessageDelta(BaseModel):
    """OpenAI-compatible delta message format for streaming"""

    role: Optional[str] = None
    content: Optional[str] = None


class ChatCompletionRequest(BaseModel):
    """OpenAI-compatible chat completion request"""

    model: str = Field(default="gpt-3.5-turbo", description="Model to use")
    messages: List[ChatMessage] = Field(..., description="List of messages")
    stream: bool = Field(default=False, description="Whether to stream the output")
    temperature: Optional[float] = Field(
        default=None, description="Temperature for generation"
    )
    max_tokens: Optional[int] = Field(
        default=None, description="Maximum tokens to generate"
    )

    # Custom parameters for our research assistant
    stream_events: bool = Field(
        default=False, description="Stream internal research events"
    )
    max_results: Optional[int] = Field(
        default=None, description="Maximum results per database"
    )
    top_k: Optional[int] = Field(
        default=None, description="Number of top documents for RAG"
    )
    databases: Optional[List[SearchEngineName]] = Field(
        default=settings.ENABLED_SEARCH_ENGINES,
        description="List of databases to search",
    )
    access_filter: AccessType | None = None
    citation_style: CitationStyle = "IEEE"


class ChatCompletionChoice(BaseModel):
    """OpenAI-compatible choice format"""

    index: int
    delta: ChatMessageDelta
    finish_reason: Optional[str] = None


class ChatCompletionChunk(BaseModel):
    """OpenAI-compatible streaming chunk"""

    id: str
    object: str = "chat.completion.chunk"
    created: int
    model: str
    choices: List[ChatCompletionChoice]
    system_fingerprint: Optional[str] = None


def get_system_fingerprint() -> str:
    """Generate system fingerprint from global settings"""
    settings_dict = settings.model_dump()
    # Convert to string and hash
    settings_str = json.dumps(settings_dict, sort_keys=True)
    return hashlib.sha256(settings_str.encode()).hexdigest()[:16]


@router.post("/chat/completions")
async def create_chat_completion(request: ChatCompletionRequest):
    """
    OpenAI-compatible chat completions endpoint with research capabilities
    """
    if not request.stream:
        raise HTTPException(
            status_code=400,
            detail="Non-streaming mode not yet implemented. Please set stream=true",
        )

    # Extract user messages and determine if this is first message
    user_messages = [msg for msg in request.messages if msg.role == "user"]
    if not user_messages:
        raise HTTPException(status_code=400, detail="No user message found")

    is_first_message = len(user_messages) == 1
    user_query = user_messages[-1].content  # Use the last user message
    conversation_history = request.messages  # Store entire conversation

    async def generate_openai_stream():
        """Generate OpenAI-compatible streaming response"""
        # Note: To make this function easier to navigate, it is divided into the following steps, which can also be found in comments in the code itself:
        # Step 1: Generate database queries (pass entire conversation)
        # Step 2: Search databases
        # Step 3: Process and embed documents
        # Step 4: Retrieve top-k documents
        # Step 4.5: Rerank documents using Cohere
        # Step 5: Generate streaming LLM response
        completion_id = str(uuid.uuid4())
        created = int(time.time())
        system_fingerprint = get_system_fingerprint()

        try:
            logger.info(
                f"Starting OpenAI-compatible chat completion for query: {user_query[:100]}..."
            )
            logger.info(
                f"Request parameters - model: {request.model}, stream_events: {request.stream_events}, max_results: {request.max_results}, top_k: {request.top_k}"
            )

            # Send initial empty assistant message
            initial_chunk = ChatCompletionChunk(
                id=completion_id,
                created=created,
                model=request.model,
                choices=[
                    ChatCompletionChoice(
                        index=0,
                        delta=ChatMessageDelta(role="assistant", content=""),
                        finish_reason=None,
                    )
                ],
                system_fingerprint=system_fingerprint,
            )
            yield f"data: {initial_chunk.model_dump_json()}\n\n"

            logger.debug("Sent initial assistant message chunk")

            # Initialize services
            logger.info("Starting service initialization")
            llm_client = get_llm_client()
            embedding_client = get_embedding_client()
            search_service = FederatedSearchService()
            logger.info("Service initialization completed")

            # Handle first message: ask for clarifications instead of doing search
            if is_first_message:
                logger.info("First message detected - generating clarification request")

                if request.stream_events:
                    event_chunk = ChatCompletionChunk(
                        id=completion_id,
                        created=created,
                        model=request.model,
                        choices=[
                            ChatCompletionChoice(
                                index=0,
                                delta=ChatMessageDelta(
                                    content="<event>Analyzing query for clarifications...</event>"
                                ),
                                finish_reason=None,
                            )
                        ],
                        system_fingerprint=system_fingerprint,
                    )
                    yield f"data: {event_chunk.model_dump_json()}\n\n"

                # Generate streaming clarification response
                clarification_stream = await llm_client.generate_clarification_request(
                    user_query
                )
                logger.debug(
                    f"Got clarification_stream object with type {type(clarification_stream)}."
                )

                chunk_count = 0
                async for chunk in clarification_stream:
                    chunk_count += 1
                    chunk_data = ChatCompletionChunk(
                        id=completion_id,
                        created=created,
                        model=request.model,
                        choices=[
                            ChatCompletionChoice(
                                index=0,
                                delta=ChatMessageDelta(
                                    content=cast(str, chunk.content)
                                ),
                                finish_reason=None,
                            )
                        ],
                        system_fingerprint=system_fingerprint,
                    )
                    yield f"data: {chunk_data.model_dump_json()}\n\n"

                logger.info(
                    f"Generated clarification response with {chunk_count} chunks"
                )

                # Send final chunk
                final_chunk = ChatCompletionChunk(
                    id=completion_id,
                    created=created,
                    model=request.model,
                    choices=[
                        ChatCompletionChoice(
                            index=0, delta=ChatMessageDelta(), finish_reason="stop"
                        )
                    ],
                    system_fingerprint=system_fingerprint,
                )
                yield f"data: {final_chunk.model_dump_json()}\n\n"
                yield "data: [DONE]\n\n"
                logger.info("First message clarification completed")
                return

            # Step 1: Generate database queries (pass entire conversation)
            logger.info("Step 1: Starting database query generation")

            if request.stream_events:
                event_chunk = ChatCompletionChunk(
                    id=completion_id,
                    created=created,
                    model=request.model,
                    choices=[
                        ChatCompletionChoice(
                            index=0,
                            delta=ChatMessageDelta(
                                content="<event>Generating search queries...</event>"
                            ),
                            finish_reason=None,
                        )
                    ],
                    system_fingerprint=system_fingerprint,
                )
                yield f"data: {event_chunk.model_dump_json()}\n\n"
                logger.debug("Sent query generation start event")

            database_queries: List[
                Dict[str, str]
            ] = await llm_client.generate_database_queries_from_conversation(
                conversation_history
            )
            logger.info(
                f"Step 1 completed: Generated {len(database_queries)} database queries"
            )

            if request.stream_events:
                queries_info = (
                    f"<event>Generated {len(database_queries)} search queries</event>"
                )
                event_chunk = ChatCompletionChunk(
                    id=completion_id,
                    created=created,
                    model=request.model,
                    choices=[
                        ChatCompletionChoice(
                            index=0,
                            delta=ChatMessageDelta(content=queries_info),
                            finish_reason=None,
                        )
                    ],
                    system_fingerprint=system_fingerprint,
                )
                yield f"data: {event_chunk.model_dump_json()}\n\n"
                logger.debug(
                    f"Sent query generation completion event: {len(database_queries)} queries"
                )

            # Step 2: Search databases
            logger.info("Step 2: Starting database search")

            if request.stream_events:
                event_chunk = ChatCompletionChunk(
                    id=completion_id,
                    created=created,
                    model=request.model,
                    choices=[
                        ChatCompletionChoice(
                            index=0,
                            delta=ChatMessageDelta(
                                content="<event>Searching academic databases...</event>"
                            ),
                            finish_reason=None,
                        )
                    ],
                    system_fingerprint=system_fingerprint,
                )
                yield f"data: {event_chunk.model_dump_json()}\n\n"
                logger.debug("Sent database search start event")

            all_documents: List[SearchResult] = []
            max_results: int = request.max_results or settings.RAG_DATABASE_CANDIDATES

            for i, query_info in enumerate(database_queries):
                search_query: str = query_info["query"]
                logger.info(
                    f"Executing search {i + 1}/{len(database_queries)}: {query_info['focus']} - Query: {search_query[:50]}..."
                )

                if request.stream_events:
                    search_event = f"<event>Searching with query {i + 1}/{len(database_queries)}: {query_info['focus']}</event>"
                    event_chunk = ChatCompletionChunk(
                        id=completion_id,
                        created=created,
                        model=request.model,
                        choices=[
                            ChatCompletionChoice(
                                index=0,
                                delta=ChatMessageDelta(content=search_event),
                                finish_reason=None,
                            )
                        ],
                        system_fingerprint=system_fingerprint,
                    )
                    yield f"data: {event_chunk.model_dump_json()}\n\n"
                    logger.debug(f"Sent search progress event for query {i + 1}")

                try:
                    search_response: FederatedSearchResponse = (
                        await search_service.search(
                            SearchQuery(
                                query=search_query,
                                max_results=max_results,
                                databases=request.databases,
                            )
                        )
                    )
                    if search_response and search_response.results:
                        all_documents.extend(search_response.results)
                        logger.info(
                            f"Search {i + 1} completed: Found {len(search_response.results)} documents"
                        )
                    else:
                        logger.warning(f"Search {i + 1} returned no results")
                except Exception as e:
                    logger.error(f"Search {i + 1} failed: {str(e)}")
                    if request.stream_events:
                        error_event = (
                            f"<event>Error searching with query: {str(e)}</event>"
                        )
                        event_chunk = ChatCompletionChunk(
                            id=completion_id,
                            created=created,
                            model=request.model,
                            choices=[
                                ChatCompletionChoice(
                                    index=0,
                                    delta=ChatMessageDelta(content=error_event),
                                    finish_reason=None,
                                )
                            ],
                            system_fingerprint=system_fingerprint,
                        )
                        yield f"data: {event_chunk.model_dump_json()}\n\n"
                        logger.debug(f"Sent error event for search {i + 1}")
                    continue

            logger.info(
                f"Step 2 completed: Retrieved {len(all_documents)} total documents"
            )

            # Remove duplicates
            logger.info("Starting document deduplication")
            unique_documents: List[SearchResult] = []
            seen_titles: set[str] = set()
            for doc in all_documents:
                title_lower: str = doc.title.lower().strip()
                if title_lower and title_lower not in seen_titles:
                    seen_titles.add(title_lower)
                    unique_documents.append(doc)

            logger.info(
                f"Deduplication completed: {len(unique_documents)} unique documents from {len(all_documents)} total"
            )

            if request.stream_events:
                found_event = (
                    f"<event>Found {len(unique_documents)} unique documents</event>"
                )
                event_chunk = ChatCompletionChunk(
                    id=completion_id,
                    created=created,
                    model=request.model,
                    choices=[
                        ChatCompletionChoice(
                            index=0,
                            delta=ChatMessageDelta(content=found_event),
                            finish_reason=None,
                        )
                    ],
                    system_fingerprint=system_fingerprint,
                )
                yield f"data: {event_chunk.model_dump_json()}\n\n"
                logger.debug("Sent document count event")

            # Step 3: Process and embed documents
            logger.info("Step 3: Starting document processing and embedding")

            if request.stream_events:
                event_chunk = ChatCompletionChunk(
                    id=completion_id,
                    created=created,
                    model=request.model,
                    choices=[
                        ChatCompletionChoice(
                            index=0,
                            delta=ChatMessageDelta(
                                content="<event>Processing and embedding documents...</event>"
                            ),
                            finish_reason=None,
                        )
                    ],
                    system_fingerprint=system_fingerprint,
                )
                yield f"data: {event_chunk.model_dump_json()}\n\n"
                logger.debug("Sent document processing start event")

            if unique_documents:
                await embedding_client.process_and_store_documents(unique_documents)
                logger.info(
                    f"Step 3 completed: Processed and embedded {len(unique_documents)} documents"
                )
            else:
                logger.warning("Step 3 skipped: No documents to process")

            # Step 4: Retrieve top-k documents
            logger.info("Step 4: Starting similarity search for top-k documents")

            if request.stream_events:
                event_chunk = ChatCompletionChunk(
                    id=completion_id,
                    created=created,
                    model=request.model,
                    choices=[
                        ChatCompletionChoice(
                            index=0,
                            delta=ChatMessageDelta(
                                content="<event>Finding most relevant documents...</event>"
                            ),
                            finish_reason=None,
                        )
                    ],
                    system_fingerprint=system_fingerprint,
                )
                yield f"data: {event_chunk.model_dump_json()}\n\n"
                logger.debug("Sent similarity search start event")

            top_k: int = request.top_k or settings.RAG_TOP_K
            top_documents: list[
                SentDocument
            ] = await embedding_client.similarity_search(
                query=user_query, k=top_k, access_filter=request.access_filter
            )
            logger.info(
                f"Step 4 completed: Retrieved {len(top_documents)} top documents from similarity search"
            )

            # Step 4.5: Rerank documents using Cohere
            top_n: int = settings.COHERE_TOP_N
            reranker = get_cohere_reranker()
            if reranker.is_available() and top_documents:
                logger.info("Step 4.5: Starting document reranking with Cohere")

                if request.stream_events:
                    event_chunk = ChatCompletionChunk(
                        id=completion_id,
                        created=created,
                        model=request.model,
                        choices=[
                            ChatCompletionChoice(
                                index=0,
                                delta=ChatMessageDelta(
                                    content="<event>Reranking documents with Cohere...</event>"
                                ),
                                finish_reason=None,
                            )
                        ],
                        system_fingerprint=system_fingerprint,
                    )
                    yield f"data: {event_chunk.model_dump_json()}\n\n"
                    logger.debug("Sent reranking start event")

                # TODO: fix type incompatibility
                top_documents = await reranker.rerank_documents(
                    query=user_query, documents=top_documents, top_n=top_n
                )
                logger.info(
                    f"Step 4.5 completed: Reranked to {len(top_documents)} documents"
                )
            elif not reranker.is_available():
                logger.info("Step 4.5 skipped: Cohere reranker not available")
            else:
                logger.info("Step 4.5 skipped: No documents to rerank")

            if request.stream_events:
                # Send top documents
                document_results = [doc.model_dump() for doc in top_documents]
                document_results_completion_chunk = ChatCompletionChunk(
                    id=completion_id,
                    created=created,
                    model=request.model,
                    choices=[
                        ChatCompletionChoice(
                            index=0,
                            delta=ChatMessageDelta(
                                content=f"<event>documents:{json.dumps(document_results)}</event>"
                            ),
                            finish_reason=None,
                        )
                    ],
                    system_fingerprint=system_fingerprint,
                )
                yield f"data: {document_results_completion_chunk.model_dump_json()}\n\n"

            # Step 5: Generate streaming LLM response
            logger.info("Step 5: Starting LLM response generation")

            if request.stream_events:
                event_chunk = ChatCompletionChunk(
                    id=completion_id,
                    created=created,
                    model=request.model,
                    choices=[
                        ChatCompletionChoice(
                            index=0,
                            delta=ChatMessageDelta(
                                content="<event>Generating response...</event>"
                            ),
                            finish_reason=None,
                        )
                    ],
                    system_fingerprint=system_fingerprint,
                )
                yield f"data: {event_chunk.model_dump_json()}\n\n"
                logger.debug("Sent response generation start event")

            if top_documents:
                llm_response_gen: AsyncIterator[
                    BaseMessageChunk
                ] = await llm_client.generate_rag_response_from_conversation(
                    conversation_history=conversation_history,
                    context_documents=top_documents,
                    citation_style=request.citation_style,
                )

                chunk_count: PositiveInt = 0
                async for chunk in llm_response_gen:
                    chunk_count += 1
                    chunk_data = ChatCompletionChunk(
                        id=completion_id,
                        created=created,
                        model=request.model,
                        choices=[
                            ChatCompletionChoice(
                                index=0,
                                delta=ChatMessageDelta(
                                    content=cast(str, chunk.content)
                                ),
                                finish_reason=None,
                            )
                        ],
                        system_fingerprint=system_fingerprint,
                    )
                    yield f"data: {chunk_data.model_dump_json()}\n\n"

                logger.info(
                    f"Step 5 completed: Generated response with {chunk_count} chunks"
                )

            else:  # if not top_documents
                logger.warning("Step 5: No documents found, sending fallback message")
                error_message: str = "I couldn't find relevant academic documents to answer your question. Please try rephrasing your query or being more specific about the research area."
                chunk_data = ChatCompletionChunk(
                    id=completion_id,
                    created=created,
                    model=request.model,
                    choices=[
                        ChatCompletionChoice(
                            index=0,
                            delta=ChatMessageDelta(content=error_message),
                            finish_reason=None,
                        )
                    ],
                    system_fingerprint=system_fingerprint,
                )
                yield f"data: {chunk_data.model_dump_json()}\n\n"
                logger.info("Sent fallback message for no documents found")

            # Send final chunk with finish_reason
            logger.info("Sending final completion chunk")
            final_chunk = ChatCompletionChunk(
                id=completion_id,
                created=created,
                model=request.model,
                choices=[
                    ChatCompletionChoice(
                        index=0, delta=ChatMessageDelta(), finish_reason="stop"
                    )
                ],
                system_fingerprint=system_fingerprint,
            )
            yield f"data: {final_chunk.model_dump_json()}\n\n"
            yield "data: [DONE]\n\n"
            logger.info("Chat completion stream finished successfully")

        except Exception as e:
            logger.exception(f"Error in OpenAI-compatible streaming: {e}")
            error_chunk = ChatCompletionChunk(
                id=completion_id,
                created=created,
                model=request.model,
                choices=[
                    ChatCompletionChoice(
                        index=0,
                        delta=ChatMessageDelta(
                            content=f"Error processing query: {str(e)}"
                        ),
                        finish_reason="stop",
                    )
                ],
                system_fingerprint=system_fingerprint,
            )
            yield f"data: {error_chunk.model_dump_json()}\n\n"
            yield "data: [DONE]\n\n"
            logger.error("Chat completion stream ended with error")

    return StreamingResponse(
        generate_openai_stream(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream",
        },
    )
