import React, { useEffect } from 'react';
import { useAuthStore } from '../../store/auth';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { init } = useAuthStore();

  useEffect(() => {
    // Initialize auth system once
    init();
  }, [init]);

  // Auth initialization is now handled by AuthGuard
  // This component just ensures auth is initialized globally
  return <>{children}</>;
};