/**
 * Feature Flags
 * 
 * Centralized feature flag management.
 * Use this to enable/disable features without code changes.
 * 
 * @module core/config/features
 */

export const FEATURES = {
  // AI Case Manager
  CASE_MANAGER_ENABLED: true,
  AI_COACHING_ENABLED: true,
  INVENTORY_MATCHING_ENABLED: true,
  
  // Payment methods
  KASHIER_ENABLED: true,
  PAYMOB_ENABLED: false,
  BANK_TRANSFER_ENABLED: true,
  INSTAPAY_ENABLED: true,
  
  // Authentication
  TWO_FACTOR_AUTH_ENABLED: false,
  OTP_LOGIN_ENABLED: true,
  EMAIL_VERIFICATION_REQUIRED: false,
  
  // Marketplace
  BULK_PURCHASE_ENABLED: true,
  LEAD_REQUEST_ENABLED: true,
  
  // Social features
  COMMUNITY_ENABLED: false,
  TEAM_COLLABORATION_ENABLED: true,
  
  // Admin features
  FACEBOOK_LEAD_ADS_ENABLED: true,
  BULK_LEAD_UPLOAD_ENABLED: true,
  
  // Performance tracking
  PERFORMANCE_SUBDOMAIN_ENABLED: true,
  
  // Development/Debug
  DEBUG_MODE: import.meta.env.DEV,
  SHOW_DEV_TOOLS: import.meta.env.DEV,
} as const;

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof FEATURES): boolean {
  return FEATURES[feature] === true;
}

/**
 * Get all enabled features (for debugging)
 */
export function getEnabledFeatures(): string[] {
  return Object.entries(FEATURES)
    .filter(([_, enabled]) => enabled === true)
    .map(([feature]) => feature);
}

/**
 * Feature flag hook for React components
 * Usage: const { caseManagerEnabled } = useFeatureFlags()
 */
export function useFeatureFlags() {
  return {
    caseManagerEnabled: FEATURES.CASE_MANAGER_ENABLED,
    aiCoachingEnabled: FEATURES.AI_COACHING_ENABLED,
    inventoryMatchingEnabled: FEATURES.INVENTORY_MATCHING_ENABLED,
    kashierEnabled: FEATURES.KASHIER_ENABLED,
    paymobEnabled: FEATURES.PAYMOB_ENABLED,
    bankTransferEnabled: FEATURES.BANK_TRANSFER_ENABLED,
    instapayEnabled: FEATURES.INSTAPAY_ENABLED,
    twoFactorAuthEnabled: FEATURES.TWO_FACTOR_AUTH_ENABLED,
    otpLoginEnabled: FEATURES.OTP_LOGIN_ENABLED,
    emailVerificationRequired: FEATURES.EMAIL_VERIFICATION_REQUIRED,
    bulkPurchaseEnabled: FEATURES.BULK_PURCHASE_ENABLED,
    leadRequestEnabled: FEATURES.LEAD_REQUEST_ENABLED,
    communityEnabled: FEATURES.COMMUNITY_ENABLED,
    teamCollaborationEnabled: FEATURES.TEAM_COLLABORATION_ENABLED,
    facebookLeadAdsEnabled: FEATURES.FACEBOOK_LEAD_ADS_ENABLED,
    bulkLeadUploadEnabled: FEATURES.BULK_LEAD_UPLOAD_ENABLED,
    performanceSubdomainEnabled: FEATURES.PERFORMANCE_SUBDOMAIN_ENABLED,
    debugMode: FEATURES.DEBUG_MODE,
    showDevTools: FEATURES.SHOW_DEV_TOOLS,
  };
}

