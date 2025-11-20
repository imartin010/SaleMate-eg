import { useEffect } from 'react';
import PerformanceHero from './components/PerformanceHero';
import PerformanceValueGrid from './components/PerformanceValueGrid';
import PerformanceHowItWorks from './components/PerformanceHowItWorks';
import PerformanceLiveMetrics from './components/PerformanceLiveMetrics';
import PerformanceFinalCTA from './components/PerformanceFinalCTA';
import PerformanceFooter from './components/PerformanceFooter';
import { SectionDivider } from '../marketing/components/Decor';

const PerformanceHomePage = () => {
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
      {/* Hero Section */}
      <PerformanceHero />

      {/* Section Divider */}
      <SectionDivider variant="wave" />

      {/* Value Propositions */}
      <PerformanceValueGrid />

      {/* How It Works */}
      <PerformanceHowItWorks />
      <SectionDivider variant="curve" />

      {/* Live Metrics */}
      <PerformanceLiveMetrics />

      {/* Final CTA */}
      <PerformanceFinalCTA />
      <SectionDivider variant="zigzag" />

      {/* Footer */}
      <PerformanceFooter />
    </div>
  );
};

export default PerformanceHomePage;

