import React from 'react';

const HeroSection: React.FC = () => {
  return (
    <div className="text-center py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Main Heading */}
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
          Your AI Research
          <span className="text-blue-600 block">Assistant</span>
        </h1>
        
        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
          Describe your research needs in natural language. Our AI will search, analyze, and synthesize 
          the latest academic literature to help you discover breakthrough insights.
        </p>

        {/* Trust Indicators */}
        <div className="mb-12">
          <p className="text-sm text-gray-500 mb-4">Trusted by researchers at</p>
          <div className="flex justify-center items-center space-x-8 md:space-x-12 opacity-60">
            <div className="text-gray-400 font-semibold">MIT</div>
            <div className="text-gray-400 font-semibold">Stanford</div>
            <div className="text-gray-400 font-semibold">Harvard</div>
            <div className="text-gray-400 font-semibold">Oxford</div>
            <div className="text-gray-400 font-semibold">UBC</div>
          </div>
        </div>

        {/* Key Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-2">Conversational AI</h3>
            <p className="text-gray-600 text-sm">Ask questions naturally, just like talking to a research colleague</p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-2">Traceable Citations</h3>
            <p className="text-gray-600 text-sm">Every AI statement is backed by verifiable academic sources</p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-2">Stay Updated</h3>
            <p className="text-gray-600 text-sm">Get notified when new relevant research is published</p>
          </div>
        </div>

        {/* CTA Button */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-full inline-flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
          <span className="text-lg font-semibold">Start Your Research</span>
        </div>
      </div>
    </div>
  );
};

export default HeroSection; 