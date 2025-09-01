import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { Loader2 } from 'lucide-react';
import { Logo } from '../common/Logo';

export const AuthGuard: React.FC = () => {
  const { user, profile, loading, init } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    init();
  }, [init]);

  // Show loading while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <Logo variant="icon" size="xl" className="mx-auto mb-2" />
          <p className="text-gray-600">Loading your account...</p>
        </div>
      </div>
    );
  }

  // For development: Create a test user if none exists
  if (!user) {
    // Check if we should bypass auth (for testing)
    const bypassAuth = localStorage.getItem('salemate-bypass-auth');
    if (bypassAuth === 'true') {
      // Create a temporary test user
      const testUser = {
        id: 'test-user',
        email: 'test@salemate.com',
        phone: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        role: 'authenticated'
      };
      
      const testProfile = {
        id: 'test-user',
        name: 'Test User',
        email: 'test@salemate.com',
        phone: null,
        role: 'admin' as const,
        manager_id: null,
        is_banned: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Set the test user in the store
      useAuthStore.setState({
        user: testUser as any,
        profile: testProfile,
        role: 'admin',
        loading: false,
        error: null
      });

      return <Outlet />;
    }
    
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Check if user is banned
  if (profile?.is_banned) {
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

  // User is authenticated and not banned - render protected content
  return <Outlet />;
};