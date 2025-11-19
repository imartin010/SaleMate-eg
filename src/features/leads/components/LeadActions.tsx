import React from 'react';
import { Phone, MessageCircle, FileText } from 'lucide-react';
import { Button } from '../ui/button';

interface LeadActionsProps {
  phone: string;
  name: string;
  compact?: boolean;
}

export const LeadActions: React.FC<LeadActionsProps> = ({
  phone,
  name,
  compact = false,
}) => {
  const handleCall = () => {
    window.location.href = `tel:${phone}`;
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(`Hello ${name}, I'm reaching out regarding your inquiry.`);
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
  };

  const handleOffer = () => {
    // Placeholder for offer action
    console.log('Send offer to:', name);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCall}
          className="hover:bg-green-50 hover:text-green-600"
          title="Call"
        >
          <Phone className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleWhatsApp}
          className="hover:bg-green-50 hover:text-green-600"
          title="WhatsApp"
        >
          <MessageCircle className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleCall}
        className="hover:bg-green-50 hover:text-green-600 hover:border-green-300"
      >
        <Phone className="h-4 w-4 mr-1" />
        Call
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleWhatsApp}
        className="hover:bg-green-50 hover:text-green-600 hover:border-green-300"
      >
        <MessageCircle className="h-4 w-4 mr-1" />
        WhatsApp
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleOffer}
        className="hover:bg-[#257CFF] hover:text-white hover:border-[#257CFF]"
      >
        <FileText className="h-4 w-4 mr-1" />
        Offer
      </Button>
    </div>
  );
};

