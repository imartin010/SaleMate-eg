/**
 * Route Constants
 * 
 * Centralized route path definitions.
 * Use these constants instead of hardcoded strings.
 * 
 * @module core/config/routes
 */

export const ROUTES = {
  // Public routes
  HOME: '/',
  MARKETING: '/marketing',
  MARKETING_AR: '/ar',
  
  // Auth routes
  AUTH: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    RESET_PASSWORD: '/auth/reset-password',
  },
  
  // App routes
  APP: {
    ROOT: '/app',
    HOME: '/app/home',
    DASHBOARD: '/app/dashboard', // Redirects to home
    CRM: '/app/crm',
    CASE_MANAGER: '/app/crm/case/:leadId',
    SHOP: '/app/shop',
    INVENTORY: '/app/inventory',
    DEALS: '/app/deals',
    TEAM: '/app/team',
    TEAM_INVITATION: '/app/team/accept-invitation',
    PARTNERS: '/app/partners',
    SUPPORT: '/app/support',
    SETTINGS: '/app/settings',
    AGENT_SCORING: '/app/agent-scoring',
  },
  
  // Admin routes
  ADMIN: {
    ROOT: '/app/admin',
    DASHBOARD: '/app/admin/dashboard',
    USERS: '/app/admin/users',
    PROJECTS: '/app/admin/projects',
    LEADS: '/app/admin/leads',
    LEAD_UPLOAD: '/app/admin/leads/upload',
    PURCHASES: '/app/admin/purchases',
    LEAD_REQUESTS: '/app/admin/lead-requests',
    WALLETS: '/app/admin/wallets',
    FINANCIAL: '/app/admin/financial',
    ANALYTICS: '/app/admin/analytics',
    SUPPORT: '/app/admin/support',
    CMS: {
      BANNERS: '/app/admin/cms/banners',
      PROJECTS: '/app/admin/cms/projects',
      EMAILS: '/app/admin/cms/emails',
      SMS: '/app/admin/cms/sms',
      MARKETING: '/app/admin/cms/marketing',
      SETTINGS: '/app/admin/cms/settings',
    },
    SYSTEM: {
      AUDIT: '/app/admin/system/audit',
      FLAGS: '/app/admin/system/flags',
    },
  },
  
  // Public pages
  PUBLIC: {
    CONTACT: '/public/contact',
    PRIVACY: '/public/privacy-policy',
    DELIVERY: '/public/delivery-and-shipping-policy',
    REFUND: '/public/refund-policy',
  },
  
  // Legal pages
  LEGAL: {
    TERMS: '/terms',
    REFUND: '/refund-policy',
    PRIVACY: '/privacy-policy',
  },
  
  // Other
  CHECKOUT: '/checkout',
  PAYMENT_CALLBACK: '/payment/kashier/callback',
  CONTACT_SUPPORT: '/contact-support',
  INVESTOR_FUNDING: '/investor-funding',
  BACKEND_AUDIT: '/backend-audit',
} as const;

/**
 * Helper to build dynamic routes
 */
export function buildRoute(template: string, params: Record<string, string>): string {
  let route = template;
  Object.entries(params).forEach(([key, value]) => {
    route = route.replace(`:${key}`, value);
  });
  return route;
}

/**
 * Check if current path matches a route pattern
 */
export function matchesRoute(currentPath: string, routePattern: string): boolean {
  const pattern = routePattern.replace(/:[^/]+/g, '[^/]+');
  const regex = new RegExp(`^${pattern}$`);
  return regex.test(currentPath);
}

