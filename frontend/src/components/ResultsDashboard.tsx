import React, { useState } from 'react';
import { FederatedSearchResponse } from '@/types/search';

interface ResultsDashboardProps {
  results: FederatedSearchResponse;
  query: string;
  onExport: () => void;
}

const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ results, query, onExport }) => {
  const [activeTab, setActiveTab] = useState<'synthesis' | 'papers' | 'tables'>('synthesis');
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'citations'>('relevance');
  const [filterRelevance, setFilterRelevance] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const papers = results.results || [];
  const totalPapers = papers.length;

  // Mock synthesis data
  const synthesis = {
    summary: `Based on the analysis of ${totalPapers} papers related to &quot;${query}&quot;, I&apos;ve identified several key themes and findings. The research shows significant developments in this area, with multiple studies converging on similar conclusions.`,
    keyFindings: [
      "Primary finding related to the research topic",
      "Secondary finding with supporting evidence",
      "Third key insight from the literature"
    ],
    methodology: "The analysis involved semantic search across multiple academic databases, followed by relevance scoring and synthesis of findings.",
    gaps: "Areas requiring further research include specific methodology gaps and unexplored applications."
  };

  const getRelevanceColor = (relevance: number) => {
    if (relevance >= 0.8) return 'text-green-600 bg-green-100';
    if (relevance >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getRelevanceLabel = (relevance: number) => {
    if (relevance >= 0.8) return 'Highly Relevant';
    if (relevance >= 0.6) return 'Moderately Relevant';
    return 'Low Relevance';
  };

  const filteredPapers = papers.filter(paper => {
    if (filterRelevance === 'all') return true;
    const relevance = paper.relevance_score || 0;
    if (filterRelevance === 'high') return relevance >= 0.8;
    if (filterRelevance === 'medium') return relevance >= 0.6 && relevance < 0.8;
    return relevance < 0.6;
  });

  const sortedPapers = [...filteredPapers].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.publication_date || '').getTime() - new Date(a.publication_date || '').getTime();
      case 'citations':
        return (b.citation_info?.count || 0) - (a.citation_info?.count || 0);
      default:
        return (b.relevance_score || 0) - (a.relevance_score || 0);
    }
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Research Results</h2>
            <p className="text-gray-600">Query: &quot;{query}&quot;</p>
            <p className="text-sm text-gray-500 mt-1">Found {totalPapers} relevant papers</p>
          </div>
          <button
            onClick={onExport}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Export Results
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('synthesis')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'synthesis'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            AI Synthesis
          </button>
          <button
            onClick={() => setActiveTab('papers')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'papers'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Papers ({totalPapers})
          </button>
          <button
            onClick={() => setActiveTab('tables')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'tables'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Custom Tables
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'synthesis' && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">AI-Generated Synthesis</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-900">{synthesis.summary}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Key Findings</h4>
              <ul className="space-y-2">
                {synthesis.keyFindings.map((finding, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span className="text-gray-700">{finding}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Research Gaps</h4>
              <p className="text-gray-700">{synthesis.gaps}</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Methodology</h4>
            <p className="text-gray-700 text-sm">{synthesis.methodology}</p>
          </div>
        </div>
      )}

      {activeTab === 'papers' && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'relevance' | 'date' | 'citations')}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="relevance">Relevance</option>
                <option value="date">Publication Date</option>
                <option value="citations">Citation Count</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by relevance</label>
              <select
                value={filterRelevance}
                onChange={(e) => setFilterRelevance(e.target.value as 'all' | 'high' | 'medium' | 'low')}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="all">All Papers</option>
                <option value="high">Highly Relevant</option>
                <option value="medium">Moderately Relevant</option>
                <option value="low">Low Relevance</option>
              </select>
            </div>
          </div>

          {/* Papers List */}
          <div className="space-y-4">
            {sortedPapers.map((paper, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-gray-900 text-lg">{paper.title}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRelevanceColor(paper.relevance_score || 0)}`}>
                    {getRelevanceLabel(paper.relevance_score || 0)}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-3">{paper.abstract}</p>
                
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  <span>Authors: {paper.authors?.map(author => author.name).join(', ')}</span>
                  <span>Journal: {paper.journal}</span>
                  <span>Year: {paper.publication_date?.split('-')[0]}</span>
                  <span>Citations: {paper.citation_info?.count || 0}</span>
                </div>

                <div className="mt-3 flex space-x-2">
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    View Full Text
                  </button>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Trace Citations
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'tables' && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Custom Tables</h3>
          <p className="text-gray-600 mb-6">
            AI-generated tables summarizing key findings, methods, and datasets from the literature.
          </p>
          
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Key Findings Summary</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-900 border-b">Finding</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-900 border-b">Supporting Papers</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-900 border-b">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-4 py-2 text-sm text-gray-700 border-b">Primary research finding</td>
                      <td className="px-4 py-2 text-sm text-gray-700 border-b">5 papers</td>
                      <td className="px-4 py-2 text-sm text-gray-700 border-b">High</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-sm text-gray-700 border-b">Secondary finding</td>
                      <td className="px-4 py-2 text-sm text-gray-700 border-b">3 papers</td>
                      <td className="px-4 py-2 text-sm text-gray-700 border-b">Medium</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Methodology Comparison</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-900 border-b">Method</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-900 border-b">Papers Using</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-900 border-b">Success Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-4 py-2 text-sm text-gray-700 border-b">Method A</td>
                      <td className="px-4 py-2 text-sm text-gray-700 border-b">8 papers</td>
                      <td className="px-4 py-2 text-sm text-gray-700 border-b">85%</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-sm text-gray-700 border-b">Method B</td>
                      <td className="px-4 py-2 text-sm text-gray-700 border-b">4 papers</td>
                      <td className="px-4 py-2 text-sm text-gray-700 border-b">75%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsDashboard; 