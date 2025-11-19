import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { 
  X, 
  Send, 
  User, 
  Clock,
  MessageCircle,
  Shield,
  AlertCircle,
  CheckCircle,
  Eye
} from 'lucide-react';
import { SupportCaseReply, SupportCaseStatus } from '../../types';
import { formatRelativeTime } from '../../lib/format';
import { getTopicColor, getTopicIcon, getIssueIcon } from '../../types/support-categories';
import * as LucideIcons from 'lucide-react';

// Import all necessary icons
const {
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
  Circle,
  MessageSquare,
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
  XCircle: X,
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

interface CaseDetailViewProps {
  caseItem: any;
  replies: SupportCaseReply[];
  onClose: () => void;
  onSendReply: (message: string, isInternalNote: boolean) => Promise<void>;
  canAddInternalNotes?: boolean;
  currentUserRole?: string;
}

const getStatusIcon = (status: SupportCaseStatus) => {
  switch (status) {
    case 'open': return <AlertCircle className="h-4 w-4" />;
    case 'in_progress': return <Clock className="h-4 w-4" />;
    case 'resolved': return <CheckCircle className="h-4 w-4" />;
    case 'closed': return <CheckCircle className="h-4 w-4" />;
  }
};

const getStatusColor = (status: SupportCaseStatus) => {
  switch (status) {
    case 'open': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
    case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export default function CaseDetailView({ 
  caseItem, 
  replies, 
  onClose, 
  onSendReply,
  canAddInternalNotes = false,
  currentUserRole = 'user'
}: CaseDetailViewProps) {
  const [replyMessage, setReplyMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSendReply = async () => {
    if (!replyMessage.trim()) return;
    
    setSending(true);
    try {
      await onSendReply(replyMessage, isInternalNote);
      setReplyMessage('');
      setIsInternalNote(false);
    } catch (error) {
      console.error('Failed to send reply:', error);
    } finally {
      setSending(false);
    }
  };

  // Get icons
  const topicIconName = caseItem.topic ? getTopicIcon(caseItem.topic) : '';
  const TopicIconComponent = topicIconName ? topicIconComponents[topicIconName] || HelpCircle : HelpCircle;
  
  const issueIconName = caseItem.issue ? getIssueIcon(caseItem.issue) : '';
  const IssueIconComponent = issueIconName ? issueIconComponents[issueIconName] || Circle : Circle;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h2 className="text-2xl font-bold text-foreground">{caseItem.subject}</h2>
              <Badge className={`${getStatusColor(caseItem.status)} px-2 py-1 text-xs flex items-center gap-1`}>
                {getStatusIcon(caseItem.status)}
                {caseItem.status.replace('_', ' ')}
              </Badge>
            </div>
            
            {caseItem.topic && (
              <Badge className={`${getTopicColor(caseItem.topic)} px-2 py-0.5 text-xs flex items-center gap-1 mr-2`}>
                <TopicIconComponent className="h-3 w-3" />
                {caseItem.topic}
              </Badge>
            )}
            
            {caseItem.issue && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                <IssueIconComponent className="h-3.5 w-3.5" />
                <span>{caseItem.issue}</span>
              </div>
            )}
            
            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{caseItem.creator?.name || 'Unknown'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Created {formatRelativeTime(caseItem.createdAt)}</span>
              </div>
            </div>
          </div>
          
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Case Description */}
        <div className="p-6 border-b bg-muted/30">
          <h3 className="text-sm font-semibold text-muted-foreground mb-2">Description</h3>
          <p className="text-foreground whitespace-pre-wrap">{caseItem.description}</p>
        </div>
        
        {/* Replies */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Replies ({replies.length})
          </h3>
          
          {replies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No replies yet</p>
            </div>
          ) : (
            replies.map((reply) => (
              <div 
                key={reply.id} 
                className={`card-modern p-4 ${
                  reply.isInternalNote 
                    ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800' 
                    : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      reply.user?.role === 'support' || reply.user?.role === 'admin'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {reply.user?.role === 'support' || reply.user?.role === 'admin' ? (
                        <Shield className="h-4 w-4" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{reply.user?.name || 'Unknown'}</span>
                      <span className="text-xs text-muted-foreground">
                        {reply.user?.role && (
                          <Badge variant="outline" className="text-xs py-0 px-1">
                            {reply.user.role}
                          </Badge>
                        )}
                      </span>
                      {reply.isInternalNote && (
                        <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs py-0 px-2 flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          Internal Note
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground ml-auto">
                        {formatRelativeTime(reply.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{reply.message}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Reply Input */}
        <div className="p-6 border-t bg-muted/30">
          <div className="space-y-3">
            {canAddInternalNotes && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="internal-note"
                  checked={isInternalNote}
                  onChange={(e) => setIsInternalNote(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="internal-note" className="text-sm text-muted-foreground cursor-pointer">
                  Internal note (only visible to support team)
                </label>
              </div>
            )}
            
            <div className="flex gap-2">
              <Textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder={isInternalNote ? "Add internal note..." : "Type your reply..."}
                rows={3}
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleSendReply();
                  }
                }}
              />
              <Button 
                onClick={handleSendReply} 
                disabled={!replyMessage.trim() || sending}
                className="self-end"
              >
                <Send className="h-4 w-4 mr-2" />
                {sending ? 'Sending...' : 'Send'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Press Cmd/Ctrl + Enter to send
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

