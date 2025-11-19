import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { SupportCaseStatus } from '../../types';
import { formatRelativeTime } from '../../lib/format';
import { 
  getAllTopics,
  getIssuesForTopic,
  getTopicIcon,
  getTopicColor,
  getIssueIcon
} from '../../types/support-categories';
import CaseDetailView from './CaseDetailView';
import { useSupportStore } from '../../store/support';
import { useAuthStore } from '../../store/auth';
import * as LucideIcons from 'lucide-react';

// Extract specific icons we need
const {
  Plus,
  Search,
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare,
  Ticket,
  XCircle: XCircleIcon,
  AlertTriangle,
  UserCircle,
  CreditCard,
  Users,
  ShoppingCart,
  LayoutDashboard,
  Settings,
  HelpCircle,
  Mail,
  UserX,
  ShoppingBag,
  FileText,
  PackageX,
  Inbox,
  Copy,
  FileQuestion,
  EyeOff,
  Download,
  PhoneOff,
  Target,
  MousePointerClick,
  Calculator,
  MousePointer,
  ArrowRight,
  MailQuestion,
  TableProperties,
  SearchX,
  Edit,
  Hash,
  Lock,
  UserPlus,
  RefreshCw,
  MonitorX,
  Ban,
  Hourglass,
  Bug,
  Tabs,
  Lightbulb,
  Info,
  MessageCircle,
  Circle,
} = LucideIcons;

// Icon mapping for topics
const topicIconComponents: { [key: string]: React.ElementType } = {
  UserCircle,
  CreditCard,
  Users,
  ShoppingCart,
  LayoutDashboard,
  Settings,
  MessageSquare,
  HelpCircle,
};

// Icon mapping for issues
const issueIconComponents: { [key: string]: React.ElementType } = {
  Mail,
  UserX,
  XCircle: XCircleIcon,
  AlertTriangle,
  ShoppingBag,
  FileText,
  PackageX,
  Inbox,
  Copy,
  FileQuestion,
  EyeOff,
  Download,
  PhoneOff,
  Target,
  MousePointerClick,
  Calculator,
  MousePointer,
  ArrowRight,
  MailQuestion,
  TableProperties,
  SearchX,
  Edit,
  Hash,
  Lock,
  UserPlus,
  RefreshCw,
  MonitorX,
  Ban,
  Hourglass,
  Bug,
  Tabs,
  Lightbulb,
  Info,
  MessageCircle,
  Circle,
};

interface UserSupportViewProps {
  cases: any[];
  loading: boolean;
  onCreateCase: (subject: string, description: string, topic: string, issue: string) => Promise<void>;
}

