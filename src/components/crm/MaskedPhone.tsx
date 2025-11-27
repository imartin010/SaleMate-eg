import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface MaskedPhoneProps {
  phone: string;
  leadId: string;
  isRevealed: boolean;
  onToggle: (leadId: string) => void;
  className?: string;
}

export const MaskedPhone: React.FC<MaskedPhoneProps> = ({ 
  phone, 
  leadId, 
  isRevealed, 
  onToggle, 
  className = '' 
}) => {
  const maskPhone = (phoneNumber: string): string => {
    if (phoneNumber.length <= 5) return phoneNumber;
    const firstFive = phoneNumber.substring(0, 5);
    const rest = phoneNumber.substring(5);
    return firstFive + '*'.repeat(rest.length);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle(leadId);
  };

  return (
    <span 
      className={`inline-flex items-center gap-1 cursor-pointer hover:text-indigo-600 transition-colors ${className}`}
      onClick={handleToggle}
      title={isRevealed ? 'Click to hide' : 'Click to reveal'}
    >
      <span>{isRevealed ? phone : maskPhone(phone)}</span>
      {isRevealed ? (
        <EyeOff className="h-3 w-3 text-gray-400" />
      ) : (
        <Eye className="h-3 w-3 text-gray-400" />
      )}
    </span>
  );
};

