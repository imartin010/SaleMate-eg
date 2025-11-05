import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { Loader2 } from 'lucide-react';
import { Logo } from '../common/Logo';

/**
 * OptionalAuthGuard - Allows access without login, but still initializes auth
 * and prevents banned users from accessing content
 */
export const OptionalAuthGuard: React.FC = () => {
  const { user, profile, loading, init } = useAuthStore();

  useEffect(() => {
    init();
  }, [init]);

  // Show loading while auth is initializing
  if (loading) {
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

  // Check if user is banned (only if logged in)
  if (user && profile?.is_banned) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 p-4">
        <div className="text-center max-w-md">
          <div className="h-12 w-12 text-red-500 mx-auto mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Account Suspended</h2>
          <p className="text-gray-600 mb-6">
            Your account has been suspended. Please contact support for assistance.
          </p>
          <a
            href="mailto:support@salemate.com"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    );
  }

  // Allow access regardless of auth status
  return <Outlet />;
};
