import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select';
import { SupportCaseStatus } from '../../types';
import { formatRelativeTime } from '../../lib/format';
import { 
  getAllTopics,
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
  Search,
  Filter,
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare,
  Headphones,
  XCircle: XCircleIcon,
  User,
  UserCheck,
  TrendingUp,
  Activity,
  UserCircle,
  CreditCard,
  Users,
  ShoppingCart,
  LayoutDashboard,
  Settings,
  HelpCircle,
  AlertTriangle,
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

interface SupportAgentViewProps {
  cases: any[];
  loading: boolean;
  onUpdateCase: (id: string, updates: { status?: SupportCaseStatus; assignedTo?: string }) => Promise<void>;
  currentUserId: string;
}

export const SupportAgentView: React.FC<SupportAgentViewProps> = ({ 
  cases, 
  loading, 
  onUpdateCase,
  currentUserId 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SupportCaseStatus | ''>('');
  const [topicFilter, setTopicFilter] = useState<string>('');
  const [assigneeFilter, setAssigneeFilter] = useState<'all' | 'assigned_to_me' | 'unassigned'>('all');
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  
  const { replies, fetchReplies, createReply, loadingReplies } = useSupportStore();
  const { user } = useAuthStore();

  // Get all available topics for filtering
  const allTopics = getAllTopics();
  
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

  const filteredCases = cases.filter(caseItem => {
    const matchesSearch = caseItem.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caseItem.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caseItem.creator?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caseItem.topic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caseItem.issue?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || caseItem.status === statusFilter;
    const matchesTopic = !topicFilter || caseItem.topic === topicFilter;
    
    let matchesAssignee = true;
    if (assigneeFilter === 'assigned_to_me') {
      matchesAssignee = caseItem.assignedTo === currentUserId;
    } else if (assigneeFilter === 'unassigned') {
      matchesAssignee = !caseItem.assignedTo;
    }
    
    return matchesSearch && matchesStatus && matchesTopic && matchesAssignee;
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
  const myAssignedCases = cases.filter(c => c.assignedTo === currentUserId && c.status !== 'resolved' && c.status !== 'closed').length;
  const unassignedCases = cases.filter(c => !c.assignedTo && c.status !== 'resolved' && c.status !== 'closed').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading support panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Headphones className="h-8 w-8 text-purple-600" />
          Support Management Panel
        </h1>
        <p className="text-muted-foreground mt-1">
          View and manage all support tickets across the platform
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card-modern p-4">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold text-foreground">{openCases}</p>
          <p className="text-sm text-muted-foreground">Open</p>
        </div>
        
        <div className="card-modern p-4">
          <div className="flex items-center justify-between mb-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold text-foreground">{inProgressCases}</p>
          <p className="text-sm text-muted-foreground">In Progress</p>
        </div>
        
        <div className="card-modern p-4">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold text-foreground">{resolvedCases}</p>
          <p className="text-sm text-muted-foreground">Resolved</p>
        </div>
        
        <div className="card-modern p-4 bg-purple-50">
          <div className="flex items-center justify-between mb-2">
            <UserCheck className="h-5 w-5 text-purple-600" />
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold text-foreground">{myAssignedCases}</p>
          <p className="text-sm text-muted-foreground">My Active</p>
        </div>
        
        <div className="card-modern p-4 bg-orange-50">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold text-foreground">{unassignedCases}</p>
          <p className="text-sm text-muted-foreground">Unassigned</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets by subject, description, or user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          {/* Status Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 flex-1">
            <Button
              variant={!statusFilter ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('')}
              className="whitespace-nowrap"
            >
              All Status
            </Button>
            <Button
              variant={statusFilter === 'open' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('open')}
              className="whitespace-nowrap"
            >
              Open
            </Button>
            <Button
              variant={statusFilter === 'in_progress' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('in_progress')}
              className="whitespace-nowrap"
            >
              In Progress
            </Button>
            <Button
              variant={statusFilter === 'resolved' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('resolved')}
              className="whitespace-nowrap"
            >
              Resolved
            </Button>
            <Button
              variant={statusFilter === 'closed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('closed')}
              className="whitespace-nowrap"
            >
              Closed
            </Button>
          </div>

          {/* Assignment Filter */}
          <div className="flex gap-2">
            <Button
              variant={assigneeFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAssigneeFilter('all')}
            >
              All
            </Button>
            <Button
              variant={assigneeFilter === 'assigned_to_me' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAssigneeFilter('assigned_to_me')}
            >
              My Tickets
            </Button>
            <Button
              variant={assigneeFilter === 'unassigned' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAssigneeFilter('unassigned')}
            >
              Unassigned
            </Button>
          </div>
        </div>

        {/* Topic Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <span className="text-sm text-muted-foreground flex items-center gap-2 whitespace-nowrap">
            <Filter className="h-4 w-4" />
            Topic:
          </span>
          <Button
            variant={!topicFilter ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTopicFilter('')}
          >
            All Topics
          </Button>
          {allTopics.map((topic) => {
            const iconName = getTopicIcon(topic);
            const IconComponent = topicIconComponents[iconName] || HelpCircle;
            return (
              <Button
                key={topic}
                variant={topicFilter === topic ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTopicFilter(topic)}
                className="whitespace-nowrap flex items-center gap-2"
              >
                <IconComponent className="h-4 w-4" />
                {topic}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">
            All Support Tickets ({filteredCases.length})
          </h2>
        </div>

        {filteredCases.length === 0 ? (
          <div className="text-center py-12 card-modern">
            <Headphones className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No tickets found</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter || topicFilter || assigneeFilter !== 'all'
                ? 'Try adjusting your filters.'
                : 'All tickets have been resolved!'
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredCases.map((caseItem) => (
              <div key={caseItem.id} className="card-modern card-hover p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
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
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <IssueIconComponent className="h-3.5 w-3.5" />
                          <span>{caseItem.issue}</span>
                        </div>
                      );
                    })()}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{caseItem.creator?.name || 'Unknown'} ({caseItem.creator?.role || 'user'})</span>
                      </div>
                      <span>•</span>
                      <span>{formatRelativeTime(caseItem.createdAt)}</span>
                    </div>
                  </div>
                  
                  <Badge className={`${getStatusColor(caseItem.status)} border px-3 py-1.5 text-sm font-medium flex items-center gap-2 whitespace-nowrap`}>
                    {getStatusIcon(caseItem.status)}
                    {caseItem.status.replace('_', ' ')}
                  </Badge>
                </div>

                <p className="text-muted-foreground mb-4 line-clamp-2">{caseItem.description}</p>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-gray-100">
                  {caseItem.assignee ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <UserCheck className="h-4 w-4" />
                      <span>Assigned to {caseItem.assignee.name}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-orange-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>Unassigned</span>
                    </div>
                  )}
                  
                  <div className="flex gap-2 flex-wrap">
                    <Select
                      value={caseItem.status}
                      onValueChange={(value: SupportCaseStatus) => onUpdateCase(caseItem.id, { status: value })}
                    >
                      <SelectTrigger className="h-9 w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>

                    {!caseItem.assignedTo && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onUpdateCase(caseItem.id, { assignedTo: currentUserId, status: 'in_progress' })}
                      >
                        Assign to Me
                      </Button>
                    )}
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleOpenCase(caseItem)}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      View & Reply
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Case Detail View */}
      {selectedCase && (
        <CaseDetailView
          caseItem={selectedCase}
          replies={replies[selectedCase.id] || []}
          onClose={() => setSelectedCase(null)}
          onSendReply={handleSendReply}
          canAddInternalNotes={true}
          currentUserRole={user?.role || 'support'}
        />
      )}
    </div>
  );
};

