import React from 'react';
import { BannerDisplay } from '../dashboard/BannerDisplay';

/**
 * Banner Section
 * Displays banners from admin CMS
 */
const BannerSection: React.FC = () => {
  return <BannerDisplay placement="home_banner" />;
};

export default BannerSection;

