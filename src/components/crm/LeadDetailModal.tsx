import React from 'react';
import { X, Phone, Mail, Building, MapPin, Calendar, User, MessageSquare, DollarSign, Briefcase, Tag, Save } from 'lucide-react';
import { Lead, LeadStage } from '../../hooks/crm/useLeads';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
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
  onUpdateFeedback?: (leadId: string, feedback: string) => void;
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
    'New Lead': 'bg-blue-50 text-blue-700 border-blue-200',
    'Potential': 'bg-purple-50 text-purple-700 border-purple-200',
    'Hot Case': 'bg-orange-50 text-orange-700 border-orange-200',
    'Meeting Done': 'bg-green-50 text-green-700 border-green-200',
    'Closed Deal': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'No Answer': 'bg-gray-50 text-gray-700 border-gray-200',
    'Call Back': 'bg-yellow-50 text-yellow-700 border-yellow-200',
    'Whatsapp': 'bg-green-50 text-green-700 border-green-200',
    'Non Potential': 'bg-red-50 text-red-700 border-red-200',
    'Wrong Number': 'bg-red-50 text-red-700 border-red-200',
    'Switched Off': 'bg-slate-50 text-slate-700 border-slate-200',
    'Low Budget': 'bg-amber-50 text-amber-700 border-amber-200',
  };
  return colors[stage] || 'bg-gray-50 text-gray-700 border-gray-200';
};

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  lead,
  open,
  onClose,
  onUpdateStage,
  onUpdateFeedback,
}) => {
  const [feedbackValue, setFeedbackValue] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (lead) {
      setFeedbackValue(lead.feedback || '');
    }
  }, [lead]);

  const handleSaveFeedback = async () => {
    if (!lead || !onUpdateFeedback) return;
    setIsSaving(true);
    try {
      await onUpdateFeedback(lead.id, feedbackValue);
    } finally {
      setIsSaving(false);
    }
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-screen md:max-h-[90vh] overflow-y-auto mx-0 md:mx-4 p-0 bg-white w-full md:w-auto h-full md:h-auto">
        {/* Professional Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4 md:px-6 md:py-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200 flex-shrink-0">
                <span className="text-gray-700 font-semibold text-base md:text-lg">
                  {lead.client_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg md:text-xl font-semibold text-gray-900 truncate">{lead.client_name}</h2>
                {lead.company_name && (
                  <p className="text-xs md:text-sm text-gray-600 mt-0.5 truncate">{lead.company_name}</p>
                )}
                {lead.client_job_title && (
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{lead.client_job_title}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition-colors flex-shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-4 md:p-6 pb-20 md:pb-6 space-y-4 md:space-y-6">
          {/* Contact Information - Professional Layout */}
          <div className="border border-gray-200 rounded-lg p-4 md:p-5 bg-white">
            <h3 className="text-xs md:text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3 md:mb-4 flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-500" />
              Contact Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
              {lead.client_phone && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                  <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 font-medium">Primary</p>
                    <a href={`tel:${lead.client_phone}`} className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                      {lead.client_phone}
                    </a>
                  </div>
                </div>
              )}
              {lead.client_phone2 && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                  <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 font-medium">Secondary</p>
                    <a href={`tel:${lead.client_phone2}`} className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                      {lead.client_phone2}
                    </a>
                  </div>
                </div>
              )}
              {lead.client_phone3 && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                  <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 font-medium">Tertiary</p>
                    <a href={`tel:${lead.client_phone3}`} className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                      {lead.client_phone3}
                    </a>
                  </div>
                </div>
              )}
              {lead.client_email && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                  <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 font-medium">Email</p>
                    <a href={`mailto:${lead.client_email}`} className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors truncate block">
                      {lead.client_email}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Project & Source - Clean Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            {lead.project && (
              <div className="border border-gray-200 rounded-lg p-4 md:p-5 bg-white">
                <div className="flex items-center gap-2 mb-2 md:mb-3">
                  <Building className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-500" />
                  <h3 className="text-xs md:text-sm font-semibold text-gray-900 uppercase tracking-wide">Project</h3>
                </div>
                <p className="text-sm md:text-base font-semibold text-gray-900 mb-2 truncate">{extractName(lead.project.name)}</p>
                {lead.project.region && (
                  <div className="flex items-center gap-1.5 text-xs md:text-sm text-gray-600">
                    <MapPin className="h-3 w-3 md:h-3.5 md:w-3.5" />
                    <span className="truncate">{extractName(lead.project.region)}</span>
                  </div>
                )}
              </div>
            )}
            <div className="border border-gray-200 rounded-lg p-4 md:p-5 bg-white">
              <div className="flex items-center gap-2 mb-2 md:mb-3">
                <Tag className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-500" />
                <h3 className="text-xs md:text-sm font-semibold text-gray-900 uppercase tracking-wide">Source</h3>
              </div>
              <Badge className="bg-gray-100 text-gray-700 border border-gray-200 text-xs md:text-sm px-2 md:px-3 py-1 font-medium">
                {lead.source || 'N/A'}
              </Badge>
            </div>
          </div>

          {/* Stage & Budget - Professional Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <div className="border border-gray-200 rounded-lg p-4 md:p-5 bg-white">
              <div className="flex items-center gap-2 mb-2 md:mb-3">
                {getStageIcon(lead.stage)}
                <h3 className="text-xs md:text-sm font-semibold text-gray-900 uppercase tracking-wide">Lead Stage</h3>
              </div>
              <Select
                value={lead.stage}
                onValueChange={(value) => onUpdateStage(lead.id, value as LeadStage)}
              >
                <SelectTrigger className={`w-full h-9 md:h-10 text-xs md:text-sm font-medium border-2 rounded-lg ${getStageColor(lead.stage)}`}>
                  <div className="flex items-center gap-2">
                    {getStageIcon(lead.stage)}
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  {STAGES.map((stage) => (
                    <SelectItem key={stage} value={stage} className="rounded-md">
                      <div className="flex items-center gap-2 py-1">
                        {getStageIcon(stage)}
                        <span className="font-medium text-xs md:text-sm">{stage}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {lead.budget && (
              <div className="border border-gray-200 rounded-lg p-4 md:p-5 bg-white">
                <div className="flex items-center gap-2 mb-2 md:mb-3">
                  <DollarSign className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-500" />
                  <h3 className="text-xs md:text-sm font-semibold text-gray-900 uppercase tracking-wide">Budget</h3>
                </div>
                <p className="text-xl md:text-2xl font-bold text-gray-900">EGP {lead.budget.toLocaleString()}</p>
              </div>
            )}
          </div>

          {/* Feedback - Professional Card - Always Visible for Call Status */}
          <div className="border border-gray-200 rounded-lg p-4 md:p-5 bg-white">
            <div className="flex items-center gap-2 mb-2 md:mb-3">
              <MessageSquare className="h-3.5 w-3.5 md:h-4 md:w-4 text-[#257CFF]" />
              <h3 className="text-xs md:text-sm font-semibold text-gray-900 uppercase tracking-wide">Call Status & Feedback</h3>
            </div>
            <div className="space-y-3">
              <Textarea
                value={feedbackValue}
                onChange={(e) => setFeedbackValue(e.target.value)}
                placeholder="Enter call status, feedback, notes, or next steps here..."
                className="min-h-[120px] text-xs md:text-sm resize-none border-2 border-gray-300 focus:border-[#257CFF] focus:ring-2 focus:ring-[#257CFF]/20"
                rows={5}
              />
              {onUpdateFeedback && (
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">Important: Document your call status and feedback</p>
                  <Button
                    size="sm"
                    onClick={handleSaveFeedback}
                    disabled={isSaving}
                    className="bg-[#257CFF] hover:bg-[#1a5acc] text-white"
                  >
                    <Save className="h-3 w-3 mr-1.5" />
                    {isSaving ? 'Saving...' : 'Save Feedback'}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Company & Job Title */}
          {(lead.company_name || lead.client_job_title) && (
            <div className="border border-gray-200 rounded-lg p-4 md:p-5 bg-white">
              <div className="flex items-center gap-2 mb-2 md:mb-3">
                <Briefcase className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-500" />
                <h3 className="text-xs md:text-sm font-semibold text-gray-900 uppercase tracking-wide">Additional Information</h3>
              </div>
              <div className="space-y-2">
                {lead.company_name && (
                  <div className="flex items-start gap-2 text-xs md:text-sm">
                    <span className="text-gray-500 font-medium min-w-[70px] md:min-w-[80px] flex-shrink-0">Company:</span>
                    <span className="text-gray-900 break-words">{lead.company_name}</span>
                  </div>
                )}
                {lead.client_job_title && (
                  <div className="flex items-start gap-2 text-xs md:text-sm">
                    <span className="text-gray-500 font-medium min-w-[70px] md:min-w-[80px] flex-shrink-0">Position:</span>
                    <span className="text-gray-900 break-words">{lead.client_job_title}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Feedback History */}
          {lead.feedback_history && lead.feedback_history.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-4 md:p-5 bg-white">
              <FeedbackHistory history={lead.feedback_history} />
            </div>
          )}

          {/* Metadata - Professional Footer */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Calendar className="h-3.5 w-3.5" />
              <span>Created {format(new Date(lead.created_at), 'MMM d, yyyy')} at {format(new Date(lead.created_at), 'HH:mm')}</span>
            </div>
          </div>

          {/* Actions - Professional Footer */}
          <div className="border-t border-gray-200 pt-4">
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
