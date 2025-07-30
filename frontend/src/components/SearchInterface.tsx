'use client';

import { useState } from 'react';

interface SearchOptions {
  databases?: string[];
  max_results?: number;
  enable_semantic_search?: boolean;
  date_range?: {
    start: string;
    end: string;
  };
  access_preferences?: string[];
}

interface SearchInterfaceProps {
  onSearch: (query: string, options: SearchOptions) => void;
  isLoading: boolean;
}

export default function SearchInterface({ onSearch, isLoading }: SearchInterfaceProps) {
  const [query, setQuery] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedDatabases, setSelectedDatabases] = useState(['arxiv', 'pubmed', 'crossref', 'doaj']);
  const [maxResults, setMaxResults] = useState(20);
  const [enableSemanticSearch, setEnableSemanticSearch] = useState(true);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [accessPreferences, setAccessPreferences] = useState(['open_access', 'licensed']);

  const databases = [
    { id: 'arxiv', name: 'arXiv', description: 'Preprints and e-prints' },
    { id: 'pubmed', name: 'PubMed', description: 'Biomedical literature' },
    { id: 'crossref', name: 'CrossRef', description: 'Scholarly publications' },
    { id: 'doaj', name: 'DOAJ', description: 'Open access journals' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const options: SearchOptions = {
      databases: selectedDatabases,
      max_results: maxResults,
      enable_semantic_search: enableSemanticSearch,
      date_range: dateRange.start && dateRange.end ? dateRange : undefined,
      access_preferences: accessPreferences
    };

    onSearch(query, options);
  };

  const toggleDatabase = (dbId: string) => {
    setSelectedDatabases(prev => 
      prev.includes(dbId) 
        ? prev.filter(id => id !== dbId)
        : [...prev, dbId]
    );
  };

  const toggleAccessPreference = (pref: string) => {
    setAccessPreferences(prev => 
      prev.includes(pref)
        ? prev.filter(p => p !== pref)
        : [...prev, pref]
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Discover Academic Research</h2>
        <p className="text-gray-600">Search across multiple academic databases with AI-powered query expansion</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your research query (e.g., 'machine learning applications in healthcare')"
            className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
            disabled={isLoading}
          />
        </div>

        {/* Advanced Options Toggle */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
          >
            <span>{showAdvanced ? 'Hide' : 'Show'} Advanced Options</span>
            <svg 
              className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Advanced Options */}
        {showAdvanced && (
          <div className="space-y-6 p-4 bg-gray-50 rounded-lg">
            {/* Database Selection */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Search Databases</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {databases.map(db => (
                  <label key={db.id} className="flex items-center space-x-3 p-3 bg-white rounded-lg border cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={selectedDatabases.includes(db.id)}
                      onChange={() => toggleDatabase(db.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{db.name}</div>
                      <div className="text-sm text-gray-500">{db.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Search Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Results
                </label>
                <select
                  value={maxResults}
                  onChange={(e) => setMaxResults(Number(e.target.value))}
                  className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={10}>10 results</option>
                  <option value={20}>20 results</option>
                  <option value={50}>50 results</option>
                  <option value={100}>100 results</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Access Preferences
                </label>
                <div className="space-y-2">
                  {['open_access', 'licensed', 'any'].map(pref => (
                    <label key={pref} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={accessPreferences.includes(pref)}
                        onChange={() => toggleAccessPreference(pref)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700 capitalize">
                        {pref.replace('_', ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Publication Date Range
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">From</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">To</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* AI Features */}
            <div>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={enableSemanticSearch}
                  onChange={(e) => setEnableSemanticSearch(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">Enable AI-powered semantic search</div>
                  <div className="text-xs text-gray-500">Uses query expansion and semantic similarity for better results</div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Search Button */}
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Searching...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Search Research Papers</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Quick Search Suggestions */}
      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Popular Research Topics</h3>
        <div className="flex flex-wrap gap-2">
          {[
            'machine learning',
            'climate change',
            'cancer research',
            'artificial intelligence',
            'renewable energy',
            'covid-19',
            'quantum computing',
            'sustainable development'
          ].map(topic => (
            <button
              key={topic}
              onClick={() => setQuery(topic)}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
            >
              {topic}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
} 