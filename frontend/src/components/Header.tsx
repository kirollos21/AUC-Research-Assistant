"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAuthState, logoutUser, AuthState } from '@/lib/auth';
import { useRouter } from 'next/navigation';

const Header: React.FC = () => {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>({ isAuthenticated: false, user: null });

  useEffect(() => {
    const state = getAuthState();
    setAuthState(state);
  }, []);

  const handleLogout = () => {
    logoutUser();
    setAuthState({ isAuthenticated: false, user: null });
    router.push('/');
  };

  return (
    <header className="bg-black shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/">
              <img 
                src="/auc_logo.png" 
                alt="AUC Research Assistant Logo" 
                className="h-18 w-auto"
              />
            </Link>
          </div>

          {/* Auth Buttons or Welcome Message */}
          <div className="flex items-center space-x-4">
            {authState.isAuthenticated && authState.user ? (
              <>
                <span className="text-white font-medium">
                  Welcome back, {authState.user.firstName}!
                </span>
                <button 
                  onClick={handleLogout}
                  className="bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <button className="text-white hover:text-gray-300 transition-colors font-medium">
                    Log In
                  </button>
                </Link>
                <Link href="/signup">
                  <button className="bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium">
                    Sign Up
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 