export interface Document {
  title: string;
  authors: string;
  year: string;
  source: string;
  url: string;
  abstract: string;
  score: number;
}

export interface SearchQuery {
  query: string;
  max_results?: number;
  top_k?: number;
  databases?: string[];
  access_filter?: 'open' | 'restricted';
}

export interface SearchResponse {
  query: string;
  database_queries: Array<{ query: string; focus: string }>;
  top_documents: Document[];
  llm_response: string;
  total_documents_found: number;
  processing_time: number;
}

export interface StreamingResponse {
  type: 'status' | 'queries' | 'documents' | 'response_chunk' | 'complete' | 'error';
  message?: string;
  queries?: Array<{ query: string; focus: string }>;
  documents?: Document[];
  chunk?: string;
  processing_time?: number;
  total_documents?: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export type CitationStyle = 'APA' | 'MLA'; 