export interface Author {
  name: string;
  affiliation?: string;
  orcid?: string;
}

export interface AccessInfo {
  is_open_access: boolean;
  access_type: 'open_access' | 'licensed' | 'restricted' | 'unknown';
  license?: string;
  license_url?: string;
  repository_url?: string;
  pdf_url?: string;
}

export interface Citation {
  count?: number;
  recent_count?: number;
  h_index?: number;
  impact_factor?: number;
}

export interface SearchResult {
  id: string;
  title: string;
  authors: Author[];
  abstract?: string;
  publication_date?: string;
  journal?: string;
  venue?: string;
  doi?: string;
  url?: string;
  source_database: string;
  access_info: AccessInfo;
  citation_info?: Citation;
  keywords: string[];
  subjects: string[];
  language?: string;
  document_type?: string;
  relevance_score: number;
  lexical_score?: number;
  semantic_score?: number;
  citation_score?: number;
  recency_score?: number;
  raw_metadata: Record<string, unknown>;
}

export interface SearchStats {
  total_results: number;
  results_per_database: Record<string, number>;
  search_time_ms: number;
  query_expansion_used: boolean;
  semantic_search_used: boolean;
  duplicates_removed: number;
}

export interface FederatedSearchResponse {
  query: string;
  results: SearchResult[];
  stats: SearchStats;
  suggestions?: string[];
  related_queries?: string[];
}

export interface SearchQuery {
  query: string;
  databases?: string[];
  max_results?: number;
  date_range?: {
    start: string;
    end: string;
  };
  filters?: Record<string, unknown>;
  enable_semantic_search?: boolean;
  access_preferences?: ('open_access' | 'licensed' | 'any')[];
}

export interface DatabaseStatus {
  name: string;
  available: boolean;
  response_time_ms?: number;
  error_message?: string;
  last_checked: string;
}

export interface QueryExpansion {
  original_query: string;
  expanded_queries: string[];
  synonyms: string[];
  related_terms: string[];
  semantic_variants: string[];
} 