import React, { Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './layout/AppLayout';
import { AuthGuard } from '../components/auth/AuthGuard';
import { RoleGuard } from '../components/auth/RoleGuard';
import { ErrorBoundary, FastFallback } from '../components/common/ErrorBoundary';
import { Loader2 } from 'lucide-react';

// AUTH PAGES: Use simple components for now
const SimpleLogin = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
    <div className="text-center">
      <h1 className="text-3xl font-bold text-blue-600 mb-4">SaleMate</h1>
      <p className="text-gray-600 mb-8">Authentication system under construction</p>
      <a href="/dashboard" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        Continue to Dashboard
      </a>
    </div>
  </div>
);

const SimpleSignup = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
    <div className="text-center">
      <h1 className="text-3xl font-bold text-blue-600 mb-4">SaleMate</h1>
      <p className="text-gray-600 mb-8">Sign up coming soon</p>
      <a href="/auth/login" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        Go to Login
      </a>
    </div>
  </div>
);

// APP PAGES: Lazy load for performance
const Dashboard = React.lazy(() => import('../pages/FastDashboard'));
const MyLeads = React.lazy(() => import('../pages/CRM/MyLeads'));
const Shop = React.lazy(() => import('../pages/Shop/Shop'));
const MyDeals = React.lazy(() => import('../pages/Deals/FastMyDeals'));
const PartnersPage = React.lazy(() => import('../pages/Partners/PartnersPage'));
const SupportPanel = React.lazy(() => import('../pages/Support/SupportPanel'));
const AdminPanel = React.lazy(() => import('../pages/Admin/AdminPanel'));
const Settings = React.lazy(() => import('../pages/Settings'));

// Fast loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
  </div>
);

// Safe page wrapper with error boundary and suspense
const SafePage = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary fallback={FastFallback}>
    <Suspense fallback={<PageLoader />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

export const router = createBrowserRouter([
  // Public auth routes
  {
    path: '/auth/login',
    element: <SimpleLogin />,
  },
  {
    path: '/auth/signup', 
    element: <SimpleSignup />,
  },
  
  // Protected routes with AuthGuard
  {
    path: '/',
    element: <AuthGuard />,
    children: [
      {
        path: '',
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <SafePage><Dashboard /></SafePage>,
          },
          {
            path: 'dashboard',
            element: <SafePage><Dashboard /></SafePage>,
          },
          {
            path: 'crm',
            element: <SafePage><MyLeads /></SafePage>,
          },
          {
            path: 'shop',
            element: <SafePage><Shop /></SafePage>,
          },
          {
            path: 'deals',
            element: <SafePage><MyDeals /></SafePage>,
          },
          {
            path: 'partners',
            element: <SafePage><PartnersPage /></SafePage>,
          },
          {
            path: 'settings',
            element: <SafePage><Settings /></SafePage>,
          },
          // Role-restricted routes
          {
            path: 'support',
            element: (
              <RoleGuard allowedRoles={['admin', 'support', 'manager']}>
                <SafePage><SupportPanel /></SafePage>
              </RoleGuard>
            ),
          },
          {
            path: 'admin',
            element: (
              <RoleGuard allowedRoles={['admin']}>
                <SafePage><AdminPanel /></SafePage>
              </RoleGuard>
            ),
          },
        ],
      },
    ],
  },
  
  // Catch all - redirect to dashboard
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);