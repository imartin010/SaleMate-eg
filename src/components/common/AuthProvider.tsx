import React, { useEffect } from 'react';
import { useAuthStore } from '../../store/auth';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  useEffect(() => {
    // Initialize auth system once
    // Don't use init as dependency to avoid infinite loops
    useAuthStore.getState().init();
  }, []); // Empty dependency array - only run once on mount

  // Auth initialization is now handled by AuthGuard
  // This component just ensures auth is initialized globally
  return <>{children}</>;
};