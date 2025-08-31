import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Lead, LeadStage, Project } from '../../types';
import { formatPhone, formatRelativeTime, createTelUrl, createWhatsAppUrl } from '../../lib/format';
import { useLeadStore } from '../../store/leads';
import { useTeamStore } from '../../store/team';
import { useAuthStore } from '../../store/auth';
import { 
  Phone, 
  MessageCircle, 
  Mail, 
  MapPin, 
  Clock, 
  Edit3,
  Save,
  X,
  MoreHorizontal,
  Calendar,
  Building,
  Globe,
  User,
  Star,
  TrendingUp,
  UserCheck,
  UserX
} from 'lucide-react';

interface LeadCardProps {
  lead: Lead;
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
      return <Calendar className="h-3 w-3" />;
    default:
      return <User className="h-3 w-3" />;
  }
};

export const LeadCard: React.FC<LeadCardProps> = ({ lead }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingStage, setEditingStage] = useState(lead.stage);
  const [editingFeedback, setEditingFeedback] = useState(lead.feedback || '');
  const { updateLead, assignLeadToUser, unassignLead } = useLeadStore();
  const { members } = useTeamStore();
  const { user, profile } = useAuthStore();

  // Use the project data from the lead object
  const project = (lead as any).project;

  const handleSave = async () => {
    await updateLead(lead.id, {
      stage: editingStage,
      feedback: editingFeedback.trim() || undefined,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditingStage(lead.stage);
    setEditingFeedback(lead.feedback || '');
    setIsEditing(false);
  };

  const handleAssignLead = async (assigneeId: string) => {
    if (assigneeId === 'unassign') {
      await unassignLead(lead.id);
    } else {
      await assignLeadToUser(lead.id, assigneeId);
    }
  };

  const canAssignLead = () => {
    if (!user || !profile) return false;
    if (profile.role === 'admin' || profile.role === 'support') return true;
    if (profile.role === 'manager') {
      // Manager can assign leads they own or leads owned by their team
      return lead.buyerUserId === user.id || members.some(m => m.id === lead.buyerUserId);
    }
    return false;
  };

  const getAssigneeName = (assigneeId: string) => {
    if (assigneeId === user?.id) return 'Me';
    const member = members.find(m => m.id === assigneeId);
    return member?.name || 'Unknown';
  };

  return (
    <div className="group">
      <div className="card-modern card-hover h-full">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                  {lead.clientName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg text-foreground truncate">
                    {lead.clientName}
                  </h3>
                  {lead.clientJobTitle && (
                    <div className="text-sm text-muted-foreground mb-1">
                      {lead.clientJobTitle}
                    </div>
                  )}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <span className="truncate">{formatPhone(lead.clientPhone)}</span>
                    </div>
                    {lead.clientPhone2 && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span className="truncate">{formatPhone(lead.clientPhone2)}</span>
                        <span className="text-xs bg-gray-100 px-1 rounded">2nd</span>
                      </div>
                    )}
                    {lead.clientPhone3 && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span className="truncate">{formatPhone(lead.clientPhone3)}</span>
                        <span className="text-xs bg-gray-100 px-1 rounded">3rd</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {lead.clientEmail && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{lead.clientEmail}</span>
                </div>
              )}
            </div>
            
            {/* Action Menu */}
            <div className="flex items-center gap-2 ml-2">
              {isEditing ? (
                <div className="flex gap-1">
                  <Button size="sm" onClick={handleSave} className="h-8 w-8 p-0">
                    <Save className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancel} className="h-8 w-8 p-0">
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => setIsEditing(true)}
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Project and Platform Info */}
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div className="flex items-center gap-2">
              <Building className="h-3 w-3 text-muted-foreground" />
              <div className="min-w-0">
                <span className="text-muted-foreground block text-xs">Project</span>
                <span className="font-medium truncate">{project?.name || 'Unknown'}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-3 w-3 text-muted-foreground" />
              <div className="min-w-0">
                <span className="text-muted-foreground block text-xs">Platform</span>
                <span className="font-medium truncate">{lead.platform}</span>
              </div>
            </div>
          </div>

          {/* Stage Badge */}
          <div className="mb-4">
            <span className="text-xs text-muted-foreground block mb-2">Current Stage</span>
            {isEditing ? (
              <Select
                value={editingStage}
                onValueChange={(value) => setEditingStage(value as LeadStage)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_STAGES.map(stage => (
                    <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Badge className={`${getStageColor(lead.stage)} border px-3 py-1.5 text-sm font-medium flex items-center gap-2 w-fit`}>
                {getStageIcon(lead.stage)}
                {lead.stage}
              </Badge>
            )}
          </div>

          {/* Assignment Section */}
          {canAssignLead() && (
            <div className="mb-4">
              <span className="text-xs text-muted-foreground block mb-2">Assigned To</span>
              <Select
                value={lead.assignedToId || 'unassigned'}
                onValueChange={handleAssignLead}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">
                    <div className="flex items-center gap-2">
                      <UserX className="h-4 w-4" />
                      Unassigned
                    </div>
                  </SelectItem>
                  <SelectItem value={user?.id}>
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4" />
                      Me
                    </div>
                  </SelectItem>
                  {members.map(member => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {member.name || member.email}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Show current assignment if not editing */}
          {!canAssignLead() && lead.assignedToId && (
            <div className="mb-4">
              <span className="text-xs text-muted-foreground block mb-2">Assigned To</span>
              <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1.5 text-sm font-medium flex items-center gap-2 w-fit">
                <UserCheck className="h-3 w-3" />
                {getAssigneeName(lead.assignedToId)}
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-6 pb-4">
          {/* Feedback Section */}
          {(lead.feedback || isEditing) && (
            <div className="mb-4">
              <span className="text-xs text-muted-foreground block mb-2">Notes & Feedback</span>
              {isEditing ? (
                <Textarea
                  value={editingFeedback}
                  onChange={(e) => setEditingFeedback(e.target.value)}
                  placeholder="Add your feedback, notes, or next steps..."
                  rows={3}
                  className="w-full resize-none"
                />
              ) : (
                <div className="bg-muted/50 p-3 rounded-lg border-l-4 border-l-primary">
                  <p className="text-sm text-foreground leading-relaxed">{lead.feedback}</p>
                </div>
              )}
            </div>
          )}

          {/* Timestamp */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            <Clock className="h-3 w-3" />
            <span>Added {formatRelativeTime(lead.createdAt)}</span>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Primary Phone Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-10"
                onClick={() => window.open(createTelUrl(lead.clientPhone), '_self')}
              >
                <Phone className="h-4 w-4 mr-2" />
                Call Primary
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-10"
                onClick={() => window.open(createWhatsAppUrl(lead.clientPhone, 'Hello! I\'m reaching out regarding your interest in real estate properties.'), '_blank')}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
            </div>
            
            {/* Secondary Phone Actions */}
            {(lead.clientPhone2 || lead.clientPhone3) && (
              <div className="grid grid-cols-2 gap-3">
                {lead.clientPhone2 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 text-xs"
                    onClick={() => window.open(createTelUrl(lead.clientPhone2), '_self')}
                  >
                    <Phone className="h-3 w-3 mr-1" />
                    Call 2nd
                  </Button>
                )}
                {lead.clientPhone3 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 text-xs"
                    onClick={() => window.open(createTelUrl(lead.clientPhone3), '_self')}
                  >
                    <Phone className="h-3 w-3 mr-1" />
                    Call 3rd
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
