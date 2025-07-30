import React, { useState, useRef, useEffect } from 'react';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ConversationalAssistantProps {
  onSubmit: (message: string) => void;
  conversationHistory: ConversationMessage[];
  isLoading: boolean;
}

const ConversationalAssistant: React.FC<ConversationalAssistantProps> = ({
  onSubmit,
  conversationHistory,
  isLoading
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [suggestedQuestions] = useState([
    "What are the latest developments in machine learning for healthcare?",
    "Find papers on climate change adaptation strategies",
    "What research exists on quantum computing applications?",
    "Show me studies about renewable energy efficiency"
  ]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversationHistory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && !isLoading) {
      onSubmit(inputMessage.trim());
      setInputMessage('');
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    onSubmit(question);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center space-x-3">
            <div>
              <h3 className="text-lg font-semibold">Research Assistant</h3>
              <p className="text-blue-100 text-sm">Ask me anything about your research topic</p>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="h-96 overflow-y-auto p-6 space-y-4">
          {conversationHistory.length === 0 ? (
            <div className="text-center py-8">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Start Your Research</h4>
              <p className="text-gray-600 mb-6">Describe your research topic in natural language. I&apos;ll help you find and analyze relevant academic literature.</p>
              
              {/* Suggested Questions */}
              <div className="space-y-3">
                <p className="text-sm text-gray-500">Try asking about:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {suggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestedQuestion(question)}
                      className="text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-sm text-gray-700 border border-gray-200"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            conversationHistory.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className="border-t border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="flex space-x-4">
            <div className="flex-1">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Describe your research topic or ask a question..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </form>
          
          <div className="mt-3 text-xs text-gray-500">
            💡 Tip: Be specific about your research area, methodology, or time period for better results
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationalAssistant; 