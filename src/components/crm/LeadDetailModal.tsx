import React from 'react';
import { X, Phone, Mail, Building, MapPin, Calendar, User, MessageSquare } from 'lucide-react';
import { Lead, LeadStage } from '../../hooks/crm/useLeads';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { LeadActions } from './LeadActions';
import { FeedbackHistory } from './FeedbackHistory';
import { format } from 'date-fns';
import { extractName } from '../../lib/formatters';
import { Sparkles, Target, Flame, CalendarCheck, TrendingUp, PhoneOff, PhoneMissed, MessageCircle, XCircle, Ban, PowerOff, Wallet } from 'lucide-react';

interface LeadDetailModalProps {
  lead: Lead | null;
  open: boolean;
  onClose: () => void;
  onUpdateStage: (leadId: string, stage: LeadStage) => void;
}

const STAGES: LeadStage[] = [
  'New Lead',
  'Potential',
  'Hot Case',
  'Meeting Done',
  'Closed Deal',
  'No Answer',
  'Call Back',
  'Whatsapp',
  'Non Potential',
  'Wrong Number',
  'Switched Off',
  'Low Budget',
];

const getStageIcon = (stage: LeadStage): JSX.Element => {
  const icons: Record<LeadStage, JSX.Element> = {
    'New Lead': <Sparkles className="h-4 w-4" />,
    'Potential': <Target className="h-4 w-4" />,
    'Hot Case': <Flame className="h-4 w-4" />,
    'Meeting Done': <CalendarCheck className="h-4 w-4" />,
    'Closed Deal': <TrendingUp className="h-4 w-4" />,
    'No Answer': <PhoneOff className="h-4 w-4" />,
    'Call Back': <PhoneMissed className="h-4 w-4" />,
    'Whatsapp': <MessageCircle className="h-4 w-4" />,
    'Non Potential': <XCircle className="h-4 w-4" />,
    'Wrong Number': <Ban className="h-4 w-4" />,
    'Switched Off': <PowerOff className="h-4 w-4" />,
    'Low Budget': <Wallet className="h-4 w-4" />,
  };
  return icons[stage];
};

const getStageColor = (stage: LeadStage): string => {
  const colors: Record<LeadStage, string> = {
    'New Lead': 'bg-blue-100 text-blue-800',
    'Potential': 'bg-purple-100 text-purple-800',
    'Hot Case': 'bg-orange-100 text-orange-800',
    'Meeting Done': 'bg-green-100 text-green-800',
    'Closed Deal': 'bg-emerald-100 text-emerald-800 font-semibold',
    'No Answer': 'bg-gray-100 text-gray-800',
    'Call Back': 'bg-yellow-100 text-yellow-800',
    'Whatsapp': 'bg-green-100 text-green-800',
    'Non Potential': 'bg-red-100 text-red-800',
    'Wrong Number': 'bg-red-100 text-red-800',
    'Switched Off': 'bg-slate-100 text-slate-800',
    'Low Budget': 'bg-amber-100 text-amber-800',
  };
  return colors[stage] || 'bg-gray-100 text-gray-800';
};

const getPlatformColor = (platform: string): string => {
  const colors: Record<string, string> = {
    Facebook: 'bg-blue-100 text-blue-800',
    Google: 'bg-red-100 text-red-800',
    TikTok: 'bg-pink-100 text-pink-800',
    Other: 'bg-gray-100 text-gray-800',
  };
  return colors[platform] || 'bg-gray-100 text-gray-800';
};

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  lead,
  open,
  onClose,
  onUpdateStage,
}) => {
  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-lg">
                {lead.client_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{lead.client_name}</h2>
              {lead.client_job_title && (
                <p className="text-sm text-gray-500">{lead.client_job_title}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Contact Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Contact Information
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <a href={`tel:${lead.client_phone}`} className="text-blue-600 hover:underline">
                  {lead.client_phone}
                </a>
              </div>
              {lead.client_phone2 && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <a href={`tel:${lead.client_phone2}`} className="text-blue-600 hover:underline">
                    {lead.client_phone2}
                  </a>
                </div>
              )}
              {lead.client_phone3 && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <a href={`tel:${lead.client_phone3}`} className="text-blue-600 hover:underline">
                    {lead.client_phone3}
                  </a>
                </div>
              )}
              {lead.client_email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <a href={`mailto:${lead.client_email}`} className="text-blue-600 hover:underline">
                    {lead.client_email}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Project & Platform */}
          <div className="grid grid-cols-2 gap-4">
            {lead.project && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Project
                </h3>
                <p className="font-medium text-gray-900">{extractName(lead.project.name)}</p>
                <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                  <MapPin className="h-3 w-3" />
                  {extractName(lead.project.region)}
                </div>
              </div>
            )}
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Platform</h3>
              <Badge className={getPlatformColor(lead.source)}>{lead.source}</Badge>
            </div>
          </div>

          {/* Stage */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Lead Stage</h3>
            <Select
              value={lead.stage}
              onValueChange={(value) => onUpdateStage(lead.id, value as LeadStage)}
            >
              <SelectTrigger className={`w-full ${getStageColor(lead.stage)}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAGES.map((stage) => (
                  <SelectItem key={stage} value={stage}>
                    <div className="flex items-center gap-2">
                      {getStageIcon(stage)}
                      <span>{stage}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Feedback */}
          {lead.feedback && (
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-gray-300 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-[#257CFF]" />
                Current Feedback
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">{lead.feedback}</p>
            </div>
          )}

          {/* Feedback History */}
          {lead.feedback_history && lead.feedback_history.length > 0 && (
            <div>
              <FeedbackHistory history={lead.feedback_history} />
            </div>
          )}

          {/* Date Information */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>Created {format(new Date(lead.created_at), 'MMM d, yyyy HH:mm')}</span>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t">
            <LeadActions
              phone={lead.client_phone}
              name={lead.client_name}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

