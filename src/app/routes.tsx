/* eslint-disable react-refresh/only-export-components */
import React, { Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './layout/AppLayout';
import { AuthGuard } from '../components/auth/AuthGuard';
import { RoleGuard } from '../components/auth/RoleGuard';
import { ErrorBoundary, FastFallback } from '../components/common/ErrorBoundary';
import { PageErrorBoundary } from '../components/common/PageErrorBoundary';
import { ScrollToTop } from '../components/common/ScrollToTop';
import { Loader2 } from 'lucide-react';

// AUTH PAGES: Import the real auth components
import Login from '../pages/Auth/Login';
import Signup from '../pages/Auth/Signup';
import ResetPassword from '../pages/Auth/ResetPassword';

// MARKETING PAGES: Direct import for better SEO
import Home from '../pages/marketing/Home';
import HomeArabic from '../pages/marketing/HomeArabic';


// LEGAL PAGES
import { TermsAndConditions } from '../pages/Legal/TermsAndConditions';
import { RefundPolicy } from '../pages/Legal/RefundPolicy';
import { PrivacyPolicy } from '../pages/Legal/PrivacyPolicy';

// SUPPORT PAGES
import { ContactSupport } from '../pages/Support/ContactSupport';

// CHECKOUT PAGES
import { Checkout } from '../pages/Checkout/Checkout';

// DRAFT PAGES: No sidebar (removed - file doesn't exist)

// APP PAGES: Lazy load for performance
const Dashboard = React.lazy(() => import('../pages/FastDashboard'));
const MyLeads = React.lazy(() => import('../pages/CRM/ModernCRM'));
const Shop = React.lazy(() => import('../pages/Shop/ImprovedShop'));
const Inventory = React.lazy(() => import('../pages/Inventory/Inventory'));
const MyDeals = React.lazy(() => import('../pages/Deals/FastMyDeals'));
const TeamPage = React.lazy(() => import('../pages/Team/TeamPage'));
const PartnersPage = React.lazy(() => import('../pages/Partners/PartnersPage'));
const InvestorFundingPage = React.lazy(() => import('../pages/InvestorFundingPage'));
const AgentScoringPage = React.lazy(() => import('../pages/AgentScoringPage'));
const SupportPanel = React.lazy(() => import('../pages/Support/SupportPanel'));
const AdminPanel = React.lazy(() => import('../pages/Admin/ModernAdminPanel'));
const Settings = React.lazy(() => import('../pages/Settings'));

// Fast loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
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

export const router = createBrowserRouter([
  // Main marketing home page
  {
    path: '/',
    element: (
      <>
        <ScrollToTop />
        <Home />
      </>
    ),
  },
  
  // Arabic marketing home page
  {
    path: '/ar',
    element: (
      <>
        <ScrollToTop />
        <HomeArabic />
      </>
    ),
  },

  // Legal pages
  {
    path: '/terms',
    element: (
      <>
        <ScrollToTop />
        <TermsAndConditions />
      </>
    ),
  },
  {
    path: '/refund-policy',
    element: (
      <>
        <ScrollToTop />
        <RefundPolicy />
      </>
    ),
  },
  {
    path: '/privacy-policy',
    element: (
      <>
        <ScrollToTop />
        <PrivacyPolicy />
      </>
    ),
  },
  {
    path: '/contact-support',
    element: (
      <>
        <ScrollToTop />
        <ContactSupport />
      </>
    ),
  },
  {
    path: '/checkout',
    element: (
      <>
        <ScrollToTop />
        <Checkout />
      </>
    ),
  },
  
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
    path: '/auth/reset-password',
    element: (
      <>
        <ScrollToTop />
        <ResetPassword />
      </>
    ),
  },
  
  // Draft pages (no sidebar) - removed TeamPNL route as file doesn't exist
  
  // Protected routes with AuthGuard
  {
    path: '/app',
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
            path: 'support',
            element: (
              <RoleGuard allowedRoles={['admin', 'support', 'manager', 'user']}>
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
          {
            path: 'settings',
            element: <SafePage><Settings /></SafePage>,
          },
          {
            path: 'agent-scoring',
            element: <SafePage><AgentScoringPage /></SafePage>,
          },
          {
            path: '*',
            element: <Navigate to="/app/dashboard" replace />,
          },
        ],
      },
    ],
  },
  
  // Investor funding page (public, no sidebar)
  {
    path: '/investor-funding',
    element: (
      <>
        <ScrollToTop />
        <SafePage><InvestorFundingPage /></SafePage>
      </>
    ),
  },
  
  // Catch-all redirect to home
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);