export const UserSupportView: React.FC<UserSupportViewProps> = ({ cases, loading, onCreateCase }) => {
  const [showCreateCase, setShowCreateCase] = useState(false);
  const [newCase, setNewCase] = useState({
    subject: '',
    description: '',
    topic: '',
    issue: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SupportCaseStatus | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  
  const { replies, fetchReplies, createReply, loadingReplies } = useSupportStore();
  const { user } = useAuthStore();

  // Get available topics
  const topics = getAllTopics();
  
  // Get issues for selected topic
  const availableIssues = newCase.topic ? getIssuesForTopic(newCase.topic) : [];
  
  // Handle opening a case
  const handleOpenCase = async (caseItem: any) => {
    setSelectedCase(caseItem);
    await fetchReplies(caseItem.id);
  };
  
  // Handle sending a reply
  const handleSendReply = async (message: string, isInternalNote: boolean) => {
    if (!selectedCase || !user?.id) return;
    await createReply(selectedCase.id, user.id, message, isInternalNote);
  };

  const handleCreateCase = async () => {
    if (!newCase.description.trim() || !newCase.topic || !newCase.issue) return;
    
    setSubmitting(true);
    try {
      // Auto-generate subject from topic and issue (no emoji, just text)
      const autoSubject = newCase.issue;
      await onCreateCase(autoSubject, newCase.description, newCase.topic, newCase.issue);
      setNewCase({ subject: '', description: '', topic: '', issue: '' });
      setShowCreateCase(false);
    } catch (error) {
      console.error('Error creating case:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCases = cases.filter(caseItem => {
    const matchesSearch = caseItem.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caseItem.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || caseItem.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: SupportCaseStatus) => {
    switch (status) {
      case 'open': return <AlertCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      case 'closed': return <XCircleIcon className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: SupportCaseStatus): string => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800 border-red-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };


  // Calculate metrics
  const openCases = cases.filter(c => c.status === 'open').length;
  const inProgressCases = cases.filter(c => c.status === 'in_progress').length;
  const resolvedCases = cases.filter(c => c.status === 'resolved').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading your support tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 md:px-6 md:py-8 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 bg-clip-text text-transparent mb-2">
            My Support Tickets
          </h1>
          <p className="text-gray-600 text-base md:text-lg">
            Track and manage your support cases
          </p>
        </div>
        <Button onClick={() => setShowCreateCase(true)} className="sm:w-auto w-full">
          <Plus className="h-4 w-4 mr-2" />
          New Ticket
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-modern p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Open</p>
              <p className="text-2xl font-bold text-foreground">{openCases}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
        
        <div className="card-modern p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">In Progress</p>
              <p className="text-2xl font-bold text-foreground">{inProgressCases}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
        
        <div className="card-modern p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Resolved</p>
              <p className="text-2xl font-bold text-foreground">{resolvedCases}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={!statusFilter ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('')}
          >
            All
          </Button>
          <Button
            variant={statusFilter === 'open' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('open')}
          >
            Open
          </Button>
          <Button
            variant={statusFilter === 'in_progress' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('in_progress')}
          >
            In Progress
          </Button>
          <Button
            variant={statusFilter === 'resolved' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('resolved')}
          >
            Resolved
          </Button>
          <Button
            variant={statusFilter === 'closed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('closed')}
          >
            Closed
          </Button>
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        {filteredCases.length === 0 ? (
          <div className="text-center py-12 card-modern">
            <Ticket className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No tickets found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter 
                ? 'Try adjusting your search or filters.'
                : 'Create your first support ticket to get help.'
              }
            </p>
            {!searchTerm && !statusFilter && (
              <Button onClick={() => setShowCreateCase(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Ticket
              </Button>
            )}
          </div>
        ) : (
          filteredCases.map((caseItem) => (
            <div key={caseItem.id} className="card-modern card-hover p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="text-lg font-semibold text-foreground">{caseItem.subject}</h3>
                    {caseItem.topic && (() => {
                      const iconName = getTopicIcon(caseItem.topic);
                      const IconComponent = topicIconComponents[iconName] || HelpCircle;
                      return (
                        <Badge className={`${getTopicColor(caseItem.topic)} px-2 py-0.5 text-xs flex items-center gap-1`}>
                          <IconComponent className="h-3 w-3" />
                          {caseItem.topic}
                        </Badge>
                      );
                    })()}
                  </div>
                  {caseItem.issue && (() => {
                    const issueIconName = getIssueIcon(caseItem.issue);
                    const IssueIconComponent = issueIconComponents[issueIconName] || Circle;
                    return (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <IssueIconComponent className="h-3.5 w-3.5" />
                        <span>{caseItem.issue}</span>
                      </div>
                    );
                  })()}
                  <p className="text-sm text-muted-foreground">
                    Created {formatRelativeTime(caseItem.createdAt)}
                  </p>
                </div>
                
                <Badge className={`${getStatusColor(caseItem.status)} border px-3 py-1.5 text-sm font-medium flex items-center gap-2`}>
                  {getStatusIcon(caseItem.status)}
                  {caseItem.status.replace('_', ' ')}
                </Badge>
              </div>

              <p className="text-muted-foreground mb-4 line-clamp-2">{caseItem.description}</p>

              {caseItem.assignee && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <MessageSquare className="h-4 w-4" />
                  <span>Assigned to {caseItem.assignee.name}</span>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleOpenCase(caseItem)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  View Details & Replies
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Case Dialog */}
      <Dialog open={showCreateCase} onOpenChange={setShowCreateCase}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Support Ticket</DialogTitle>
            <DialogDescription>
              Submit a new support request and we'll get back to you as soon as possible.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Topic <span className="text-red-500">*</span>
              </label>
              <Select
                value={newCase.topic}
                onValueChange={(value: string) => setNewCase(prev => ({ ...prev, topic: value, issue: '' }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a topic..." />
                </SelectTrigger>
                <SelectContent>
                  {topics.map((topic) => {
                    const iconName = getTopicIcon(topic);
                    const IconComponent = topicIconComponents[iconName] || HelpCircle;
                    return (
                      <SelectItem key={topic} value={topic}>
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          {topic}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Issue <span className="text-red-500">*</span>
              </label>
              <Select
                value={newCase.issue}
                onValueChange={(value: string) => setNewCase(prev => ({ ...prev, issue: value }))}
                disabled={!newCase.topic}
              >
                <SelectTrigger disabled={!newCase.topic}>
                  <SelectValue placeholder={newCase.topic ? 'Select an issue...' : 'Please select a topic first'} />
                </SelectTrigger>
                <SelectContent>
                  {availableIssues.map((issue) => {
                    const issueIconName = getIssueIcon(issue);
                    const IssueIconComponent = issueIconComponents[issueIconName] || Circle;
                    return (
                      <SelectItem key={issue} value={issue}>
                        <div className="flex items-center gap-2">
                          <IssueIconComponent className="h-4 w-4" />
                          <span className="flex-1">{issue}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {!newCase.topic && (
                <p className="text-xs text-muted-foreground mt-1">
                  Select a topic first to see available issues
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Description <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Provide detailed information about your issue"
                value={newCase.description}
                onChange={(e) => setNewCase(prev => ({ ...prev, description: e.target.value }))}
                rows={5}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCreateCase(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateCase} 
                disabled={!newCase.description.trim() || !newCase.topic || !newCase.issue || submitting}
              >
                {submitting ? 'Creating...' : 'Create Ticket'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Case Detail View */}
      {selectedCase && (
        <CaseDetailView
          caseItem={selectedCase}
          replies={replies[selectedCase.id] || []}
          onClose={() => setSelectedCase(null)}
          onSendReply={handleSendReply}
          canAddInternalNotes={false}
          currentUserRole={user?.role || 'user'}
        />
      )}
    </div>
  );
};

