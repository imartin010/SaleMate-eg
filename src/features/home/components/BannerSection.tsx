import React from 'react';
import { BannerDisplay } from '../dashboard/BannerDisplay';

/**
 * Banner Section
 * Displays banners from admin CMS
 * Uses "dashboard_top" placement to match admin banner configuration
 */
const BannerSection: React.FC = () => {
  return <BannerDisplay placement="dashboard_top" />;
};

export default BannerSection;

