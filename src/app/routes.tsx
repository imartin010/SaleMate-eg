import React, { Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './layout/AppLayout';
import { AuthGuard } from '../components/auth/AuthGuard';
import { RoleGuard } from '../components/auth/RoleGuard';
import { ErrorBoundary, FastFallback } from '../components/common/ErrorBoundary';
import { ScrollToTop } from '../components/common/ScrollToTop';
import { Loader2 } from 'lucide-react';

// AUTH PAGES: Import the real auth components
import Login from '../pages/Auth/Login';
import Signup from '../pages/Auth/Signup';
import PhoneLogin from '../pages/Auth/PhoneLogin';
import ResetPassword from '../pages/Auth/ResetPassword';

// APP PAGES: Lazy load for performance
const Dashboard = React.lazy(() => import('../pages/FastDashboard'));
const MyLeads = React.lazy(() => import('../pages/CRM/MyLeads'));
const Shop = React.lazy(() => import('../pages/Shop/Shop'));
const Inventory = React.lazy(() => import('../pages/Inventory/Inventory'));
const MyDeals = React.lazy(() => import('../pages/Deals/FastMyDeals'));
const TeamPage = React.lazy(() => import('../pages/Team/TeamPage'));
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
  <>
    <ScrollToTop />
    <ErrorBoundary fallback={FastFallback}>
      <Suspense fallback={<PageLoader />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  </>
);

export const router = createBrowserRouter([
  // Public auth routes
  {
    path: '/auth/login',
    element: (
      <>
        <ScrollToTop />
        <Login />
      </>
    ),
  },
  {
    path: '/auth/signup', 
    element: (
      <>
        <ScrollToTop />
        <Signup />
      </>
    ),
  },
  {
    path: '/auth/phone',
    element: (
      <>
        <ScrollToTop />
        <PhoneLogin />
      </>
    ),
  },
  {
    path: '/auth/reset-password',
    element: (
      <>
        <ScrollToTop />
        <ResetPassword />
      </>
    ),
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
            path: 'inventory',
            element: <SafePage><Inventory /></SafePage>,
          },
          {
            path: 'deals',
            element: <SafePage><MyDeals /></SafePage>,
          },
          {
            path: 'team',
            element: (
              <RoleGuard allowedRoles={['admin', 'manager']}>
                <SafePage><TeamPage /></SafePage>
              </RoleGuard>
            ),
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