'use client';

import { useState, useEffect } from 'react';
import { DatabaseStatus as DBStatus } from '@/types/search';

export default function DatabaseStatus() {
  const [databaseStatus, setDatabaseStatus] = useState<DBStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDatabaseStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:8000/api/v1/search/databases/status');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch database status: ${response.statusText}`);
      }
      
      const data = await response.json();
      setDatabaseStatus(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch database status');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabaseStatus();
    
    // Refresh status every 5 minutes
    const interval = setInterval(fetchDatabaseStatus, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (available: boolean) => {
    return available ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (available: boolean) => {
    return available ? (
      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ) : (
      <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    );
  };

  const getDatabaseIcon = (name: string) => {
    const icons: Record<string, string> = {
      arxiv: '📚',
      pubmed: '🏥',
      crossref: '🔗',
      doaj: '📖'
    };
    return icons[name.toLowerCase()] || '📄';
  };

  const formatResponseTime = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatLastChecked = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Database Status</h2>
            <p className="text-gray-600">Real-time health monitoring of academic databases</p>
          </div>
          <div className="flex items-center space-x-4">
            {lastUpdated && (
              <div className="text-sm text-gray-500">
                Last updated: {formatLastChecked(lastUpdated.toISOString())}
              </div>
            )}
            <button
              onClick={fetchDatabaseStatus}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
            >
              {isLoading ? (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Database Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {databaseStatus.map((db) => (
          <div key={db.name} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getDatabaseIcon(db.name)}</span>
                <div>
                  <h3 className="font-semibold text-gray-900 capitalize">{db.name}</h3>
                  <p className="text-sm text-gray-500">
                    {db.available ? 'Available' : 'Unavailable'}
                  </p>
                </div>
              </div>
              {getStatusIcon(db.available)}
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`text-sm font-medium ${getStatusColor(db.available)}`}>
                  {db.available ? 'Online' : 'Offline'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Response Time:</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatResponseTime(db.response_time_ms)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Last Checked:</span>
                <span className="text-sm text-gray-900">
                  {formatLastChecked(db.last_checked)}
                </span>
              </div>

              {db.error_message && (
                <div className="mt-3 p-2 bg-red-50 rounded text-xs text-red-700">
                  <strong>Error:</strong> {db.error_message}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && databaseStatus.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-12">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Checking database status...</h3>
            <p className="mt-1 text-sm text-gray-500">This may take a few moments.</p>
          </div>
        </div>
      )}

      {/* No Data State */}
      {!isLoading && !error && databaseStatus.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-12">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No database status available</h3>
            <p className="mt-1 text-sm text-gray-500">
              Unable to retrieve database status information.
            </p>
          </div>
        </div>
      )}

      {/* System Health Summary */}
      {databaseStatus.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {databaseStatus.filter(db => db.available).length}
              </div>
              <div className="text-sm text-gray-600">Databases Online</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {databaseStatus.filter(db => !db.available).length}
              </div>
              <div className="text-sm text-gray-600">Databases Offline</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round((databaseStatus.filter(db => db.available).length / databaseStatus.length) * 100)}%
              </div>
              <div className="text-sm text-gray-600">Uptime</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 