import React from 'react';

/**
 * Base skeleton component with shimmer effect
 */
const SkeletonBase: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 ${className}`} />
);

/**
 * Wallet credit section skeleton
 */
export const WalletCreditSkeleton: React.FC = () => (
  <div className="rounded-3xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-8 border border-gray-100">
    <div className="space-y-6">
      <div className="space-y-2">
        <SkeletonBase className="h-4 w-24 rounded-lg" />
        <SkeletonBase className="h-12 w-48 rounded-xl" />
      </div>
      <div className="flex gap-4">
        <SkeletonBase className="h-12 flex-1 rounded-xl" />
        <SkeletonBase className="h-12 flex-1 rounded-xl" />
      </div>
    </div>
  </div>
);

/**
 * Quick actions skeleton
 */
export const QuickActionsSkeleton: React.FC = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="rounded-2xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-6 border border-gray-100">
        <div className="flex flex-col items-center gap-3">
          <SkeletonBase className="h-16 w-16 rounded-2xl" />
          <SkeletonBase className="h-4 w-20 rounded-lg" />
        </div>
      </div>
    ))}
  </div>
);

/**
 * Shop window section skeleton
 */
export const ShopWindowSkeleton: React.FC = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <SkeletonBase className="h-8 w-32 rounded-lg" />
      <SkeletonBase className="h-6 w-20 rounded-lg" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden border border-gray-100">
          <SkeletonBase className="h-48 w-full" />
          <div className="p-4 space-y-3">
            <SkeletonBase className="h-6 w-3/4 rounded-lg" />
            <SkeletonBase className="h-4 w-1/2 rounded-lg" />
            <SkeletonBase className="h-5 w-20 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

/**
 * Partners section skeleton
 */
export const PartnersSkeleton: React.FC = () => (
  <div className="space-y-4">
    <SkeletonBase className="h-8 w-40 rounded-lg" />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-2xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-6 border border-gray-100 aspect-square flex items-center justify-center">
          <SkeletonBase className="h-20 w-20 rounded-xl" />
        </div>
      ))}
    </div>
  </div>
);

/**
 * Inventory section skeleton
 */
export const InventorySkeleton: React.FC = () => (
  <div className="rounded-3xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-8 border border-gray-100">
    <div className="space-y-4">
      <SkeletonBase className="h-8 w-32 rounded-lg" />
      <SkeletonBase className="h-12 w-64 rounded-xl" />
      <SkeletonBase className="h-10 w-32 rounded-lg" />
    </div>
  </div>
);

/**
 * Banner skeleton
 */
export const BannerSkeleton: React.FC = () => (
  <div className="rounded-3xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden border border-gray-100">
    <SkeletonBase className="h-64 w-full" />
  </div>
);

