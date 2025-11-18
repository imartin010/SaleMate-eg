/* eslint-disable react-refresh/only-export-components */
import React, { Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ErrorBoundary, FastFallback } from '../../components/common/ErrorBoundary';
import { PageErrorBoundary } from '../../components/common/PageErrorBoundary';
import { ScrollToTop } from '../../components/common/ScrollToTop';
import { Loader2 } from 'lucide-react';

// Performance program pages
const PerformanceHome = React.lazy(() => import('../../pages/Performance/PerformanceHome'));
const PerformanceFranchiseDashboard = React.lazy(() => import('../../pages/Performance/PerformanceFranchiseDashboard'));

// Fast loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
  </div>
);

// Safe page wrapper with error boundary
const SafePage = ({ children }: { children: React.ReactNode }) => (
  <>
    <PageErrorBoundary>
      <ErrorBoundary fallback={FastFallback}>
        <Suspense fallback={<PageLoader />}>
          {children}
        </Suspense>
      </ErrorBoundary>
    </PageErrorBoundary>
  </>
);

export const performanceRouter = createBrowserRouter([
  {
    path: '/',
    element: (
      <>
        <ScrollToTop />
        <SafePage><PerformanceHome /></SafePage>
      </>
    ),
  },
  {
    path: '/franchise/:franchiseSlug',
    element: (
      <>
        <ScrollToTop />
        <SafePage><PerformanceFranchiseDashboard /></SafePage>
      </>
    ),
  },
  // Catch ALL other routes and redirect to home
  // This ensures the performance subdomain ONLY shows the performance program
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
], {
  // Ensure this router is completely separate
  basename: '',
});

