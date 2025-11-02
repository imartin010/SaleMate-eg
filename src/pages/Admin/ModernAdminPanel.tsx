import React, { useState, useCallback, useRef } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Card } from '../../components/ui/card';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '../../components/ui/collapsible';
import { PurchaseRequests } from '../../components/admin/PurchaseRequests';
import { useAdminData, AdminUser, AdminProject } from '../../hooks/admin/useAdminData';
import { useLeadUpload } from '../../hooks/admin/useLeadUpload';
import { useProjectSearch } from '../../hooks/admin/useProjectSearch';
import { downloadCSVTemplate } from '../../lib/admin/csvParser';
import {
  updateUserRole,
  createProject,
  updateProject,
  deleteProject,
  approvePurchaseRequest,
  rejectPurchaseRequest,
  deleteUser,
} from '../../lib/admin/adminQueries';
import {
  Users,
  Building,
  Target,
  AlertCircle,
  Upload,
  Download,
  Search,
  Trash2,
  Check,
  X,
  Edit,
  Plus,
  Loader2,
  CheckCircle,
  BarChart3,
  FileText,
  DollarSign,
  ShoppingCart,
} from 'lucide-react';

export default function ModernAdminPanel() {
  const { users, projects, stats, requests, loading, error, refetch } = useAdminData();
  const { uploadLeads, uploading, progress, error: uploadError, successCount, reset: resetUpload } = useLeadUpload();
  const { filteredProjects, searchTerm, setSearchTerm } = useProjectSearch(projects);

  // Section visibility state
  const [showUsers, setShowUsers] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [showPurchaseRequests, setShowPurchaseRequests] = useState(true);

  // Lead upload state
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // User management state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userSearchTerm, setUserSearchTerm] = useState('');

  // Project management state
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [newProjectData, setNewProjectData] = useState({
    name: '',
    region: '',
    available_leads: 0,
    price_per_lead: 0,
    description: '',
  });
  const [showAddProject, setShowAddProject] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Handle file upload
  const handleFileSelect = useCallback((file: File) => {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      showToast('Please select a valid CSV file', 'error');
      return;
    }
    setCsvFile(file);
    resetUpload();
  }, [showToast, resetUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleUploadLeads = useCallback(async () => {
    if (!selectedProjectId || !csvFile) {
      showToast('Please select a project and CSV file', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      const result = await uploadLeads(selectedProjectId, content);
      
      if (result.success) {
        showToast(`Successfully uploaded ${result.count} leads!`, 'success');
        setCsvFile(null);
        setSelectedProjectId('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        refetch();
      } else {
        showToast(result.error || 'Failed to upload leads', 'error');
      }
    };
    reader.readAsText(csvFile);
  }, [selectedProjectId, csvFile, uploadLeads, showToast, refetch]);

  // User role change
  const handleRoleChange = useCallback(async (userId: string, newRole: string) => {
    try {
      await updateUserRole(userId, newRole as any);
      showToast('User role updated successfully', 'success');
      setEditingUserId(null);
      refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update role', 'error');
    }
  }, [showToast, refetch]);

  // Delete user
  const handleDeleteUser = useCallback(async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"?`)) return;
    
    try {
      await deleteUser(userId);
      showToast('User deleted successfully', 'success');
      refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete user', 'error');
    }
  }, [showToast, refetch]);

  // Create project
  const handleCreateProject = useCallback(async () => {
    if (!newProjectData.name || !newProjectData.region) {
      showToast('Please fill in project name and region', 'error');
      return;
    }

    try {
      await createProject(newProjectData);
      showToast('Project created successfully', 'success');
      setNewProjectData({ name: '', region: '', available_leads: 0, price_per_lead: 0, description: '' });
      setShowAddProject(false);
      refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create project', 'error');
    }
  }, [newProjectData, showToast, refetch]);

  // Update project CPL
  const handleUpdateProjectCPL = useCallback(async (projectId: string, newCPL: number) => {
    try {
      await updateProject(projectId, { price_per_lead: newCPL });
      showToast('Project price updated successfully', 'success');
      setEditingProjectId(null);
      refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update price', 'error');
    }
  }, [showToast, refetch]);

  // Delete project
  const handleDeleteProject = useCallback(async (projectId: string, projectName: string) => {
    if (!confirm(`Are you sure you want to delete project "${projectName}"?`)) return;
    
    try {
      await deleteProject(projectId);
      showToast('Project deleted successfully', 'success');
      refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete project', 'error');
    }
  }, [showToast, refetch]);

  // Approve/reject purchase request
  const handleApproveRequest = useCallback(async (requestId: string) => {
    try {
      await approvePurchaseRequest(requestId);
      showToast('Request approved successfully', 'success');
      refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to approve request', 'error');
    }
  }, [showToast, refetch]);

  const handleRejectRequest = useCallback(async (requestId: string) => {
    try {
      await rejectPurchaseRequest(requestId);
      showToast('Request rejected', 'success');
      refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to reject request', 'error');
    }
  }, [showToast, refetch]);

  // Filter users
  const filteredUsers = React.useMemo(() => {
    if (!userSearchTerm.trim()) return users;
    const term = userSearchTerm.toLowerCase();
    return users.filter(
      u => u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term)
    );
  }, [users, userSearchTerm]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Card className="p-6 border-red-200 bg-red-50">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-900">Error Loading Admin Data</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
          <Button onClick={refetch} className="mt-4">
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
          <Card className={`p-4 shadow-lg ${toast.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center gap-3">
              {toast.type === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={toast.type === 'success' ? 'text-green-900' : 'text-red-900'}>
                {toast.message}
              </span>
            </div>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600 mt-1">Manage users, projects, and leads</p>
        </div>
        <Button onClick={refetch} variant="outline" size="sm">
          <BarChart3 className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalUsers}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Projects</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalProjects}</p>
            </div>
            <Building className="h-8 w-8 text-purple-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Leads</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalLeads}</p>
            </div>
            <Target className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Requests</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.pendingRequests}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-orange-600" />
          </div>
        </Card>
      </div>

      {/* Purchase Requests Section */}
      <Collapsible open={showPurchaseRequests} onOpenChange={setShowPurchaseRequests}>
        <Card className="overflow-hidden">
          <CollapsibleTrigger asChild>
            <button className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <ShoppingCart className="h-6 w-6 text-orange-600" />
                <div className="text-left">
                  <h2 className="text-xl font-semibold text-gray-900">Purchase Requests</h2>
                  <p className="text-sm text-gray-600 mt-0.5">
                    Review and approve lead purchase requests with payment receipts
                  </p>
                </div>
              </div>
              <Badge className="bg-orange-100 text-orange-800">
                {stats.pendingRequests} Pending
              </Badge>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="border-t p-6">
              <PurchaseRequests />
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Lead Upload Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Leads
        </h2>

        <div className="space-y-4">
          {/* Project Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Target Project
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {searchTerm && (
              <div className="mt-2 max-h-60 overflow-y-auto border rounded-xl bg-white shadow-sm">
                {filteredProjects.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No projects found</div>
                ) : (
                  filteredProjects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => {
                        setSelectedProjectId(project.id);
                        setSearchTerm('');
                      }}
                      className={`w-full p-3 text-left hover:bg-gray-50 border-b last:border-b-0 transition-colors ${
                        selectedProjectId === project.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Building className="h-5 w-5 text-blue-600" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{project.name}</div>
                          <div className="text-sm text-gray-600">{project.region} • {project.available_leads} leads</div>
                        </div>
                        <div className="text-sm text-gray-600">{project.price_per_lead} EGP/lead</div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {selectedProjectId && !searchTerm && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-900">
                      {projects.find(p => p.id === selectedProjectId)?.name}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedProjectId('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* CSV Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload CSV File
            </label>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
              />
              
              {csvFile ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">{csvFile.name}</p>
                    <p className="text-sm text-gray-600">{(csvFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCsvFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div>
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-2">Drag and drop your CSV file here</p>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Or Browse Files
                  </Button>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={downloadCSVTemplate}
              className="mt-2"
            >
              <Download className="h-4 w-4 mr-2" />
              Download CSV Template
            </Button>
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <span className="font-medium text-blue-900">Uploading leads...</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
              <p className="text-sm text-blue-700 mt-2">
                {progress.current} / {progress.total} leads uploaded ({progress.percentage}%)
              </p>
            </div>
          )}

          {uploadError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-900">{uploadError}</span>
              </div>
            </div>
          )}

          {successCount > 0 && !uploading && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-900">Successfully uploaded {successCount} leads!</span>
              </div>
            </div>
          )}

          {/* Upload Button */}
          <Button
            onClick={handleUploadLeads}
            disabled={!selectedProjectId || !csvFile || uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Leads
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* User Management Section */}
      <Card>
        <Collapsible open={showUsers} onOpenChange={setShowUsers}>
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span>User Management ({users.length})</span>
            </div>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <div className="space-y-4">
              <Input
                placeholder="Search users..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="max-w-md"
              />

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-xl hover:bg-gray-50">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {editingUserId === user.id ? (
                        <select
                          className="border rounded px-2 py-1 text-sm"
                          defaultValue={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                          <option value="manager">Manager</option>
                          <option value="support">Support</option>
                        </select>
                      ) : (
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingUserId(editingUserId === user.id ? null : user.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id, user.name)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Project Management Section */}
      <Card>
        <Collapsible open={showProjects} onOpenChange={setShowProjects}>
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              <span>Project Management ({projects.length})</span>
            </div>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <div className="space-y-4">
              {/* Add Project Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddProject(!showAddProject)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Project
              </Button>

              {/* Add Project Form */}
              {showAddProject && (
                <Card className="p-4 bg-gray-50">
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Project Name"
                      value={newProjectData.name}
                      onChange={(e) => setNewProjectData({ ...newProjectData, name: e.target.value })}
                    />
                    <Input
                      placeholder="Region"
                      value={newProjectData.region}
                      onChange={(e) => setNewProjectData({ ...newProjectData, region: e.target.value })}
                    />
                    <Input
                      type="number"
                      placeholder="Available Leads"
                      value={newProjectData.available_leads}
                      onChange={(e) => setNewProjectData({ ...newProjectData, available_leads: Number(e.target.value) })}
                    />
                    <Input
                      type="number"
                      placeholder="Price Per Lead (EGP)"
                      value={newProjectData.price_per_lead}
                      onChange={(e) => setNewProjectData({ ...newProjectData, price_per_lead: Number(e.target.value) })}
                    />
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button onClick={handleCreateProject} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Project
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowAddProject(false)}>
                      Cancel
                    </Button>
                  </div>
                </Card>
              )}

              {/* Project List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {projects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-3 border rounded-xl hover:bg-gray-50">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{project.name}</p>
                      <p className="text-sm text-gray-600">{project.region} • {project.available_leads} leads available</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {editingProjectId === project.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            placeholder="CPL"
                            defaultValue={project.price_per_lead}
                            className="w-24"
                            onBlur={(e) => handleUpdateProjectCPL(project.id, Number(e.target.value))}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingProjectId(null)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <DollarSign className="h-4 w-4" />
                            <span>{project.price_per_lead} EGP</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingProjectId(project.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteProject(project.id, project.name)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>

    </div>
  );
}

