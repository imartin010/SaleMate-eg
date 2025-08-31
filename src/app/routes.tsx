import React, { Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './layout/AppLayout';
import { ErrorBoundary, FastFallback } from '../components/common/ErrorBoundary';
import { Loader2 } from 'lucide-react';

// INSTANT LOADING: Import auth pages immediately (small)
import UnifiedLogin from '../pages/Auth/UnifiedLogin';
import UnifiedSignup from '../pages/Auth/UnifiedSignup';

// ULTRA-FAST LAZY LOADING: Load pages with error boundaries
const Dashboard = React.lazy(() => import('../pages/FastDashboard'));
const MyLeads = React.lazy(() => import('../pages/CRM/MyLeads'));
const Shop = React.lazy(() => import('../pages/Shop/Shop'));
const MyDeals = React.lazy(() => import('../pages/Deals/FastMyDeals'));
const PartnersPage = React.lazy(() => import('../pages/Partners/PartnersPage'));
const SupportPanel = React.lazy(() => import('../pages/Support/SupportPanel'));
const AdminPanel = React.lazy(() => import('../pages/Admin/AdminPanel'));
const Settings = React.lazy(() => import('../pages/Settings'));

// ULTRA-FAST loading component (no unnecessary text)
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
  </div>
);

// Wrapper with error boundary and suspense
const SafePage = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary fallback={FastFallback}>
    <Suspense fallback={<PageLoader />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

export const router = createBrowserRouter([
  // Public routes (no layout)
  {
    path: '/auth/login',
    element: <UnifiedLogin />,
  },
  {
    path: '/auth/signup',
    element: <UnifiedSignup />,
  },
  // Protected routes (with layout)
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
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
        path: 'support',
        element: <SafePage><SupportPanel /></SafePage>,
      },
      {
        path: 'admin',
        element: <SafePage><AdminPanel /></SafePage>,
      },
      {
        path: 'settings',
        element: <SafePage><Settings /></SafePage>,
      },
    ],
  },
  // Catch all - redirect to home
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
