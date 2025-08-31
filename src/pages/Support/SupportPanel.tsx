import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';

import { useSupportStore } from '../../store/support';
import { useAuthStore } from '../../store/auth';
import { User, Lead, SupportCaseStatus } from '../../types';
import { formatRelativeTime } from '../../lib/format';
import { 
  Plus, 
  Search, 
  Filter, 
  Users, 
  Ban, 
  UserMinus, 
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  Trash2,
  Headphones,
  MessageSquare,
  Shield,
  HelpCircle,
  Settings,
  TrendingUp,
  UserCheck,
  UserX
} from 'lucide-react';

const SupportPanel: React.FC = () => {
  const { user } = useAuthStore();
  const { cases, fetchCases, createCase, updateCase, banUser, removeManager, loading } = useSupportStore();
  
  const [showCreateCase, setShowCreateCase] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [newCase, setNewCase] = useState({
    subject: '',
    description: '',
    createdBy: user?.id || '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SupportCaseStatus | ''>('');

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  // TODO: Fetch users and leads from Supabase
  const users: User[] = [];
  const leads: Lead[] = [];

  const handleCreateCase = async () => {
    if (!newCase.subject.trim() || !newCase.description.trim()) return;
    
    await createCase({
      ...newCase,
      status: 'open' as SupportCaseStatus,
    });
    
    setNewCase({ subject: '', description: '', createdBy: user?.id || '' });
    setShowCreateCase(false);
  };

  const handleStatusChange = async (caseId: string, status: SupportCaseStatus) => {
    await updateCase(caseId, { status });
  };

  const handleBanUser = async (userId: string) => {
    if (confirm('Are you sure you want to ban this user?')) {
      await banUser(userId);
    }
  };

  const handleRemoveManager = async (userId: string) => {
    if (confirm('Are you sure you want to remove this manager? Their team members will become unassigned.')) {
      await removeManager(userId);
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
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: SupportCaseStatus): string => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800 border-red-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Calculate support metrics
  const openCases = cases.filter(c => c.status === 'open').length;
  const inProgressCases = cases.filter(c => c.status === 'in_progress').length;
  const resolvedCases = cases.filter(c => c.status === 'resolved').length;
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.role !== 'admin').length;

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
    <div className="space-y-8">
      {/* Temporary Access Notice */}
      <div className="card-modern p-4 bg-yellow-50 border-yellow-200">
        <div className="flex items-center gap-2 text-yellow-800">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm font-medium">
            🔓 TEMPORARY ACCESS: This page is now accessible to all users for testing purposes. Role restrictions will be re-enabled later.
          </span>
        </div>
      </div>

      {/* Header Section - Mobile First */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gradient">Support Panel</h1>
            <p className="text-lg text-muted-foreground">
              Manage support cases and user administration
            </p>
          </div>
          
          {/* Mobile Actions */}
          <div className="flex items-center gap-2 sm:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateCase(true)}
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Case
            </Button>
            <Button size="sm" className="shrink-0">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Desktop Actions */}
          <div className="hidden sm:flex items-center gap-3">
            <Button variant="outline" size="sm">
              <HelpCircle className="h-4 w-4 mr-2" />
              Help Center
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Case
            </Button>
          </div>
        </div>

        {/* Support Metrics - Mobile First Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card-modern card-hover p-4 text-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 mx-auto mb-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">{openCases}</div>
            <div className="text-sm text-muted-foreground">Open Cases</div>
          </div>
          
          <div className="card-modern card-hover p-4 text-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100 mx-auto mb-2">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">{inProgressCases}</div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </div>
          
          <div className="card-modern card-hover p-4 text-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 mx-auto mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">{resolvedCases}</div>
            <div className="text-sm text-muted-foreground">Resolved</div>
          </div>
          
          <div className="card-modern card-hover p-4 text-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 mx-auto mb-2">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">{activeUsers}</div>
            <div className="text-sm text-muted-foreground">Active Users</div>
          </div>
        </div>
      </div>

      {/* Search and Filters - Mobile First */}
      <div className="space-y-4">
        {/* Search Bar - Full Width on Mobile */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search support cases by subject or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>

        {/* Quick Filters - Horizontal Scroll on Mobile */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Button
            variant={!statusFilter ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('')}
            className="whitespace-nowrap shrink-0"
          >
            All Cases
          </Button>
          <Button
            variant={statusFilter === 'open' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('open')}
            className="whitespace-nowrap shrink-0"
          >
            Open
          </Button>
          <Button
            variant={statusFilter === 'in_progress' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('in_progress')}
            className="whitespace-nowrap shrink-0"
          >
            In Progress
          </Button>
          <Button
            variant={statusFilter === 'resolved' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('resolved')}
            className="whitespace-nowrap shrink-0"
          >
            Resolved
          </Button>
        </div>
      </div>

      {/* Support Cases */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Support Cases</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Advanced
            </Button>
            <Button size="sm" onClick={() => setShowCreateCase(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Case
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          {filteredCases.map((caseItem) => {
            const creator = users.find(u => u.id === caseItem.createdBy);
            const assignee = caseItem.assignedTo ? users.find(u => u.id === caseItem.assignedTo) : null;

            return (
              <div key={caseItem.id} className="card-modern card-hover">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          <Headphones className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-foreground">{caseItem.subject}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Created by {creator?.name}</span>
                            <span>•</span>
                            <span>{formatRelativeTime(caseItem.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Badge className={`${getStatusColor(caseItem.status)} border px-3 py-1.5 text-sm font-medium flex items-center gap-2`}>
                      {getStatusIcon(caseItem.status)}
                      {caseItem.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="mb-4">
                    <p className="text-muted-foreground leading-relaxed">{caseItem.description}</p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {assignee && (
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4" />
                          <span>Assigned to {assignee.name}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Select
                        value={caseItem.status}
                        onChange={(e) => handleStatusChange(caseItem.id, e.target.value as SupportCaseStatus)}
                        className="w-40"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </Select>
                      <Button variant="outline" size="sm">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Reply
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredCases.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Headphones className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No support cases found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter 
                ? 'Try adjusting your search criteria or filters.'
                : 'All support cases have been resolved!'
              }
            </p>
            <Button onClick={() => setShowCreateCase(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Case
            </Button>
          </div>
        )}
      </div>

      {/* User Management Section */}
      <div className="card-modern p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground">User Management</h2>
            <p className="text-muted-foreground">Admin controls for user administration</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowUserManagement(true)}>
            <Users className="h-4 w-4 mr-2" />
            Manage Users
          </Button>
        </div>
        
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <div className="text-lg font-semibold">{totalUsers}</div>
            <div className="text-sm text-muted-foreground">Total Users</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <UserCheck className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <div className="text-lg font-semibold">{activeUsers}</div>
            <div className="text-sm text-muted-foreground">Active Users</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Shield className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <div className="text-lg font-semibold">Admin</div>
            <div className="text-sm text-muted-foreground">Privileges</div>
          </div>
        </div>
      </div>

      {/* Create Case Dialog */}
      <Dialog open={showCreateCase} onOpenChange={setShowCreateCase}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Support Case</DialogTitle>
            <DialogDescription>
              Submit a new support request for assistance
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Subject</label>
              <Input
                placeholder="Brief description of the issue"
                value={newCase.subject}
                onChange={(e) => setNewCase(prev => ({ ...prev, subject: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Textarea
                placeholder="Detailed description of your issue or request"
                value={newCase.description}
                onChange={(e) => setNewCase(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCreateCase(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateCase} disabled={!newCase.subject.trim() || !newCase.description.trim()}>
                Create Case
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupportPanel;
