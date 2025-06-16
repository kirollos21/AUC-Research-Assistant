'use client';

import { useState } from 'react';
import HeroSection from '@/components/HeroSection';
import ConversationalAssistant from '@/components/ConversationalAssistant';
import ResearchWorkflow from '@/components/ResearchWorkflow';
import ResultsDashboard from '@/components/ResultsDashboard';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { FederatedSearchResponse } from '@/types/search';

interface ResearchStep {
  id: 'prepare' | 'relax' | 'understand' | 'keepup';
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed';
}

export default function Home() {
  const [currentStep, setCurrentStep] = useState<'prepare' | 'relax' | 'understand' | 'keepup'>('prepare');
  const [searchResults, setSearchResults] = useState<FederatedSearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [researchQuery, setResearchQuery] = useState<string>('');

  const handleConversationSubmit = async (message: string) => {
    setConversationHistory(prev => [...prev, { role: 'user', content: message }]);
    setResearchQuery(message);
    setIsLoading(true);
    setCurrentStep('relax');

    try {
      // Simulate AI processing and search
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const response = await fetch('http://localhost:8000/api/v1/search/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: message,
          max_results: 20,
          enable_semantic_search: true
        }),
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      setSearchResults(data);
      setCurrentStep('understand');
      
      // Add AI response to conversation
      setConversationHistory(prev => [...prev, { 
        role: 'assistant', 
        content: `I&apos;ve found ${data.results?.length || 0} relevant papers for your research on &quot;${message}&quot;. Let me analyze and synthesize the key findings for you.` 
      }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during search');
      setCurrentStep('prepare');
    } finally {
      setIsLoading(false);
    }
  };

  const workflowSteps: ResearchStep[] = [
    {
      id: 'prepare',
      title: 'Prepare',
      description: 'Describe your research needs',
      status: currentStep === 'prepare' ? 'active' : currentStep === 'relax' || currentStep === 'understand' || currentStep === 'keepup' ? 'completed' : 'pending'
    },
    {
      id: 'relax',
      title: 'Relax',
      description: 'AI conducts research',
      status: currentStep === 'relax' ? 'active' : currentStep === 'understand' || currentStep === 'keepup' ? 'completed' : 'pending'
    },
    {
      id: 'understand',
      title: 'Understand',
      description: 'Review synthesized results',
      status: currentStep === 'understand' ? 'active' : currentStep === 'keepup' ? 'completed' : 'pending'
    },
    {
      id: 'keepup',
      title: 'Keep Up',
      description: 'Stay updated on new research',
      status: currentStep === 'keepup' ? 'active' : 'pending'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <HeroSection />

        {/* Research Workflow Steps */}
        <ResearchWorkflow steps={workflowSteps} />

        {/* Main Content Area */}
        <div className="mt-12 space-y-8">
          {currentStep === 'prepare' && (
            <ConversationalAssistant 
              onSubmit={handleConversationSubmit}
              conversationHistory={conversationHistory}
              isLoading={isLoading}
            />
          )}

          {currentStep === 'relax' && (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Conducting Research</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                I&apos;m searching across multiple databases and analyzing the literature to find the most relevant research for your query.
              </p>
            </div>
          )}

          {currentStep === 'understand' && searchResults && (
            <ResultsDashboard 
              results={searchResults}
              query={researchQuery}
              onExport={() => setCurrentStep('keepup')}
            />
          )}

          {currentStep === 'keepup' && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Stay Updated</h3>
              <p className="text-gray-600 mb-6">
                Get notified when new research relevant to your topic is published.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input type="checkbox" id="email-notifications" className="rounded border-gray-300" />
                  <label htmlFor="email-notifications" className="text-gray-700">Email notifications for new papers</label>
                </div>
                <div className="flex items-center space-x-3">
                  <input type="checkbox" id="weekly-digest" className="rounded border-gray-300" />
                  <label htmlFor="weekly-digest" className="text-gray-700">Weekly research digest</label>
                </div>
                <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Set Up Notifications
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Research Error</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
