import React, { Suspense } from 'react';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { WalletCreditSkeleton } from '../components/home/LoadingSkeletons';

// Lazy load sections for performance
const WalletCreditSection = React.lazy(() => import('../components/home/WalletCreditSection'));
const QuickActionsSection = React.lazy(() => import('../components/home/QuickActionsSection'));
const BannerSection = React.lazy(() => import('../components/home/BannerSection'));
const ShopWindowSection = React.lazy(() => import('../components/home/ShopWindowSection'));
const PartnersSection = React.lazy(() => import('../components/home/PartnersSection'));
const InventorySection = React.lazy(() => import('../components/home/InventorySection'));

/**
 * Home Page - Modern Fintech Style
 * Wallet-first design with soft neumorphic aesthetics
 */
const Home: React.FC = () => {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-b from-blue-50/30 via-blue-50/20 to-white">
        {/* Main Content */}
        <main className="container mx-auto px-4 py-4 md:px-6 md:py-8 space-y-4 md:space-y-6 pb-20 md:pb-8 max-w-7xl">
          {/* Top Row: Wallet + Quick Actions (Desktop: Side by Side) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {/* Wallet Credit Section - Takes 2 columns on desktop */}
            <div className="md:col-span-2">
              <Suspense fallback={<WalletCreditSkeleton />}>
                <WalletCreditSection />
              </Suspense>
            </div>

            {/* Quick Actions Section - Takes 1 column on desktop */}
            <div className="md:col-span-1">
              <Suspense fallback={<div className="h-24" />}>
                <QuickActionsSection />
              </Suspense>
            </div>
          </div>

          {/* Banner Section - Full Width */}
          <Suspense fallback={null}>
            <BannerSection />
          </Suspense>

          {/* Shop Window Section */}
          <Suspense fallback={<div className="h-48" />}>
            <ShopWindowSection />
          </Suspense>

          {/* Partners + Inventory Row (Desktop: Side by Side) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Partners Section */}
            <div>
              <Suspense fallback={<div className="h-32" />}>
                <PartnersSection />
              </Suspense>
            </div>

            {/* Inventory Section */}
            <div>
              <Suspense fallback={<div className="h-32" />}>
                <InventorySection />
              </Suspense>
            </div>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default Home;

