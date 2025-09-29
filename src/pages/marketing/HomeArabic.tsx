import { useEffect } from 'react';
import MarketingSEOArabic from './seoArabic';
import HeroArabic from './components/HeroArabic';
import PartnerStripArabic from './components/PartnerStripArabic';
import ValueGridArabic from './components/ValueGridArabic';
import HowItWorksArabic from './components/HowItWorksArabic';
import LiveMetricsArabic from './components/LiveMetricsArabic';
import CRMPreviewArabic from './components/CRMPreviewArabic';
import FinalCTAArabic from './components/FinalCTAArabic';
import FooterArabic from './components/FooterArabic';
import { SectionDivider } from './components/Decor';

const HomeArabic = () => {
  // Enable smooth scrolling for anchor links
  useEffect(() => {
    const handleSmoothScroll = (e: Event) => {
      const target = e.target as HTMLAnchorElement;
      if (target.hash) {
        e.preventDefault();
        const element = document.querySelector(target.hash);
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    };

    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
      link.addEventListener('click', handleSmoothScroll);
    });

    return () => {
      links.forEach(link => {
        link.removeEventListener('click', handleSmoothScroll);
      });
    };
  }, []);

  // Respect user's motion preferences
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    if (prefersReducedMotion.matches) {
      document.documentElement.style.setProperty('--animation-duration', '0.01ms');
      document.documentElement.style.setProperty('--animation-iteration-count', '1');
    }
  }, []);

  // Set RTL direction
  useEffect(() => {
    document.documentElement.setAttribute('dir', 'rtl');
    document.documentElement.setAttribute('lang', 'ar');
    
    return () => {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
    };
  }, []);

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      {/* SEO Meta Tags */}
      <MarketingSEOArabic />

        {/* Hero Section */}
        <HeroArabic />

        {/* Partner Strip */}
        <PartnerStripArabic />
        <SectionDivider variant="wave" />

        {/* Value Propositions */}
        <ValueGridArabic />

        {/* How It Works */}
        <HowItWorksArabic />
        <SectionDivider variant="curve" />

        {/* Live Metrics */}
        <LiveMetricsArabic />

        {/* CRM Preview */}
        <CRMPreviewArabic />
        <SectionDivider variant="zigzag" />

        {/* Final CTA */}
        <FinalCTAArabic />

      {/* Footer */}
      <FooterArabic />
    </div>
  );
};

export default HomeArabic;
