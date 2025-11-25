import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { Loader2 } from 'lucide-react';
import { Logo } from '../common/Logo';

interface HomePageGuardProps {
  children: React.ReactNode;
}

/**
 * HomePageGuard - Shows marketing homepage for unauthenticated users,
 * redirects authenticated users to /app
 */
export const HomePageGuard: React.FC<HomePageGuardProps> = ({ children }) => {
  const { user, loading, init, initialized } = useAuthStore();

  useEffect(() => {
    // Initialize auth if not already initialized
    if (!initialized && !loading) {
      init();
    }
  }, [init, initialized, loading]);

  // Show loading while auth is initializing
  if (loading || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <Logo variant="icon" size="xl" className="mx-auto mb-2 scale-125" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, redirect to app
  if (user) {
    return <Navigate to="/app" replace />;
  }

  // If not authenticated, show marketing homepage
  return <>{children}</>;
};
