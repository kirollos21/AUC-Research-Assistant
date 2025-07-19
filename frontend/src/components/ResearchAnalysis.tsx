'use client';

import { useState, useEffect, useCallback } from 'react';
import { FederatedSearchResponse } from '@/types/search';

interface ResearchAnalysisProps {
  searchResults: FederatedSearchResponse | null;
}

export default function ResearchAnalysis({ searchResults }: ResearchAnalysisProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performAnalysis = useCallback(async () => {
    if (!searchResults) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/api/v1/search/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchResults.query,
          results: searchResults.results
        }),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const data = await response.json();
      // Handle the analysis data here
      console.log('Analysis data:', data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to perform analysis');
    } finally {
      setIsLoading(false);
    }
  }, [searchResults]);

  useEffect(() => {
    if (searchResults && searchResults.results.length > 0) {
      performAnalysis();
    }
  }, [searchResults, performAnalysis]);

  if (!searchResults) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No search results to analyze</h3>
          <p className="mt-1 text-sm text-gray-500">
            Perform a search first to get AI-powered insights and analysis.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Research Analysis</h2>
        <p className="text-gray-600">AI-powered insights from your search results</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Key Concepts</h4>
            <p className="text-blue-800">Extract main themes and concepts from search results</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">Research Trends</h4>
            <p className="text-green-800">Identify emerging patterns and trends in the field</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-2">Research Gaps</h4>
            <p className="text-yellow-800">Find opportunities for new research directions</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="font-medium text-purple-900 mb-2">Citation Analysis</h4>
            <p className="text-purple-800">Analyze citation patterns and impact metrics</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{searchResults.stats.total_results}</div>
            <div className="text-sm text-gray-600">Total Results</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{searchResults.stats.search_time_ms}ms</div>
            <div className="text-sm text-gray-600">Search Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{searchResults.stats.duplicates_removed}</div>
            <div className="text-sm text-gray-600">Duplicates Removed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {searchResults.stats.query_expansion_used ? 'Yes' : 'No'}
            </div>
            <div className="text-sm text-gray-600">Query Expansion</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Analysis Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="bg-white rounded-lg shadow-sm p-12">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Analyzing research data...</h3>
            <p className="mt-1 text-sm text-gray-500">This may take a few moments.</p>
          </div>
        </div>
      )}
    </div>
  );
}