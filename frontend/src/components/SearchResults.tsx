'use client';

import { useState, useMemo } from 'react';
import { FederatedSearchResponse } from '@/types/search';

interface SearchResultsProps {
  results: FederatedSearchResponse;
}

export default function SearchResults({ results }: SearchResultsProps) {
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'citations'>('relevance');
  const [filterDatabase, setFilterDatabase] = useState<string>('all');
  const [filterAccess, setFilterAccess] = useState<string>('all');
  const [expandedAbstract, setExpandedAbstract] = useState<string | null>(null);

  const databases = useMemo(() => {
    const dbSet = new Set(results.results.map(r => r.source_database));
    return Array.from(dbSet);
  }, [results.results]);

  const filteredAndSortedResults = useMemo(() => {
    let filtered = results.results;

    // Filter by database
    if (filterDatabase !== 'all') {
      filtered = filtered.filter(r => r.source_database === filterDatabase);
    }

    // Filter by access type
    if (filterAccess !== 'all') {
      filtered = filtered.filter(r => r.access_info.access_type === filterAccess);
    }

    // Sort results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          const dateA = a.publication_date ? new Date(a.publication_date).getTime() : 0;
          const dateB = b.publication_date ? new Date(b.publication_date).getTime() : 0;
          return dateB - dateA;
        case 'citations':
          const citationsA = a.citation_info?.count || 0;
          const citationsB = b.citation_info?.count || 0;
          return citationsB - citationsA;
        default: // relevance
          return b.relevance_score - a.relevance_score;
      }
    });

    return filtered;
  }, [results.results, sortBy, filterDatabase, filterAccess]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDatabaseColor = (database: string) => {
    const colors: Record<string, string> = {
      arxiv: 'bg-orange-100 text-orange-800',
      pubmed: 'bg-green-100 text-green-800',
      crossref: 'bg-blue-100 text-blue-800',
      doaj: 'bg-purple-100 text-purple-800'
    };
    return colors[database] || 'bg-gray-100 text-gray-800';
  };

  const getAccessColor = (accessType: string) => {
    const colors: Record<string, string> = {
      open_access: 'bg-green-100 text-green-800',
      licensed: 'bg-yellow-100 text-yellow-800',
      restricted: 'bg-red-100 text-red-800',
      unknown: 'bg-gray-100 text-gray-800'
    };
    return colors[accessType] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Search Results for &quot;{results.query}&quot;
            </h2>
            <p className="text-gray-600">
              Found {results.stats.total_results} results in {results.stats.search_time_ms}ms
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'relevance' | 'date' | 'citations')}
                className="border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="relevance">Relevance</option>
                <option value="date">Date</option>
                <option value="citations">Citations</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">Database:</span>
              <select
                value={filterDatabase}
                onChange={(e) => setFilterDatabase(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All</option>
                {databases.map(db => (
                  <option key={db} value={db}>{db.toUpperCase()}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">Access:</span>
              <select
                value={filterAccess}
                onChange={(e) => setFilterAccess(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All</option>
                <option value="open_access">Open Access</option>
                <option value="licensed">Licensed</option>
                <option value="restricted">Restricted</option>
              </select>
            </div>
          </div>
        </div>

        {/* Search Stats */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="font-medium text-gray-900">{results.stats.total_results}</div>
            <div className="text-gray-500">Total Results</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="font-medium text-gray-900">{results.stats.duplicates_removed}</div>
            <div className="text-gray-500">Duplicates Removed</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="font-medium text-gray-900">{results.stats.search_time_ms}ms</div>
            <div className="text-gray-500">Search Time</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="font-medium text-gray-900">
              {results.stats.query_expansion_used ? 'Yes' : 'No'}
            </div>
            <div className="text-gray-500">Query Expansion</div>
          </div>
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-4">
        {filteredAndSortedResults.map((result) => (
          <div key={result.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex flex-col lg:flex-row lg:items-start gap-4">
              {/* Main Content */}
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-lg font-semibold text-gray-900 leading-tight">
                    <a 
                      href={result.url || result.doi ? `https://doi.org/${result.doi}` : '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-600 transition-colors"
                    >
                      {result.title}
                    </a>
                  </h3>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDatabaseColor(result.source_database)}`}>
                      {result.source_database.toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAccessColor(result.access_info.access_type)}`}>
                      {result.access_info.access_type.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Authors */}
                {result.authors.length > 0 && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Authors:</span> {result.authors.map(a => a.name).join(', ')}
                  </div>
                )}

                {/* Abstract */}
                {result.abstract && (
                  <div className="text-gray-700">
                    <span className="font-medium">Abstract:</span>{' '}
                    {expandedAbstract === result.id ? (
                      <span>{result.abstract}</span>
                    ) : (
                      <span>
                        {result.abstract.length > 300 
                          ? `${result.abstract.substring(0, 300)}... ` 
                          : result.abstract
                        }
                        {result.abstract.length > 300 && (
                          <button
                            onClick={() => setExpandedAbstract(result.id)}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Read more
                          </button>
                        )}
                      </span>
                    )}
                  </div>
                )}

                {/* Metadata */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  {result.publication_date && (
                    <div>
                      <span className="font-medium">Published:</span> {formatDate(result.publication_date)}
                    </div>
                  )}
                  {result.journal && (
                    <div>
                      <span className="font-medium">Journal:</span> {result.journal}
                    </div>
                  )}
                  {result.doi && (
                    <div>
                      <span className="font-medium">DOI:</span>{' '}
                      <a 
                        href={`https://doi.org/${result.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        {result.doi}
                      </a>
                    </div>
                  )}
                  {result.citation_info?.count && (
                    <div>
                      <span className="font-medium">Citations:</span> {result.citation_info.count}
                    </div>
                  )}
                </div>

                {/* Keywords */}
                {result.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {result.keywords.slice(0, 5).map((keyword, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                      >
                        {keyword}
                      </span>
                    ))}
                    {result.keywords.length > 5 && (
                      <span className="text-xs text-gray-500">
                        +{result.keywords.length - 5} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Relevance Score */}
              <div className="flex flex-col items-center space-y-2 lg:w-20">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">
                    {Math.round(result.relevance_score * 100)}%
                  </div>
                  <div className="text-xs text-gray-500">Relevance</div>
                </div>
                <div className="w-2 h-16 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-600 transition-all duration-300"
                    style={{ height: `${result.relevance_score * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 flex flex-wrap gap-2">
              {result.url && (
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                >
                  View Paper
                </a>
              )}
              {result.access_info.pdf_url && (
                <a
                  href={result.access_info.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                >
                  Download PDF
                </a>
              )}
              <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors">
                Save
              </button>
              <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors">
                Cite
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {filteredAndSortedResults.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search criteria or filters.
          </p>
        </div>
      )}

      {/* Suggestions */}
      {results.suggestions && results.suggestions.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Search Suggestions</h3>
          <div className="flex flex-wrap gap-2">
            {results.suggestions.map((suggestion, index) => (
              <button
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 