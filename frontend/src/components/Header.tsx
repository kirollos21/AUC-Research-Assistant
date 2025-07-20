import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-black shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <img 
              src="/auc_logo.png" 
              alt="AUC Research Assistant Logo" 
              className="h-20 w-auto"
            />
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            <button className="text-white hover:text-gray-300 transition-colors font-medium">
              Log In
            </button>
            <button className="bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium">
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 