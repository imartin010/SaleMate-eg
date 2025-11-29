import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { isFeatureEnabled } from '../../core/config/features';

interface FeatureGuardProps {
  feature: keyof typeof import('../../core/config/features').FEATURES;
  children: ReactNode;
  redirectTo?: string;
}

/**
 * FeatureGuard - Protects routes based on feature flags
 * Redirects to home if feature is disabled
 */
export const FeatureGuard: React.FC<FeatureGuardProps> = ({
  feature,
  children,
  redirectTo = '/app',
}) => {
  if (!isFeatureEnabled(feature)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

