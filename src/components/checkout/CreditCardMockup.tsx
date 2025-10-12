import React from 'react';
import { CreditCard, Wifi } from 'lucide-react';

interface CreditCardMockupProps {
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  cvv: string;
}

export const CreditCardMockup: React.FC<CreditCardMockupProps> = ({
  cardNumber,
  cardHolder,
  expiryDate,
  cvv,
}) => {
  // Format card number for display (XXXX XXXX XXXX XXXX)
  const formatCardNumber = (number: string) => {
    const cleaned = number.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || '';
    return formatted.padEnd(19, '•');
  };

  return (
    <div className="w-full max-w-md mx-auto mb-6">
      {/* Front of card */}
      <div className="relative w-full h-56 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 p-6 shadow-2xl transform transition-all hover:scale-105">
        {/* Card decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full -ml-12 -mb-12" />
        
        {/* Chip and contactless */}
        <div className="flex items-start justify-between mb-8">
          <div className="w-12 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-md flex items-center justify-center">
            <div className="grid grid-cols-3 gap-0.5">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="w-1 h-1 bg-yellow-900 rounded-full opacity-50" />
              ))}
            </div>
          </div>
          <Wifi className="h-6 w-6 text-white opacity-70 rotate-90" />
        </div>

        {/* Card number */}
        <div className="mb-6">
          <div className="text-white text-2xl font-mono tracking-wider">
            {formatCardNumber(cardNumber) || '•••• •••• •••• ••••'}
          </div>
        </div>

        {/* Card holder and expiry */}
        <div className="flex justify-between items-end">
          <div>
            <div className="text-white text-[10px] uppercase opacity-70 mb-1">
              Card Holder
            </div>
            <div className="text-white text-sm font-semibold uppercase tracking-wide">
              {cardHolder || 'YOUR NAME'}
            </div>
          </div>
          <div>
            <div className="text-white text-[10px] uppercase opacity-70 mb-1">
              Expires
            </div>
            <div className="text-white text-sm font-semibold tracking-wider">
              {expiryDate || 'MM/YY'}
            </div>
          </div>
        </div>

        {/* Card brand logo */}
        <div className="absolute top-6 right-6">
          <CreditCard className="h-10 w-10 text-white opacity-80" />
        </div>
      </div>

      {/* Back of card (CVV preview) */}
      {cvv && (
        <div className="relative w-full h-24 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-900 mt-4 shadow-xl">
          {/* Magnetic stripe */}
          <div className="w-full h-12 bg-black mt-4" />
          
          {/* CVV */}
          <div className="absolute bottom-4 right-6 bg-white rounded px-3 py-1.5">
            <div className="text-xs text-gray-500 uppercase mb-0.5">CVV</div>
            <div className="text-sm font-mono font-bold">{cvv}</div>
          </div>
        </div>
      )}
    </div>
  );
};

