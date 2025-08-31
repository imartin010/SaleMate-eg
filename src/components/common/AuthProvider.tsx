import React, { useEffect } from 'react';
import { useAuthStore } from '../../store/auth';
import { Logo } from './Logo';
import { Loader2 } from 'lucide-react';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { user, isAuthenticated, loading, initialize } = useAuthStore();

  useEffect(() => {
    console.log('🔐 AuthProvider mounted, initializing auth...');
    initialize();
  }, [initialize]);

  useEffect(() => {
    console.log('🔄 Auth state changed:', { user: !!user, isAuthenticated, loading });
  }, [user, isAuthenticated, loading]);

  // Show loading while auth is initializing (max 3 seconds due to timeout)
  if (loading) {
    console.log('⏳ AuthProvider: Showing loading state...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <Logo variant="full" size="lg" showTagline={true} className="mx-auto mb-2" />
          <p className="text-muted-foreground">Loading your account...</p>
          <p className="text-xs text-gray-500 mt-2">This should only take a few seconds...</p>
        </div>
      </div>
    );
  }

  console.log('✅ AuthProvider: Auth initialized, rendering children');
  return <>{children}</>;
};
