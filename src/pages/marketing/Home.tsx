import React, { useEffect } from 'react';
import MarketingSEO from './seo';
import Hero from './components/Hero';
import PartnerStrip from './components/PartnerStrip';
import ValueGrid from './components/ValueGrid';
import HowItWorks from './components/HowItWorks';
import LiveMetrics from './components/LiveMetrics';
import CRMPreview from './components/CRMPreview';
import Testimonials from './components/Testimonials';
import FAQ from './components/FAQ';
import FinalCTA from './components/FinalCTA';
import Footer from './components/Footer';
import { SectionDivider } from './components/Decor';

const Home = () => {
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

  return (
    <div className="min-h-screen bg-white">
      {/* SEO Meta Tags */}
      <MarketingSEO />

        {/* Hero Section */}
        <Hero />

        {/* Partner Strip */}
        <PartnerStrip />
        <SectionDivider variant="wave" />

        {/* Value Propositions */}
        <ValueGrid />

        {/* How It Works */}
        <HowItWorks />
        <SectionDivider variant="curve" />

        {/* Live Metrics */}
        <LiveMetrics />

        {/* CRM Preview */}
        <CRMPreview />
        <SectionDivider variant="zigzag" />

        {/* Testimonials */}
        <Testimonials />

        {/* FAQ */}
        <FAQ />

        {/* Final CTA */}
        <FinalCTA />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;
