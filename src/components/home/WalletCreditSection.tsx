import React, { useState } from 'react';
import { Plus, History } from 'lucide-react';
import { useWallet } from '../../contexts/WalletContext';
import { WalletCreditSkeleton } from './LoadingSkeletons';
import { TopUpModal } from './TopUpModal';
import { TransactionHistory } from './TransactionHistory';

/**
 * Wallet Credit Section
 * Display wallet balance with circular icon buttons (Top Up, History)
 * Design inspired by Halan fintech aesthetic
 */
const WalletCreditSection: React.FC = React.memo(() => {
  const { balance, loading, refreshBalance } = useWallet();
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  if (loading) {
    return <WalletCreditSkeleton />;
  }

  // Format balance with commas
  const formattedBalance = balance.toLocaleString('en-US', { maximumFractionDigits: 0 });

  return (
    <div className="space-y-4 -mt-20 md:-mt-0 pt-20 md:pt-0">
      {/* Wallet Credit Display - Responsive Size */}
      <div className="rounded-2xl md:rounded-3xl bg-gradient-to-br from-blue-50 via-blue-50 to-blue-50 p-5 md:p-8 border border-blue-100/50 shadow-[0_4px_20px_rgba(59,130,246,0.1)] md:shadow-[0_8px_30px_rgba(59,130,246,0.15)]">
        {/* Credit Type Selector */}
        <div className="flex items-center justify-center mb-3 md:mb-4">
          <button className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-white/80 backdrop-blur-sm text-blue-700 font-semibold text-xs md:text-sm shadow-sm hover:shadow-md transition-all duration-300">
            Wallet Credit
          </button>
        </div>

        {/* Available Label */}
        <div className="text-center">
          <p className="text-xs md:text-sm text-gray-600 font-medium mb-1 md:mb-2">Available</p>
          
          {/* Large Balance Display - Responsive */}
          <div className="text-4xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 bg-clip-text text-transparent mb-1 md:mb-2">
            {formattedBalance}
          </div>
          
          {/* Currency */}
          <p className="text-gray-500 text-xs md:text-sm">EGP</p>
        </div>

        {/* Circular Icon Actions - Responsive */}
        <div className="flex items-center justify-center gap-4 md:gap-6 pt-4 md:pt-6">
          {/* Top Up Button - GREEN */}
          <button
            onClick={() => setShowTopUpModal(true)}
            className="flex flex-col items-center gap-1.5 md:gap-2 group"
            aria-label="Top Up Wallet"
          >
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300">
              <Plus className="h-6 w-6 md:h-7 md:w-7 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xs md:text-sm font-medium text-gray-700 group-hover:text-emerald-600 transition-colors">
              Top Up
            </span>
          </button>

          {/* History Button - BLUE */}
          <button
            onClick={() => setShowHistoryModal(true)}
            className="flex flex-col items-center gap-1.5 md:gap-2 group"
            aria-label="Transaction History"
          >
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300">
              <History className="h-6 w-6 md:h-7 md:w-7 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xs md:text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
              History
            </span>
          </button>
        </div>
      </div>

      {/* Top Up Modal */}
      <TopUpModal
        isOpen={showTopUpModal}
        onClose={() => setShowTopUpModal(false)}
        onSuccess={() => {
          // Refresh wallet balance after successful top-up request
          refreshBalance();
        }}
      />

      {/* Transaction History Modal */}
      <TransactionHistory
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
      />
    </div>
  );
});

WalletCreditSection.displayName = 'WalletCreditSection';

export default WalletCreditSection;
