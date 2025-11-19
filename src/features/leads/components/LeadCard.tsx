import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Building, Calendar, ChevronDown, ChevronUp, Sparkles, Target, Flame, CalendarCheck, TrendingUp, PhoneOff, PhoneMissed, MessageCircle, XCircle, Ban, PowerOff, Wallet, Briefcase, DollarSign, User, Users } from 'lucide-react';
import { Lead, LeadStage } from '../../hooks/crm/useLeads';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { LeadActions } from './LeadActions';
import { format } from 'date-fns';
import { extractName } from '../../lib/formatters';

interface LeadCardProps {
  lead: Lead;
  index: number;
  onUpdateStage: (leadId: string, stage: LeadStage) => void;
  onEdit?: (lead: Lead) => void;
  showActions?: boolean;
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
    facebook: 'bg-blue-100 text-blue-800',
    instagram: 'bg-pink-100 text-pink-800',
    google: 'bg-red-100 text-red-800',
    tiktok: 'bg-gray-900 text-white',
    snapchat: 'bg-yellow-100 text-yellow-800',
    whatsapp: 'bg-green-100 text-green-800',
    Facebook: 'bg-blue-100 text-blue-800',
    Instagram: 'bg-pink-100 text-pink-800',
    Google: 'bg-red-100 text-red-800',
    TikTok: 'bg-gray-900 text-white',
    Snapchat: 'bg-yellow-100 text-yellow-800',
    WhatsApp: 'bg-green-100 text-green-800',
    Other: 'bg-gray-100 text-gray-800',
  };
  return colors[platform] || 'bg-gray-100 text-gray-800';
};

export const LeadCard: React.FC<LeadCardProps> = ({
  lead,
  index,
  onUpdateStage,
  onEdit,
  showActions = true,
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="p-4 hover:shadow-lg transition-shadow duration-200">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-lg">
                {lead.client_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-gray-900 truncate">
                {lead.client_name}
              </h3>
              {lead.client_job_title && (
                <p className="text-sm text-gray-500 truncate">{lead.client_job_title}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="ml-2 p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            {expanded ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>
        </div>

        {/* Contact Info */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center text-sm text-gray-600">
            <Phone className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
            <a href={`tel:${lead.client_phone}`} className="hover:text-blue-600 truncate">
              {lead.client_phone}
            </a>
          </div>
          {lead.client_phone2 && (
            <div className="flex items-center text-sm text-gray-600">
              <Phone className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
              <a href={`tel:${lead.client_phone2}`} className="hover:text-blue-600 truncate">
                {lead.client_phone2}
              </a>
            </div>
          )}
          {lead.client_phone3 && (
            <div className="flex items-center text-sm text-gray-600">
              <Phone className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
              <a href={`tel:${lead.client_phone3}`} className="hover:text-blue-600 truncate">
                {lead.client_phone3}
              </a>
            </div>
          )}
          {lead.client_email && (
            <div className="flex items-center text-sm text-gray-600">
              <Mail className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
              <a href={`mailto:${lead.client_email}`} className="hover:text-blue-600 truncate">
                {lead.client_email}
              </a>
            </div>
          )}
          {lead.company_name && (
            <div className="flex items-center text-sm text-gray-600">
              <Briefcase className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
              <span className="truncate">{lead.company_name}</span>
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge className={getPlatformColor(lead.source)}>{lead.source}</Badge>
          {lead.project && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Building className="h-3 w-3" />
              {extractName(lead.project.name)}
            </Badge>
          )}
        </div>

        {/* Stage Selector */}
        <div className="mb-3">
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

        {/* Expanded Details */}
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-3 pb-3 border-t pt-3"
          >
            {/* Project Details */}
            {lead.project && (
              <div className="flex items-start gap-2 text-sm">
                <Building className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-gray-900">
                    {extractName(lead.project.name)}
                  </div>
                  <div className="text-gray-500">
                    Developer: {extractName(lead.project.region)}
                  </div>
                </div>
              </div>
            )}

            {/* Budget */}
            {lead.budget && (
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="font-medium text-green-600">
                  Budget: {lead.budget.toLocaleString()} EGP
                </span>
              </div>
            )}

            {/* Owner */}
            {lead.owner && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span>Owner: {lead.owner.name}</span>
              </div>
            )}

            {/* Assigned To */}
            {lead.assigned_to && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span>Assigned to: {lead.assigned_to.name}</span>
              </div>
            )}

            {/* Dates */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4 text-gray-400" />
              Created {format(new Date(lead.created_at), 'MMM d, yyyy')}
            </div>
            
            {lead.assigned_at && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4 text-gray-400" />
                Assigned {format(new Date(lead.assigned_at), 'MMM d, yyyy')}
              </div>
            )}

            {/* Notes */}
            {lead.feedback && (
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                <div className="font-medium text-gray-700 mb-1">Notes:</div>
                {lead.feedback}
              </div>
            )}
          </motion.div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center gap-2">
              <LeadActions
                phone={lead.client_phone}
                name={lead.client_name}
                compact
              />
              {onEdit && (
                <button
                  onClick={() => onEdit(lead)}
                  className="ml-auto px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                >
                  Edit Details
                </button>
              )}
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
};

interface LeadCardListProps {
  leads: Lead[];
  onUpdateStage: (leadId: string, stage: LeadStage) => void;
  onEdit?: (lead: Lead) => void;
  showActions?: boolean;
}

export const LeadCardList: React.FC<LeadCardListProps> = ({
  leads,
  onUpdateStage,
  onEdit,
  showActions,
}) => {
  if (leads.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Building className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No leads found</h3>
        <p className="text-gray-600 text-sm">Get started by adding your first lead or adjust your filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {leads.map((lead, index) => (
        <LeadCard
          key={lead.id}
          lead={lead}
          index={index}
          onUpdateStage={onUpdateStage}
          onEdit={onEdit}
          showActions={showActions}
        />
      ))}
    </div>
  );
};

