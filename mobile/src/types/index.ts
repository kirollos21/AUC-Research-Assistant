export interface SearchQuery {
  query: string;
  max_results?: number;
  enable_semantic_search?: boolean;
  access_preferences?: string[];
  databases?: string[];
}

export interface SearchResult {
  title: string;
  authors: string;
  year: string;
  source: string;
  url: string;
  abstract: string;
  score: number;
}

export interface FederatedSearchResponse {
  query: string;
  results: SearchResult[];
  stats: {
    total_results: number;
    search_time_ms: number;
    databases_searched: string[];
  };
}

export interface QueryRequest {
  query: string;
  max_results?: number;
  top_k?: number;
}

export interface DocumentResult {
  title: string;
  authors: string;
  year: string;
  source: string;
  url: string;
  abstract: string;
  score: number;
}

export interface QueryResponse {
  query: string;
  database_queries: Array<{
    query: string;
    focus: string;
  }>;
  top_documents: DocumentResult[];
  llm_response: string;
  total_documents_found: number;
  processing_time: number;
}

export interface DatabaseStatus {
  name: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  last_check: string;
  response_time_ms?: number;
}

export interface StreamMessage {
  type: 'status' | 'queries' | 'documents' | 'response_chunk' | 'complete' | 'error';
  message?: string;
  queries?: Array<{query: string; focus: string}>;
  documents?: DocumentResult[];
  chunk?: string;
  processing_time?: number;
  total_documents?: number;
}

export interface CitationStyle {
  type: 'APA' | 'MLA';
  format: (doc: DocumentResult) => string;
} 