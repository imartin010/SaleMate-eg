import React, { useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { useAuthStore } from '../../store/auth';
import { Logo } from '../../components/common/Logo';
import { Loader2 } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuthStore();
  const location = useLocation();

  // Show loading while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <Logo variant="full" size="lg" showTagline={true} className="mx-auto mb-2" />
          <p className="text-muted-foreground">Loading your account...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/auth/login" replace />;
  }

  // Redirect to login if trying to access admin/support routes without proper role
  if (location.pathname === '/admin' && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  if (location.pathname === '/support' && !['admin', 'support'].includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header with Logo */}
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-4">
          <div className="flex items-center justify-center">
            <Logo variant="icon" size="xl" className="scale-125" />
          </div>
        </div>
        
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <div className="container mx-auto p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
};
