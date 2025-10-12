import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, Mail, MapPin, Building, Calendar, User, Briefcase, MessageCircle } from 'lucide-react';
import { Lead, LeadStage } from '../../hooks/crm/useLeads';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { FeedbackHistory } from './FeedbackHistory';
import { LeadActions } from './LeadActions';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { extractName } from '../../lib/formatters';
import { Sparkles, Target, Flame, CalendarCheck, TrendingUp, PhoneOff, PhoneMissed, XCircle, Ban, PowerOff, Wallet } from 'lucide-react';

interface LeadDetailsModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStage: (leadId: string, stage: LeadStage) => void;
  onUpdateFeedback: (leadId: string, feedback: string) => void;
  onDelete?: (leadId: string) => void;
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

export const LeadDetailsModal: React.FC<LeadDetailsModalProps> = ({
  lead,
  isOpen,
  onClose,
  onUpdateStage,
  onUpdateFeedback,
  onDelete,
}) => {
  const [feedbackValue, setFeedbackValue] = React.useState('');
  const [isEditingFeedback, setIsEditingFeedback] = React.useState(false);

  React.useEffect(() => {
    if (lead) {
      setFeedbackValue(lead.feedback || '');
      setIsEditingFeedback(false);
    }
  }, [lead]);

  if (!lead) return null;

  const handleSaveFeedback = () => {
    onUpdateFeedback(lead.id, feedbackValue);
    setIsEditingFeedback(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  {lead.client_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{lead.client_name}</h2>
                {lead.client_job_title && (
                  <p className="text-sm text-gray-500">{lead.client_job_title}</p>
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Contact Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              Contact Information
            </h3>
            <div className="space-y-2">
              {/* Phone */}
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-gray-400" />
                <a href={`tel:${lead.client_phone}`} className="text-blue-600 hover:underline">
                  {lead.client_phone}
                </a>
              </div>
              {lead.client_phone2 && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <a href={`tel:${lead.client_phone2}`} className="text-blue-600 hover:underline">
                    {lead.client_phone2}
                  </a>
                </div>
              )}
              {lead.client_phone3 && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <a href={`tel:${lead.client_phone3}`} className="text-blue-600 hover:underline">
                    {lead.client_phone3}
                  </a>
                </div>
              )}
              {/* Email */}
              {lead.client_email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <a href={`mailto:${lead.client_email}`} className="text-blue-600 hover:underline">
                    {lead.client_email}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Project Information */}
          {lead.project && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Building className="h-4 w-4" />
                Project Information
              </h3>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Project:</span>{' '}
                  <span className="text-gray-900">{extractName(lead.project.name)}</span>
                </div>
                <div className="text-sm flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-700">{extractName(lead.project.region)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Lead Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Lead Details
            </h3>
            <div className="space-y-3">
              {/* Stage */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Stage</label>
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

              {/* Source */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Source</label>
                <Badge variant="outline">{lead.source}</Badge>
              </div>

              {/* Created Date */}
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">Created:</span>
                <span className="text-gray-900">
                  {formatInTimeZone(lead.created_at, 'Africa/Cairo', 'MMM d, yyyy HH:mm')}
                </span>
              </div>
            </div>
          </div>

          {/* Feedback Section */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-[#257CFF]" />
              Feedback
            </h3>
            {isEditingFeedback ? (
              <div className="space-y-3">
                <Textarea
                  value={feedbackValue}
                  onChange={(e) => setFeedbackValue(e.target.value)}
                  placeholder="Enter your feedback here..."
                  className="min-h-[120px] border-2 border-[#257CFF]"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveFeedback}
                    className="bg-[#257CFF] hover:bg-[#1a5acc]"
                  >
                    Save Feedback
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setFeedbackValue(lead.feedback || '');
                      setIsEditingFeedback(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setIsEditingFeedback(true)}
                className="cursor-pointer hover:bg-white/50 rounded p-3 transition-colors"
              >
                {lead.feedback ? (
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{lead.feedback}</p>
                ) : (
                  <p className="text-sm text-gray-400 italic">Click to add feedback...</p>
                )}
              </div>
            )}
          </div>

          {/* Feedback History */}
          {lead.feedback_history && lead.feedback_history.length > 0 && (
            <FeedbackHistory history={lead.feedback_history} />
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <LeadActions
              phone={lead.client_phone}
              name={lead.client_name}
            />
            {onDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this lead?')) {
                    onDelete(lead.id);
                    onClose();
                  }
                }}
              >
                Delete Lead
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

