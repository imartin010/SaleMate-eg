import React, { useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Lead, LeadStage, Project } from '../../types';
import { formatPhone, formatDateTime, createTelUrl, createWhatsAppUrl } from '../../lib/format';
import { useLeadStore } from '../../store/leads';
import { 
  Phone, 
  MessageCircle, 
  Edit3,
  Save,
  X,
  User,
  Calendar,
  Building,
  Globe,
  Clock,
  Star,
  TrendingUp,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface LeadTableProps {
  leads: Lead[];
}

const LEAD_STAGES: LeadStage[] = [
  'New Lead',
  'Potential', 
  'Hot Case',
  'Meeting Done',
  'No Answer',
  'Call Back',
  'Whatsapp',
  'Wrong Number',
  'Non Potential'
];

const getStageColor = (stage: LeadStage): string => {
  switch (stage) {
    case 'New Lead':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Potential':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Hot Case':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'Meeting Done':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'No Answer':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'Call Back':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'Whatsapp':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'Wrong Number':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'Non Potential':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStageIcon = (stage: LeadStage) => {
  switch (stage) {
    case 'New Lead':
      return <User className="h-3 w-3" />;
    case 'Potential':
      return <Star className="h-3 w-3" />;
    case 'Hot Case':
      return <TrendingUp className="h-3 w-3" />;
    case 'Meeting Done':
      return <CheckCircle className="h-3 w-3" />;
    case 'No Answer':
      return <AlertCircle className="h-3 w-3" />;
    default:
      return <User className="h-3 w-3" />;
  }
};

export const LeadTable: React.FC<LeadTableProps> = ({ leads }) => {
  const [editingLead, setEditingLead] = useState<string | null>(null);
  const [editingStage, setEditingStage] = useState<LeadStage>('New Lead');
  const [editingFeedback, setEditingFeedback] = useState('');
  const { updateLead } = useLeadStore();

  // TODO: Fetch projects from Supabase or pass as prop
  const projects: Project[] = [];

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead.id);
    setEditingStage(lead.stage);
    setEditingFeedback(lead.feedback || '');
  };

  const handleSave = async (leadId: string) => {
    await updateLead(leadId, {
      stage: editingStage,
      feedback: editingFeedback.trim() || undefined,
    });
    setEditingLead(null);
  };

  const handleCancel = () => {
    setEditingLead(null);
    setEditingStage('New Lead');
    setEditingFeedback('');
  };

  return (
    <div className="overflow-hidden">
      {/* Table Header */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Lead Pipeline</h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Total: {leads.length}</span>
            <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
            <span>Showing all leads</span>
          </div>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-white border-b border-gray-200">
              <th className="text-left px-6 py-4 font-semibold text-gray-900 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  Client
                </div>
              </th>
              <th className="text-left px-6 py-4 font-semibold text-gray-900 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  Contact
                </div>
              </th>
              <th className="text-left px-6 py-4 font-semibold text-gray-900 text-sm">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-gray-500" />
                  Source
                </div>
              </th>
              <th className="text-left px-6 py-4 font-semibold text-gray-900 text-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-gray-500" />
                  Stage
                </div>
              </th>
              <th className="text-left px-6 py-4 font-semibold text-gray-900 text-sm">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-gray-500" />
                  Project
                </div>
              </th>
              <th className="text-left px-6 py-4 font-semibold text-gray-900 text-sm">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-gray-500" />
                  Notes
                </div>
              </th>
              <th className="text-left px-6 py-4 font-semibold text-gray-900 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  Created
                </div>
              </th>
              <th className="text-left px-6 py-4 font-semibold text-gray-900 text-sm">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {leads.map((lead) => {
              const project = projects.find(p => p.id === lead.projectId);
              const isEditing = editingLead === lead.id;

              return (
                <tr key={lead.id} className="bg-white hover:bg-gray-50 transition-colors duration-150">
                  {/* Client Column */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {lead.clientName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{lead.clientName}</div>
                        <div className="text-sm text-gray-500">Lead ID: {lead.id.slice(-6)}</div>
                      </div>
                    </div>
                  </td>

                  {/* Contact Column */}
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      {lead.clientJobTitle && (
                        <div className="text-xs text-gray-500 font-medium">{lead.clientJobTitle}</div>
                      )}
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3 text-gray-400" />
                        <span className="font-mono text-sm text-gray-900">{formatPhone(lead.clientPhone)}</span>
                      </div>
                      {lead.clientPhone2 && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span className="font-mono text-sm text-gray-600">{formatPhone(lead.clientPhone2)}</span>
                          <span className="text-xs bg-gray-100 px-1 rounded">2nd</span>
                        </div>
                      )}
                      {lead.clientPhone3 && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span className="font-mono text-sm text-gray-600">{formatPhone(lead.clientPhone3)}</span>
                          <span className="text-xs bg-gray-100 px-1 rounded">3rd</span>
                        </div>
                      )}
                      {lead.clientEmail && (
                        <div className="flex items-center gap-2">
                          <MessageCircle className="h-3 w-3 text-gray-400" />
                          <span className="text-sm text-gray-600 truncate max-w-32">{lead.clientEmail}</span>
                        </div>
                      )}
                      <div className="flex gap-1 pt-1">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.open(createTelUrl(lead.clientPhone), '_self')}
                          className="h-7 px-2 text-xs"
                        >
                          <Phone className="h-3 w-3 mr-1" />
                          Call
                        </Button>
                        {(lead.clientPhone2 || lead.clientPhone3) && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              const phoneToCall = lead.clientPhone2 || lead.clientPhone3;
                              if (phoneToCall) window.open(createTelUrl(phoneToCall), '_self');
                            }}
                            className="h-7 px-2 text-xs"
                          >
                            <Phone className="h-3 w-3 mr-1" />
                            Alt
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.open(createWhatsAppUrl(lead.clientPhone, 'Hello! I\'m reaching out regarding your interest in real estate properties.'), '_blank')}
                          className="h-7 px-2 text-xs"
                        >
                          <MessageCircle className="h-3 w-3 mr-1" />
                          WhatsApp
                        </Button>
                      </div>
                    </div>
                  </td>

                  {/* Source Column */}
                  <td className="px-6 py-4">
                    <Badge variant="outline" className="border-gray-300 text-gray-700">
                      {lead.platform}
                    </Badge>
                  </td>

                  {/* Stage Column */}
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <select
                        value={editingStage}
                        onChange={(e) => setEditingStage(e.target.value as LeadStage)}
                        className="w-40"
                      >
                        {LEAD_STAGES.map(stage => (
                          <option key={stage} value={stage}>{stage}</option>
                        ))}
                      </select>
                    ) : (
                      <Badge className={`${getStageColor(lead.stage)} border px-3 py-1.5 text-sm font-medium flex items-center gap-2 w-fit`}>
                        {getStageIcon(lead.stage)}
                        {lead.stage}
                      </Badge>
                    )}
                  </td>

                  {/* Project Column */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{project?.name || 'Unknown'}</span>
                    </div>
                  </td>

                  {/* Notes Column */}
                  <td className="px-6 py-4 max-w-xs">
                    {isEditing ? (
                      <Textarea
                        value={editingFeedback}
                        onChange={(e) => setEditingFeedback(e.target.value)}
                        placeholder="Add feedback, notes, or next steps..."
                        rows={3}
                        className="text-sm resize-none border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="text-sm text-gray-600">
                        {lead.feedback ? (
                          <div className="bg-gray-50 p-2 rounded border-l-2 border-l-blue-500">
                            {lead.feedback}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">No notes yet</span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Created Column */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-3 w-3" />
                      <span>{formatDateTime(lead.createdAt)}</span>
                    </div>
                  </td>

                  {/* Actions Column */}
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleSave(lead.id)}
                          className="h-8 px-3 bg-green-600 hover:bg-green-700"
                        >
                          <Save className="h-3 w-3 mr-1" />
                          Save
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={handleCancel}
                          className="h-8 px-3"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleEdit(lead)}
                        className="h-8 px-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      >
                        <Edit3 className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Empty State */}
      {leads.length === 0 && (
        <div className="text-center py-12 px-6">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No leads in your pipeline</h3>
          <p className="text-gray-600 mb-4 max-w-md mx-auto">
            Start building your lead pipeline by purchasing leads from the Shop or importing your existing contacts.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline">
              <Building className="h-4 w-4 mr-2" />
              Browse Projects
            </Button>
            <Button>
              <User className="h-4 w-4 mr-2" />
              Add First Lead
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
