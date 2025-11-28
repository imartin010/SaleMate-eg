import { Phone, MessageCircle, Mail } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import type { Lead } from '../../hooks/crm/useLeads';

interface QuickActionsProps {
  lead: Lead;
}

export function QuickActions({ lead }: QuickActionsProps) {
  const handleCall = () => {
    if (lead.client_phone) {
      window.location.href = `tel:${lead.client_phone}`;
    }
  };

  const handleWhatsApp = () => {
    if (lead.client_phone) {
      const cleanPhone = lead.client_phone.replace(/[^0-9]/g, '');
      const clientName = lead.client_name || 'there';
      const message = encodeURIComponent(`Hello ${clientName}, this is regarding your property inquiry.`);
      window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
    }
  };

  const handleEmail = () => {
    if (lead.client_email) {
      window.location.href = `mailto:${lead.client_email}`;
    }
  };

  return (
    <Card className="p-6 bg-white/80 backdrop-blur-sm border-indigo-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      
      <div className="space-y-3">
        <Button
          onClick={handleCall}
          disabled={!lead.client_phone}
          className="w-full bg-indigo-600 hover:bg-indigo-700"
        >
          <Phone className="h-4 w-4 mr-2" />
          Call Client
        </Button>

        <Button
          onClick={handleWhatsApp}
          disabled={!lead.client_phone}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          WhatsApp
        </Button>

        <Button
          onClick={handleEmail}
          disabled={!lead.client_email}
          variant="outline"
          className="w-full"
        >
          <Mail className="h-4 w-4 mr-2" />
          Send Email
        </Button>
      </div>

      {/* Contact Info */}
      <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Phone:</span>
          <span className="font-medium text-gray-900">{lead.client_phone || 'N/A'}</span>
        </div>
        {lead.client_email && (
          <div className="flex justify-between">
            <span className="text-gray-600">Email:</span>
            <span className="font-medium text-gray-900 truncate ml-2">{lead.client_email}</span>
          </div>
        )}
        {lead.company_name && (
          <div className="flex justify-between">
            <span className="text-gray-600">Company:</span>
            <span className="font-medium text-gray-900">{lead.company_name}</span>
          </div>
        )}
      </div>
    </Card>
  );
}

