import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Building, Calendar, MessageSquare, Save, X, ChevronDown, ChevronUp, Sparkles, Target, Flame, CalendarCheck, TrendingUp, PhoneOff, PhoneMissed, MessageCircle, XCircle, Ban, PowerOff, Wallet } from 'lucide-react';
import { Lead, LeadStage } from '../../hooks/crm/useLeads';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { LeadActions } from './LeadActions';
import { FeedbackHistory } from './FeedbackHistory';
import { LeadDetailModal } from './LeadDetailModal';
import { format } from 'date-fns';
import { extractName } from '../../lib/formatters';

interface LeadTableProps {
  leads: Lead[];
  onUpdateStage: (leadId: string, stage: LeadStage) => void;
  onUpdateFeedback: (leadId: string, feedback: string) => void;
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

export const LeadTable: React.FC<LeadTableProps> = ({
  leads,
  onUpdateStage,
  onUpdateFeedback,
}) => {
  const [editingFeedbackId, setEditingFeedbackId] = useState<string | null>(null);
  const [feedbackValue, setFeedbackValue] = useState('');
  const [expandedFeedbackId, setExpandedFeedbackId] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const handleFeedbackEdit = (leadId: string, currentFeedback: string) => {
    setEditingFeedbackId(leadId);
    setFeedbackValue(currentFeedback || '');
    setExpandedFeedbackId(leadId);
  };

  const handleFeedbackSave = (leadId: string) => {
    onUpdateFeedback(leadId, feedbackValue);
    setEditingFeedbackId(null);
  };

  const handleFeedbackCancel = () => {
    setEditingFeedbackId(null);
    setFeedbackValue('');
  };

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setShowDetailModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedLead(null);
  };

  if (leads.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No leads found</h3>
          <p className="text-gray-600">Get started by adding your first lead or adjust your filters.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Lead
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Project
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Platform
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stage
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[300px]">
                Feedback
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leads.map((lead, index) => (
              <motion.tr
                key={lead.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.02 }}
                className="hover:bg-gray-50 transition-colors"
              >
                {/* Lead Name */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div 
                    className="flex items-center cursor-pointer hover:bg-gray-50 -mx-2 px-2 py-1 rounded-lg transition-colors"
                    onClick={() => handleLeadClick(lead)}
                  >
                    <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {lead.client_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors">
                        {lead.client_name}
                      </div>
                      {lead.client_job_title && (
                        <div className="text-xs text-gray-500">{lead.client_job_title}</div>
                      )}
                    </div>
                  </div>
                </td>

                {/* Contact */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-gray-900">
                      <Phone className="h-3 w-3 mr-1 text-gray-400" />
                      <a href={`tel:${lead.client_phone}`} className="hover:text-blue-600">
                        {lead.client_phone}
                      </a>
                    </div>
                    {lead.client_email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-3 w-3 mr-1 text-gray-400" />
                        <a href={`mailto:${lead.client_email}`} className="hover:text-blue-600">
                          {lead.client_email}
                        </a>
                      </div>
                    )}
                  </div>
                </td>

                {/* Project */}
                <td className="px-6 py-4 whitespace-nowrap">
                  {lead.project ? (
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {extractName(lead.project.name)}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center mt-1">
                        <MapPin className="h-3 w-3 mr-1" />
                        {extractName(lead.project.region)}
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">No project</span>
                  )}
                </td>

                {/* Platform */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge className={getPlatformColor(lead.source)}>{lead.source}</Badge>
                </td>

                {/* Stage */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <Select
                    value={lead.stage}
                    onValueChange={(value) => onUpdateStage(lead.id, value as LeadStage)}
                  >
                    <SelectTrigger className={`w-[140px] ${getStageColor(lead.stage)}`}>
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
                </td>

                {/* Feedback - Very Important Section */}
                <td className="px-6 py-4">
                  <div className="min-w-[300px]">
                    {editingFeedbackId === lead.id ? (
                      <div className="space-y-2">
                        <div className="relative">
                          <Textarea
                            value={feedbackValue}
                            onChange={(e) => setFeedbackValue(e.target.value)}
                            placeholder="Enter your feedback here..."
                            className="w-full min-h-[120px] text-sm resize-none border-2 border-[#257CFF] focus:border-[#F45A2A] shadow-md"
                            autoFocus
                          />
                          <div className="absolute top-2 right-2 text-xs text-gray-400">
                            {feedbackValue.length} chars
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleFeedbackSave(lead.id)}
                            className="bg-[#257CFF] hover:bg-[#1a5acc] text-white"
                          >
                            <Save className="h-3 w-3 mr-1" />
                            Save Feedback
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleFeedbackCancel}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div
                          onClick={() => handleFeedbackEdit(lead.id, lead.feedback || '')}
                          className="group relative cursor-pointer"
                        >
                          <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-dashed border-gray-300 group-hover:border-[#257CFF] rounded-lg p-3 min-h-[80px] transition-all duration-200 group-hover:shadow-md">
                            <div className="flex items-start gap-2 mb-2">
                              <MessageSquare className="h-4 w-4 text-[#257CFF] mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                {lead.feedback ? (
                                  <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-3">
                                    {lead.feedback}
                                  </p>
                                ) : (
                                  <p className="text-sm text-gray-400 italic">
                                    Click to add feedback...
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 flex items-center justify-between">
                              <span>Click to {lead.feedback ? 'edit' : 'add'} feedback</span>
                              {lead.feedback_history && lead.feedback_history.length > 0 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedFeedbackId(
                                      expandedFeedbackId === lead.id ? null : lead.id
                                    );
                                  }}
                                  className="flex items-center text-[#257CFF] hover:text-[#F45A2A]"
                                >
                                  <span className="mr-1">History ({lead.feedback_history.length})</span>
                                  {expandedFeedbackId === lead.id ? (
                                    <ChevronUp className="h-3 w-3" />
                                  ) : (
                                    <ChevronDown className="h-3 w-3" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                        {expandedFeedbackId === lead.id && lead.feedback_history && (
                          <FeedbackHistory history={lead.feedback_history} />
                        )}
                      </div>
                    )}
                  </div>
                </td>

                {/* Date */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-3 w-3 mr-1" />
                    {format(new Date(lead.created_at), 'MMM d, yyyy')}
                  </div>
                </td>

                {/* Actions */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <LeadActions
                    phone={lead.client_phone}
                    name={lead.client_name}
                    compact
                  />
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Lead Detail Modal */}
      <LeadDetailModal
        lead={selectedLead}
        open={showDetailModal}
        onClose={handleCloseModal}
        onUpdateStage={onUpdateStage}
      />
    </div>
  );
};

