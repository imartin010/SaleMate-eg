import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import LeadUpload from '../../components/admin/LeadUpload';
import { BulkLeadUpload } from '../../components/admin/BulkLeadUpload';
import { PurchaseRequestsManager } from '../../components/admin/PurchaseRequestsManager';
import ErrorBoundary from '../../components/common/ErrorBoundary';

import { useProjectStore } from '../../store/projects';
import { useLeadStore } from '../../store/leads';
import { supabase } from '../../lib/supabaseClient';
import { User, UserRole } from '../../types';
import { 
  Plus, 
  Upload, 
  Users, 
  Building, 
  Trash2,
  Edit,
  Shield,
  BarChart3,
  Activity,
  Target,
  CheckCircle,
  UserX,
  RefreshCw,
  AlertCircle,
  Receipt
} from 'lucide-react';

const AdminPanel: React.FC = () => {
  const { projects, fetchProjects, addProject, deleteProject } = useProjectStore();
  const { addLead } = useLeadStore();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'projects' | 'leads' | 'requests'>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCSVUpload, setShowCSVUpload] = useState(false);
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [newProject, setNewProject] = useState({
    name: '',
    developer: '',
    region: '',
    availableLeads: 0,
    pricePerLead: 0,
    description: '',
  });

  const [csvData, setCsvData] = useState('');

  // Fetch real data from Supabase
  const fetchUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform Supabase data to match User type
      const transformedUsers: User[] = data?.map(profile => ({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role as UserRole,
        managerId: profile.manager_id as string | undefined,
        createdAt: profile.created_at
      })) || [];
      
      setUsers(transformedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch users');
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch projects and users in parallel
      await Promise.all([
        fetchProjects(),
        fetchUsers()
      ]);
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [fetchProjects, fetchUsers]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleCreateProject = async () => {
    if (!newProject.name.trim() || !newProject.developer.trim()) return;
    
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: newProject.name,
          developer: newProject.developer,
          region: newProject.region,
          available_leads: newProject.availableLeads,
          price_per_lead: newProject.pricePerLead,
          description: newProject.description
        })
        .select()
        .single();

      if (error) throw error;
      
              // Add to local state
        addProject({
          name: data.name,
          developer: data.developer,
          region: data.region,
          availableLeads: data.available_leads,
          pricePerLead: data.price_per_lead,
          description: data.description || undefined,
        });
      
      setNewProject({
        name: '',
        developer: '',
        region: '',
        availableLeads: 0,
        pricePerLead: 0,
        description: '',
      });
      setShowCreateProject(false);
      
    } catch (err) {
      console.error('Error creating project:', err);
      setError('Failed to create project');
    }
  };



  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;
    
    try {
      setError(null);
      
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
      
      // Remove from local state
      deleteProject(projectId);
      
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Failed to delete project');
    }
  };

  const handleCSVUpload = () => {
    if (!csvData.trim()) return;
    
    // Simple CSV parsing simulation
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    let leadsAdded = 0;
    const leadsUpdated = 0;
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const leadData: Record<string, string> = {};
      
      headers.forEach((header, index) => {
        leadData[header] = values[index];
      });
      
      // Create leads from CSV data
      if (leadData.clientName && leadData.clientPhone && leadData.projectId) {
        addLead({
          projectId: leadData.projectId,
          clientName: leadData.clientName,
          clientPhone: leadData.clientPhone,
          clientEmail: leadData.clientEmail,
          platform: (leadData.platform || 'Other') as 'Facebook' | 'Google' | 'TikTok' | 'Other',
          stage: 'New Lead',
        });
        leadsAdded++;
      }
    }
    
    alert(`CSV Upload Complete!\nLeads Added: ${leadsAdded}\nLeads Updated: ${leadsUpdated}`);
    setCsvData('');
    setShowCSVUpload(false);
  };

  // Calculate admin metrics from real data
  const totalUsers = users.length;
  const activeUsers = users.length;
  const totalProjects = projects.length;
  const totalLeads = projects.reduce((sum, p) => sum + p.availableLeads, 0);
  const adminUsers = users.filter(u => u.role === 'admin').length;
  const managerUsers = users.filter(u => u.role === 'manager').length;
  const agentUsers = users.filter(u => u.role === 'user').length;
  const supportUsers = users.filter(u => u.role === 'support').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading admin data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section - Mobile First */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gradient">Admin Panel</h1>
            <p className="text-lg text-muted-foreground">
              System administration and data management
            </p>
          </div>
          <Button onClick={fetchAllData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-800">{error}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-700"
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-accent/50 p-1 rounded-lg">
          <Button
            variant={activeTab === 'overview' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('overview')}
            className="flex-1"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </Button>
          <Button
            variant={activeTab === 'leads' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('leads')}
            className="flex-1"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Leads
          </Button>
          <Button
            variant={activeTab === 'projects' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('projects')}
            className="flex-1"
          >
            <Building className="h-4 w-4 mr-2" />
            Projects
          </Button>
          <Button
            variant={activeTab === 'users' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('users')}
            className="flex-1"
          >
            <Users className="h-4 w-4 mr-2" />
            Users
          </Button>
          <Button
            variant={activeTab === 'requests' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('requests')}
            className="flex-1"
          >
            <Receipt className="h-4 w-4 mr-2" />
            Requests
          </Button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Admin Metrics - Mobile First Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card-modern card-hover p-4 text-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 mx-auto mb-2">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-foreground">{totalUsers}</div>
              <div className="text-sm text-muted-foreground">Total Users</div>
            </div>
            
            <div className="card-modern card-hover p-4 text-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 mx-auto mb-2">
                <Building className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-foreground">{totalProjects}</div>
              <div className="text-sm text-muted-foreground">Projects</div>
            </div>
            
            <div className="card-modern card-hover p-4 text-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 mx-auto mb-2">
                <Target className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-foreground">{totalLeads.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Available Leads</div>
            </div>
            
            <div className="card-modern card-hover p-4 text-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-100 mx-auto mb-2">
                <Shield className="h-5 w-5 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-foreground">{adminUsers}</div>
              <div className="text-sm text-muted-foreground">Admins</div>
            </div>
          </div>

          {/* User Role Distribution */}
          <div className="card-modern p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">User Distribution</h2>
                <p className="text-muted-foreground">Breakdown of users by role</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Shield className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <h3 className="font-semibold text-foreground mb-1">Admins</h3>
                <p className="text-lg font-bold text-blue-600">{adminUsers}</p>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <Users className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <h3 className="font-semibold text-foreground mb-1">Managers</h3>
                <p className="text-lg font-bold text-green-600">{managerUsers}</p>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                <Target className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <h3 className="font-semibold text-foreground mb-1">Agents</h3>
                <p className="text-lg font-bold text-purple-600">{agentUsers}</p>
              </div>
              
              <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                <Activity className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                <h3 className="font-semibold text-foreground mb-1">Support</h3>
                <p className="text-lg font-bold text-orange-600">{supportUsers}</p>
              </div>
            </div>
          </div>

          {/* System Health Section */}
          <div className="card-modern p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">System Health</h2>
                <p className="text-muted-foreground">Monitor system performance and status</p>
              </div>
              <Button variant="outline" size="sm">
                <Activity className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <h3 className="font-semibold text-foreground mb-1">Database</h3>
                <p className="text-sm text-green-600">Connected to Supabase</p>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <h3 className="font-semibold text-foreground mb-1">API</h3>
                <p className="text-sm text-green-600">Operational</p>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <h3 className="font-semibold text-foreground mb-1">Storage</h3>
                <p className="text-sm text-green-600">Optimal</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lead Upload Tab */}
      {activeTab === 'leads' && (
        <ErrorBoundary>
          <BulkLeadUpload />
        </ErrorBoundary>
      )}

      {/* User Management Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* User Management Section */}
        <div className="card-modern p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground">User Management</h2>
              <p className="text-muted-foreground">Manage user accounts and permissions</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchUsers}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
          
          {usersLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-primary mr-2" />
              <span className="text-muted-foreground">Loading users...</span>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Users className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <div className="text-lg font-semibold">{activeUsers}</div>
                  <div className="text-sm text-muted-foreground">Active Users</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <div className="text-lg font-semibold">{managerUsers}</div>
                  <div className="text-sm text-muted-foreground">Managers</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Target className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <div className="text-lg font-semibold">{agentUsers}</div>
                  <div className="text-sm text-muted-foreground">Agents</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Activity className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                  <div className="text-lg font-semibold">{supportUsers}</div>
                  <div className="text-sm text-muted-foreground">Support</div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left px-4 py-3 font-semibold text-gray-900 text-sm">User</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-900 text-sm">Role</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-900 text-sm">Status</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-900 text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-foreground">{user.name}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="capitalize">
                            {user.role}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-muted-foreground">Active</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            {user.role !== 'admin' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:text-red-700"
                              >
                                <UserX className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
        </div>
      )}

      {/* Projects Management Tab */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          {/* Project Management Section */}
        <div className="card-modern p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Project Management</h2>
              <p className="text-muted-foreground">Manage real estate projects and lead availability</p>
            </div>
            <Button size="sm" onClick={() => setShowCreateProject(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>

          <div className="grid gap-4">
            {projects.map((project) => (
              <div key={project.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold">
                    <Building className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{project.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{project.developer}</span>
                      <span>•</span>
                      <span>{project.region}</span>
                      <span>•</span>
                      <span className="font-medium text-foreground">
                        ${project.pricePerLead}/lead
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-foreground">{project.availableLeads}</div>
                    <div className="text-xs text-muted-foreground">Available Leads</div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteProject(project.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>
      )}

      {/* Purchase Requests Tab */}
      {activeTab === 'requests' && (
        <ErrorBoundary>
          <PurchaseRequestsManager />
        </ErrorBoundary>
      )}

        {/* Create Project Dialog */}
        <Dialog open={showCreateProject} onOpenChange={setShowCreateProject}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Add a new real estate project to the system
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Project Name</label>
                <Input
                  placeholder="Enter project name"
                  value={newProject.name}
                  onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Developer</label>
                <Input
                  placeholder="Enter developer name"
                  value={newProject.developer}
                  onChange={(e) => setNewProject(prev => ({ ...prev, developer: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Region</label>
                <Input
                  placeholder="Enter region"
                  value={newProject.region}
                  onChange={(e) => setNewProject(prev => ({ ...prev, region: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Available Leads</label>
                <Input
                  type="number"
                  placeholder="Enter number of leads"
                  value={newProject.availableLeads}
                  onChange={(e) => setNewProject(prev => ({ ...prev, availableLeads: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Price Per Lead ($)</label>
                <Input
                  type="number"
                  placeholder="Enter price per lead"
                  value={newProject.pricePerLead}
                  onChange={(e) => setNewProject(prev => ({ ...prev, pricePerLead: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Textarea
                  placeholder="Enter project description"
                  value={newProject.description}
                  onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowCreateProject(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateProject} disabled={!newProject.name.trim() || !newProject.developer.trim()}>
                  Create Project
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* CSV Upload Dialog */}
        <Dialog open={showCSVUpload} onOpenChange={setShowCSVUpload}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload CSV Data</DialogTitle>
              <DialogDescription>
                Import leads data from a CSV file
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">CSV Data</label>
                <Textarea
                  placeholder="Paste your CSV data here..."
                  value={csvData}
                  onChange={(e) => setCsvData(e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowCSVUpload(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCSVUpload} disabled={!csvData.trim()}>
                  Upload Data
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
};

export default AdminPanel;
