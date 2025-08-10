"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getAuthState, logoutUser, AuthState } from "@/lib/auth";
import { useRouter } from "next/navigation";

const Header: React.FC = () => {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
  });

  useEffect(() => {
    const state = getAuthState();
    setAuthState(state);
  }, []);

  const handleLogout = () => {
    logoutUser();
    setAuthState({ isAuthenticated: false, user: null });
    router.push("/");
  };

  return (
   <header className="sticky top-0 z-50 bg-slate-900 overflow-hidden pointer-events-none">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pointer-events-auto">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="block">
              <img
              src="/auc_logo.png?v=4"                    // add ?v=4 to bust cache
              alt="AUC Libraries and Learning Technologies"
              className="block h-14 md:h-16 w-auto object-contain invert brightness-0"
            />
            </Link>
          </div>

          {/* Auth Buttons or Welcome Message */}
          <div className="flex items-center space-x-4">
            {authState.isAuthenticated && authState.user ? (
              <>
                <span className="text-slate-200 font-medium">
                  Welcome back, {authState.user.firstName}!
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-100 px-4 py-2 rounded-lg transition-colors font-medium"
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-slate-200 hover:text-white transition-colors font-medium"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center rounded-lg px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white transition-colors font-medium"
                >
                  Sign Up
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
