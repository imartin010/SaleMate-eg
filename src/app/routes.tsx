/* eslint-disable react-refresh/only-export-components */
import React, { Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './layout/AppLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { AuthGuard } from '../components/auth/AuthGuard';
import { OptionalAuthGuard } from '../components/auth/OptionalAuthGuard';
import { CheckoutGuard } from '../components/auth/CheckoutGuard';
import { RoleGuard } from '../components/auth/RoleGuard';
import { HomePageGuard } from '../components/auth/HomePageGuard';
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
import { ContactUs } from '../pages/Public/ContactUs';
import { PrivacyPolicyPublic } from '../pages/Public/PrivacyPolicyPublic';
import { DeliveryPolicy } from '../pages/Public/DeliveryPolicy';
import { RefundPolicyPublic } from '../pages/Public/RefundPolicyPublic';

// SUPPORT PAGES
import { ContactSupport } from '../pages/Support/ContactSupport';

// CHECKOUT PAGES
import { Checkout } from '../pages/Checkout/Checkout';

// PAYMENT PAGES
import { PaymentCallback } from '../pages/Payment/PaymentCallback';

// DRAFT PAGES: No sidebar (removed - file doesn't exist)

// APP PAGES: Lazy load for performance
const AppHome = React.lazy(() => import('../pages/Home'));
const Dashboard = React.lazy(() => import('../pages/FastDashboard')); // Legacy, will be removed
const MyLeads = React.lazy(() => import('../pages/CRM/ModernCRM'));
const CRMDashboard = React.lazy(() => import('../pages/CRM/CRMDashboard'));
const CaseManager = React.lazy(() => import('../pages/Case/CaseManager'));
const Shop = React.lazy(() => import('../pages/Shop/ImprovedShop'));
const Inventory = React.lazy(() => import('../pages/Inventory/Inventory'));
const MyDeals = React.lazy(() => import('../pages/Deals/FastMyDeals'));
const TeamPage = React.lazy(() => import('../pages/Team/TeamPage'));
const AcceptInvitation = React.lazy(() => import('../pages/Team/AcceptInvitation'));
const PartnersPage = React.lazy(() => import('../pages/Partners/PartnersPage'));
const InvestorFundingPage = React.lazy(() => import('../pages/InvestorFundingPage'));
const AgentScoringPage = React.lazy(() => import('../pages/AgentScoringPage'));
const SupportPanel = React.lazy(() => import('../pages/Support/SupportPanel'));
const AdminPanel = React.lazy(() => import('../pages/Admin/ModernAdminPanel'));
const Settings = React.lazy(() => import('../pages/Settings'));

// NEW ADMIN PANEL PAGES
const AdminDashboard = React.lazy(() => import('../pages/Admin/AdminDashboard'));
const UserManagement = React.lazy(() => import('../pages/Admin/UserManagement'));
const Projects = React.lazy(() => import('../pages/Admin/Projects'));
const Leads = React.lazy(() => import('../pages/Admin/Leads'));
const LeadUpload = React.lazy(() => import('../pages/Admin/LeadUpload'));
const PurchaseRequests = React.lazy(() => import('../pages/Admin/PurchaseRequests'));
const LeadRequests = React.lazy(() => import('../pages/Admin/LeadRequests'));
const WalletManagement = React.lazy(() => import('../pages/Admin/WalletManagement'));
const FinancialReports = React.lazy(() => import('../pages/Admin/FinancialReports'));
const Analytics = React.lazy(() => import('../pages/Admin/Analytics'));
const Banners = React.lazy(() => import('../pages/Admin/CMS/Banners'));
const EmailTemplates = React.lazy(() => import('../pages/Admin/CMS/EmailTemplates'));
const SMSTemplates = React.lazy(() => import('../pages/Admin/CMS/SMSTemplates'));
const MarketingContent = React.lazy(() => import('../pages/Admin/CMS/MarketingContent'));
const PlatformSettings = React.lazy(() => import('../pages/Admin/CMS/PlatformSettings'));
const AuditLogs = React.lazy(() => import('../pages/Admin/System/AuditLogs'));
const FeatureFlags = React.lazy(() => import('../pages/Admin/System/FeatureFlags'));
const BackendAudit = React.lazy(() => import('../pages/Admin/BackendAudit'));

// Fast loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[200px]">
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

export const router = createBrowserRouter([
  // Main home page at root - redirects authenticated users to /app
  {
    path: '/',
    element: (
      <>
        <ScrollToTop />
        <HomePageGuard>
          <Home />
        </HomePageGuard>
      </>
    ),
  },
  
  // Marketing home page (also available at /marketing for backward compatibility)
  {
    path: '/marketing',
    element: (
      <>
        <ScrollToTop />
        <Home />
      </>
    ),
  },
  
  // Public compliance pages with temporary header
  {
    path: '/public/contact',
    element: (
      <>
        <ScrollToTop />
        <ContactUs />
      </>
    ),
  },
  {
    path: '/public/privacy-policy',
    element: (
      <>
        <ScrollToTop />
        <PrivacyPolicyPublic />
      </>
    ),
  },
  {
    path: '/public/delivery-policy',
    element: (
      <>
        <ScrollToTop />
        <Navigate to="/public/delivery-and-shipping-policy" replace />
      </>
    ),
  },
  {
    path: '/public/delivery-and-shipping-policy',
    element: (
      <>
        <ScrollToTop />
        <DeliveryPolicy />
      </>
    ),
  },
  {
    path: '/public/refund-policy',
    element: (
      <>
        <ScrollToTop />
        <RefundPolicyPublic />
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
        <CheckoutGuard>
          <Checkout />
        </CheckoutGuard>
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
  // Payment callback route (outside AppLayout to avoid header/nav, no auth required - webhook handles processing)
  {
    path: '/payment/kashier/callback',
    element: <PaymentCallback />,
  },
  
  // Backend Audit - Accessible without auth to diagnose issues (outside /app to avoid AppLayout)
  {
    path: '/backend-audit',
    element: (
      <>
        <ScrollToTop />
        <SafePage><BackendAudit /></SafePage>
      </>
    ),
  },
  
  {
    path: '/app',
    element: <OptionalAuthGuard />,
    children: [
      // Admin routes with AdminLayout
      {
        path: 'admin',
        element: (
          <RoleGuard allowedRoles={['admin']}>
            <AdminLayout />
          </RoleGuard>
        ),
        children: [
          {
            index: true,
            element: <Navigate to="/app/admin/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: <SafePage><AdminDashboard /></SafePage>,
          },
          {
            path: 'users',
            element: <SafePage><UserManagement /></SafePage>,
          },
          {
            path: 'projects',
            element: <SafePage><Projects /></SafePage>,
          },
          {
            path: 'leads',
            element: <SafePage><Leads /></SafePage>,
          },
          {
            path: 'leads/upload',
            element: <SafePage><LeadUpload /></SafePage>,
          },
          {
            path: 'purchases',
            element: <SafePage><PurchaseRequests /></SafePage>,
          },
          {
            path: 'lead-requests',
            element: <SafePage><LeadRequests /></SafePage>,
          },
          {
            path: 'wallets',
            element: <SafePage><WalletManagement /></SafePage>,
          },
          {
            path: 'financial',
            element: <SafePage><FinancialReports /></SafePage>,
          },
          {
            path: 'analytics',
            element: <SafePage><Analytics /></SafePage>,
          },
          {
            path: 'support',
            element: <SafePage><SupportPanel /></SafePage>,
          },
          {
            path: 'cms/banners',
            element: <SafePage><Banners /></SafePage>,
          },
          {
            path: 'cms/projects',
            element: <Navigate to="/app/admin/projects" replace />,
          },
          {
            path: 'cms/emails',
            element: <SafePage><EmailTemplates /></SafePage>,
          },
          {
            path: 'cms/sms',
            element: <SafePage><SMSTemplates /></SafePage>,
          },
          {
            path: 'cms/marketing',
            element: <SafePage><MarketingContent /></SafePage>,
          },
          {
            path: 'cms/settings',
            element: <SafePage><PlatformSettings /></SafePage>,
          },
          {
            path: 'system/audit',
            element: <SafePage><AuditLogs /></SafePage>,
          },
          {
            path: 'system/flags',
            element: <SafePage><FeatureFlags /></SafePage>,
          },
        ],
      },
      // Regular app routes with AppLayout
      {
        path: '',
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <SafePage><AppHome /></SafePage>,
          },
          {
            path: 'home',
            element: <SafePage><AppHome /></SafePage>,
          },
          {
            path: 'dashboard',
            element: <SafePage><AppHome /></SafePage>, // Redirect dashboard to home
          },
          {
            path: 'crm/dashboard',
            element: <Navigate to="/app/crm/analysis" replace />,
          },
          {
            path: 'crm/analysis',
            element: <SafePage><CRMDashboard /></SafePage>,
          },
          {
            path: 'crm/case/:leadId',
            element: <SafePage><CaseManager /></SafePage>,
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
            element: <SafePage><TeamPage /></SafePage>,
          },
          {
            path: 'team/accept-invitation',
            element: <SafePage><AcceptInvitation /></SafePage>,
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
            path: 'settings',
            element: <SafePage><Settings /></SafePage>,
          },
          {
            path: 'agent-scoring',
            element: <SafePage><AgentScoringPage /></SafePage>,
          },
          {
            path: '*',
            element: <Navigate to="/app" replace />,
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