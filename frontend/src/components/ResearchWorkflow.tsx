import React from 'react';

interface ResearchStep {
  id: 'prepare' | 'relax' | 'understand' | 'keepup';
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed';
}

interface ResearchWorkflowProps {
  steps: ResearchStep[];
}

const ResearchWorkflow: React.FC<ResearchWorkflowProps> = ({ steps }) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Research Workflow
        </h2>
        
        <div className="relative">
          {/* Progress Bar */}
          <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 rounded-full">
            <div 
              className="h-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
              style={{ 
                width: `${steps.filter(s => s.status === 'completed').length * 33.33}%` 
              }}
            ></div>
          </div>

          {/* Steps */}
          <div className="relative flex justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center">
                {/* Step Circle */}
                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-all duration-300
                  ${step.status === 'completed' 
                    ? 'bg-green-500 text-white' 
                    : step.status === 'active' 
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100' 
                    : 'bg-gray-200 text-gray-500'
                  }
                `}>
                  {step.status === 'completed' ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="font-semibold">{index + 1}</span>
                  )}
                </div>

                {/* Step Content */}
                <div className="text-center max-w-32">
                  <h3 className={`font-semibold text-sm mb-1 ${
                    step.status === 'active' ? 'text-blue-600' : 
                    step.status === 'completed' ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </h3>
                  <p className="text-xs text-gray-500 leading-tight">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Current Step Description */}
        <div className="mt-8 text-center">
          {steps.find(s => s.status === 'active') && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">
                Current Step: {steps.find(s => s.status === 'active')?.title}
              </h4>
              <p className="text-blue-700 text-sm">
                {steps.find(s => s.status === 'active')?.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResearchWorkflow; 