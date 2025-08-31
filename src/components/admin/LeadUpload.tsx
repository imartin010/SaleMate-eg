import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { uploadLeads, getAllProjects, getProjectStats, updateProjectCPL, supabase } from '../../lib/supabaseClient';
import { getAllProjectsAdmin, uploadLeadsAdmin, getProjectStatsAdmin, updateProjectCPLAdmin } from '../../lib/supabaseAdminClient';
import { useAuthStore } from '../../store/auth';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Database,
  BarChart3,
  Plus,
  Trash2,
  Target,
  Users,
  Search,
  ChevronDown,
  Building,
  DollarSign,
  Download,
  X
} from 'lucide-react';

interface LeadData {
  client_name: string;
  client_phone: string;
  client_phone2?: string;
  client_phone3?: string;
  client_email?: string;
  client_job_title?: string;
  platform: 'Facebook' | 'Google' | 'TikTok' | 'Other';
  stage?: string;
}

interface Project {
  id: string;
  name: string;
  developer: string;
  region: string;
  available_leads: number;
  price_per_lead: number;
}

export const LeadUpload: React.FC = () => {
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [projectSearchTerm, setProjectSearchTerm] = useState('');
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [leadsList, setLeadsList] = useState<LeadData[]>([{
    client_name: '',
    client_phone: '',
    client_phone2: '',
    client_phone3: '',
    client_email: '',
    client_job_title: '',
    platform: 'Facebook',
    stage: 'New Lead'
  }]);
  const [bulkLeadsText, setBulkLeadsText] = useState('');
  const [uploadMode, setUploadMode] = useState<'manual' | 'bulk'>('manual');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [projectStats, setProjectStats] = useState<any>(null);
  const [customCPL, setCustomCPL] = useState<number>(0);
  const [useCustomCPL, setUseCustomCPL] = useState(false);

  // Check user permissions (allow admin emails and roles for testing)
  const canUploadLeads = user && (
    ['admin', 'support'].includes(user.role) || 
    user.email?.includes('admin') || 
    user.email === 'themartining@gmail.com' ||
    user.email === 'admin@sm.com' ||
    true // Temporary: allow all authenticated users for testing
  );

  useEffect(() => {
    console.log('LeadUpload mounted, user:', user?.email);
    // Load projects directly using admin client (temporary for testing)
    loadProjects();
    loadProjectStats();
  }, []);

  // Filter projects based on search term
  useEffect(() => {
    if (!projectSearchTerm) {
      setFilteredProjects(projects);
    } else {
      const filtered = projects.filter(project => 
        project.name.toLowerCase().includes(projectSearchTerm.toLowerCase()) ||
        project.developer.toLowerCase().includes(projectSearchTerm.toLowerCase()) ||
        project.region.toLowerCase().includes(projectSearchTerm.toLowerCase())
      );
      setFilteredProjects(filtered);
    }
  }, [projects, projectSearchTerm]);

  // Set CPL when project is selected
  useEffect(() => {
    const project = projects.find(p => p.id === selectedProjectId);
    if (project && !useCustomCPL) {
      setCustomCPL(project.price_per_lead);
    }
  }, [selectedProjectId, projects, useCustomCPL]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.project-dropdown')) {
        setShowProjectDropdown(false);
      }
    };

    if (showProjectDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showProjectDropdown]);

  const loadProjects = async () => {
    setProjectsLoading(true);
    try {
      console.log('Loading projects from Supabase backend...');
      
      // Load ALL projects from your Supabase backend using admin client
      const projectData = await getAllProjectsAdmin();
      
      if (projectData && projectData.length > 0) {
        console.log('Successfully loaded projects from backend:', projectData.length);
        setProjects(projectData);
      } else {
        console.warn('No projects found in backend');
        setProjects([]);
      }
      
    } catch (error) {
      console.error('Failed to load projects from backend:', error);
      // Show error message to user
      setProjects([]);
    } finally {
      setProjectsLoading(false);
    }
  };

  const loadProjectStats = async () => {
    try {
      console.log('Loading project stats from backend...');
      
      // Load stats using admin client
      const statsData = await getProjectStatsAdmin();
      
      if (statsData) {
        console.log('Successfully loaded stats from backend:', statsData);
        setProjectStats(statsData);
      } else {
        // Calculate stats from loaded projects
        const calculatedStats = {
          total_projects: projects.length,
          projects_with_leads: projects.filter(p => p.available_leads > 0).length,
          total_available_leads: projects.reduce((sum, p) => sum + p.available_leads, 0),
          total_developers: new Set(projects.map(p => p.developer)).size
        };
        setProjectStats(calculatedStats);
      }
      
    } catch (error) {
      console.error('Failed to load project stats:', error);
      // Calculate fallback stats from projects
      const fallbackStats = {
        total_projects: projects.length,
        projects_with_leads: projects.filter(p => p.available_leads > 0).length,
        total_available_leads: projects.reduce((sum, p) => sum + p.available_leads, 0),
        total_developers: new Set(projects.map(p => p.developer)).size
      };
      setProjectStats(fallbackStats);
    }
  };

  const addNewLead = () => {
    setLeadsList([...leadsList, {
      client_name: '',
      client_phone: '',
      client_phone2: '',
      client_phone3: '',
      client_email: '',
      client_job_title: '',
      platform: 'Facebook',
      stage: 'New Lead'
    }]);
  };

  const removeLead = (index: number) => {
    setLeadsList(leadsList.filter((_, i) => i !== index));
  };

  const updateLead = (index: number, field: keyof LeadData, value: string) => {
    const updated = [...leadsList];
    updated[index] = { ...updated[index], [field]: value };
    setLeadsList(updated);
  };

  const parseBulkLeads = (text: string): LeadData[] => {
    const lines = text.trim().split('\n').filter(line => line.trim());
    const leads: LeadData[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip header line if it contains column names
      if (i === 0 && line.toLowerCase().includes('client_name')) {
        continue;
      }
      
      // Parse CSV line (handle quoted fields)
      const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
      
      if (parts.length >= 2 && parts[0] && parts[1]) {
        const platform = parts[6] || 'Facebook';
        const stage = parts[7] || 'New Lead';
        
        // Validate platform
        const validPlatforms = ['Facebook', 'Google', 'TikTok', 'Other'];
        const validStages = ['New Lead', 'Potential', 'Hot Case', 'Meeting Done', 'No Answer', 'Call Back', 'Whatsapp', 'Wrong Number', 'Non Potential'];
        
        leads.push({
          client_name: parts[0],
          client_phone: parts[1],
          client_phone2: parts[2] || '',
          client_phone3: parts[3] || '',
          client_email: parts[4] || '',
          client_job_title: parts[5] || '',
          platform: validPlatforms.includes(platform) ? platform as any : 'Facebook',
          stage: validStages.includes(stage) ? stage : 'New Lead'
        });
      }
    }

    return leads;
  };

  const downloadTemplate = () => {
    // Create CSV template with the correct format for backend including new columns
    const csvHeaders = [
      'client_name',
      'client_phone',
      'client_phone2',
      'client_phone3', 
      'client_email',
      'client_job_title',
      'platform',
      'stage'
    ];

    // Comprehensive sample data with Egyptian names and all new fields
    const sampleData = [
      ['Ahmed Mohamed Hassan', '+201012345678', '+201012345679', '', 'ahmed.hassan@gmail.com', 'Sales Manager', 'Facebook', 'New Lead'],
      ['Fatma Ali Ibrahim', '+201123456789', '', '+201123456780', 'fatma.ali@yahoo.com', 'Marketing Director', 'Google', 'Potential'],
      ['Omar Mahmoud Ahmed', '+201234567890', '+201234567891', '', 'omar.mahmoud@hotmail.com', 'Business Owner', 'TikTok', 'Hot Case'],
      ['Sarah Khaled Mohamed', '+201098765432', '', '', 'sarah.khaled@outlook.com', 'Real Estate Agent', 'Facebook', 'Meeting Done'],
      ['Mohamed Tarek Ali', '+201187654321', '+201187654322', '+201187654323', 'mohamed.tarek@gmail.com', 'Investment Consultant', 'Google', 'New Lead'],
      ['Nour Hassan Ibrahim', '+201276543210', '', '', 'nour.hassan@yahoo.com', 'Property Developer', 'Other', 'Potential'],
      ['Youssef Ahmed Omar', '+201365432109', '+201365432110', '', 'youssef.ahmed@gmail.com', 'Financial Advisor', 'TikTok', 'Call Back'],
      ['Menna Mohamed Ali', '+201454321098', '', '', 'menna.mohamed@hotmail.com', 'Architect', 'Facebook', 'Whatsapp'],
      ['Karim Hassan Ahmed', '+201543210987', '+201543210988', '', 'karim.hassan@outlook.com', 'Engineer', 'Google', 'New Lead'],
      ['Aya Ali Mohamed', '+201632109876', '', '+201632109877', 'aya.ali@gmail.com', 'Interior Designer', 'Other', 'Hot Case'],
      ['Mahmoud Omar Hassan', '+201721098765', '', '', 'mahmoud.omar@yahoo.com', 'Contractor', 'Facebook', 'No Answer'],
      ['Reem Ahmed Ibrahim', '+201810987654', '+201810987655', '', 'reem.ahmed@gmail.com', 'Project Manager', 'TikTok', 'Potential'],
      ['Amr Mohamed Omar', '+201909876543', '', '', 'amr.mohamed@hotmail.com', 'Lawyer', 'Google', 'Wrong Number'],
      ['Heba Hassan Ali', '+201098765431', '', '', 'heba.hassan@outlook.com', 'Accountant', 'Facebook', 'Non Potential'],
      ['Tamer Ali Ahmed', '+201187654320', '+201187654321', '+201187654322', 'tamer.ali@gmail.com', 'CEO', 'Other', 'New Lead']
    ];

    // Create CSV content with BOM for proper Excel encoding
    const BOM = '\uFEFF';
    const csvContent = BOM + [
      csvHeaders.join(','),
      ...sampleData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const today = new Date().toISOString().split('T')[0];
    const fileName = `SaleMate_Leads_Template_${today}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('Lead template downloaded:', fileName);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCsvFile(file);
      
      // Read and parse the CSV file
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setBulkLeadsText(text);
        console.log('CSV file loaded:', file.name, 'Size:', file.size, 'bytes');
      };
      reader.readAsText(file);
    }
  };

  const clearFile = () => {
    setCsvFile(null);
    setBulkLeadsText('');
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setCsvFile(file);
        
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          setBulkLeadsText(text);
          console.log('CSV file dropped and loaded:', file.name);
        };
        reader.readAsText(file);
      } else {
        alert('Please upload a CSV file only');
      }
    }
  };

  const handleUpload = async () => {
    console.log('Upload button clicked');
    
    if (!selectedProjectId) {
      alert('Please select a project');
      return;
    }

    if (!canUploadLeads) {
      alert('Only admin and support users can upload leads');
      return;
    }

    setLoading(true);
    setUploadResult(null);

    try {
      const leadsToUpload = uploadMode === 'bulk' 
        ? parseBulkLeads(bulkLeadsText)
        : leadsList.filter(lead => lead.client_name && lead.client_phone);

      console.log('Leads to upload:', leadsToUpload);

      if (leadsToUpload.length === 0) {
        alert('No valid leads to upload');
        setLoading(false);
        return;
      }

      // First, update the project's CPL if it's different
      if (useCustomCPL && customCPL !== selectedProject.price_per_lead) {
        try {
          console.log('Updating project CPL to:', customCPL);
          const cplResult = await updateProjectCPLAdmin(selectedProjectId, customCPL);
          console.log('CPL update result:', cplResult);
          
          if (cplResult && cplResult.success) {
            // Update local state
            setProjects(prev => prev.map(p => 
              p.id === selectedProjectId 
                ? { ...p, price_per_lead: customCPL }
                : p
            ));
          }
        } catch (cplError) {
          console.error('Error updating CPL:', cplError);
          // Continue with upload even if CPL update fails
        }
      }

      // Upload leads to backend using admin client
      try {
        console.log('Uploading leads to backend...');
        const realResult = await uploadLeadsAdmin(selectedProjectId, leadsToUpload);
        console.log('Backend upload result:', realResult);
        
        if (realResult && realResult.success) {
          setUploadResult(realResult);
          
          // Refresh projects to get updated available_leads
          await loadProjects();
          await loadProjectStats();
        } else {
          throw new Error(realResult?.error || 'Upload failed');
        }
        
      } catch (realError) {
        console.error('Backend upload failed:', realError);
        setUploadResult({
          success: false,
          error: realError.message || 'Failed to upload leads to backend'
        });
      }

      // Reset form
      if (uploadMode === 'manual') {
        setLeadsList([{
          client_name: '',
          client_phone: '',
          client_phone2: '',
          client_phone3: '',
          client_email: '',
          client_job_title: '',
          platform: 'Facebook',
          stage: 'New Lead'
        }]);
      } else {
        setBulkLeadsText('');
        setCsvFile(null);
      }

    } catch (error: any) {
      console.error('Upload failed:', error);
      setUploadResult({
        success: false,
        error: error.message || 'Upload failed'
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  // Show loading if no user yet
  if (!user) {
    return (
      <div className="card-modern p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading user information...</p>
      </div>
    );
  }

  // Show permission error if user doesn't have access (currently disabled for testing)
  if (!canUploadLeads) {
    return (
      <div className="card-modern p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">Access Denied</h3>
        <p className="text-muted-foreground">
          Only admin and support users can upload leads to projects.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Current user: {user.email} (Role: {user.role})
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gradient">Lead Upload</h1>
          <p className="text-lg text-muted-foreground">
            Upload leads to projects and manage availability
          </p>
        </div>
        
        {/* Quick Actions */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={downloadTemplate}
            className="crm-button crm-button-outline"
          >
            <Download className="h-4 w-4 mr-2" />
            Download CSV Template
          </Button>
        </div>
      </div>

      {/* Project Stats */}
      {projectStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card-modern card-hover p-4 text-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 mx-auto mb-2">
              <Database className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">{projectStats.total_projects}</div>
            <div className="text-sm text-muted-foreground">Total Projects</div>
          </div>
          
          <div className="card-modern card-hover p-4 text-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 mx-auto mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">{projectStats.projects_with_leads}</div>
            <div className="text-sm text-muted-foreground">With Leads</div>
          </div>
          
          <div className="card-modern card-hover p-4 text-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-100 mx-auto mb-2">
              <Target className="h-5 w-5 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">{projectStats.total_available_leads}</div>
            <div className="text-sm text-muted-foreground">Available Leads</div>
          </div>
          
          <div className="card-modern card-hover p-4 text-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 mx-auto mb-2">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">{projectStats.total_developers}</div>
            <div className="text-sm text-muted-foreground">Developers</div>
          </div>
        </div>
      )}

      {/* Project Selection */}
      <div className="card-modern p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-primary/10">
            <Database className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">Select Project</h3>
            <p className="text-sm text-muted-foreground">Choose the project to upload leads to</p>
          </div>
        </div>
        
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects by name, developer, or region..."
              value={projectSearchTerm}
              onChange={(e) => {
                setProjectSearchTerm(e.target.value);
                setShowProjectDropdown(true);
              }}
              onFocus={() => setShowProjectDropdown(true)}
              className="pl-10 h-12 crm-input"
            />
          </div>

          {/* Custom Dropdown */}
          <div className="relative project-dropdown">
            <div
              className={`w-full h-12 px-4 py-3 border border-gray-300 rounded-lg cursor-pointer flex items-center justify-between crm-input ${
                showProjectDropdown ? 'ring-2 ring-blue-500 border-transparent' : ''
              }`}
              onClick={() => setShowProjectDropdown(!showProjectDropdown)}
            >
              <span className={selectedProject ? 'text-foreground' : 'text-muted-foreground'}>
                {projectsLoading 
                  ? 'Loading projects...' 
                  : selectedProject 
                    ? `${selectedProject.name} - ${selectedProject.developer}`
                    : 'Select a project...'
                }
              </span>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showProjectDropdown ? 'rotate-180' : ''}`} />
            </div>

            {showProjectDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                {projectsLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    <span className="ml-2 text-muted-foreground">Loading projects...</span>
                  </div>
                ) : filteredProjects.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    {projectSearchTerm ? 'No projects match your search' : 'No projects available'}
                  </div>
                ) : (
                  filteredProjects.map(project => (
                    <div
                      key={project.id}
                      className={`p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                        selectedProjectId === project.id ? 'bg-blue-50 text-blue-900' : ''
                      }`}
                      onClick={() => {
                        setSelectedProjectId(project.id);
                        setShowProjectDropdown(false);
                        setProjectSearchTerm('');
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <Building className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-foreground truncate">{project.name}</div>
                          <div className="text-sm text-muted-foreground truncate">
                            {project.developer} • {project.region}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-foreground">{project.available_leads}</div>
                          <div className="text-xs text-muted-foreground">leads</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          
          {projectSearchTerm && (
            <div className="text-sm text-muted-foreground">
              Showing {filteredProjects.length} of {projects.length} projects
            </div>
          )}
          
          {!projectsLoading && projects.length === 0 && (
            <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  No projects loaded. This might be due to authentication or permission issues.
                </span>
              </div>
            </div>
          )}

          {selectedProject && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
              <h4 className="font-semibold text-foreground">{selectedProject.name}</h4>
              <p className="text-sm text-muted-foreground">
                Developer: {selectedProject.developer} | Region: {selectedProject.region}
              </p>
              <div className="flex items-center gap-4 mt-3">
                <div className="crm-badge bg-green-100 text-green-800 border-green-200">
                  {selectedProject.available_leads} Available Leads
                </div>
                <div className="crm-badge bg-blue-100 text-blue-800 border-blue-200">
                  Default: EGP {selectedProject.price_per_lead} per lead
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CPL (Cost Per Lead) Setting */}
      {selectedProject && (
        <div className="card-modern p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-green-100">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Cost Per Lead (CPL)</h3>
              <p className="text-sm text-muted-foreground">Set the price for each lead in this project</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="default-cpl"
                  name="cpl-option"
                  checked={!useCustomCPL}
                  onChange={() => {
                    setUseCustomCPL(false);
                    setCustomCPL(selectedProject.price_per_lead);
                  }}
                  className="w-4 h-4 text-blue-600"
                />
                <label htmlFor="default-cpl" className="text-sm font-medium">
                  Use Default CPL (EGP {selectedProject.price_per_lead})
                </label>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="custom-cpl"
                  name="cpl-option"
                  checked={useCustomCPL}
                  onChange={() => setUseCustomCPL(true)}
                  className="w-4 h-4 text-blue-600"
                />
                <label htmlFor="custom-cpl" className="text-sm font-medium">
                  Set Custom CPL
                </label>
              </div>
            </div>

            {useCustomCPL && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">EGP</span>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  placeholder="Enter custom price per lead (e.g., 300)"
                  value={customCPL}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCustomCPL(value === '' ? 0 : parseFloat(value));
                  }}
                  className="crm-input"
                />
                <span className="text-sm text-muted-foreground">per lead</span>
              </div>
            )}

            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <div className="text-sm text-green-800">
                <strong>Current CPL:</strong> EGP {customCPL.toFixed(2)} per lead<br />
                <strong>Example:</strong> 100 leads × EGP {customCPL.toFixed(2)} = EGP {(100 * customCPL).toFixed(2)} total
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Mode Selection */}
      <div className="card-modern p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-primary/10">
            <Upload className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">Upload Method</h3>
            <p className="text-sm text-muted-foreground">Choose how you want to upload leads</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div 
            className={`group cursor-pointer p-4 rounded-xl border-2 transition-all duration-300 ${
              uploadMode === 'manual' 
                ? 'border-primary bg-primary/5' 
                : 'border-gray-200 hover:border-primary/50'
            }`}
            onClick={() => setUploadMode('manual')}
          >
            <div className="text-center">
              <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center ${
                uploadMode === 'manual' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                <Plus className="h-6 w-6" />
              </div>
              <h4 className="font-semibold text-foreground">Manual Entry</h4>
              <p className="text-sm text-muted-foreground">Add leads one by one</p>
            </div>
          </div>
          
          <div 
            className={`group cursor-pointer p-4 rounded-xl border-2 transition-all duration-300 ${
              uploadMode === 'bulk' 
                ? 'border-primary bg-primary/5' 
                : 'border-gray-200 hover:border-primary/50'
            }`}
            onClick={() => setUploadMode('bulk')}
          >
            <div className="text-center">
              <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center ${
                uploadMode === 'bulk' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                <FileText className="h-6 w-6" />
              </div>
              <h4 className="font-semibold text-foreground">Bulk Upload</h4>
              <p className="text-sm text-muted-foreground">Upload multiple leads</p>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Lead Entry */}
      {uploadMode === 'manual' && (
        <div className="card-modern p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-green-100">
              <Plus className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Manual Lead Entry</h3>
              <p className="text-sm text-muted-foreground">Add leads one by one with detailed information</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {leadsList.map((lead, index) => (
              <div key={index} className="p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-foreground">Lead {index + 1}</h4>
                  {leadsList.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLead(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    placeholder="Client Name *"
                    value={lead.client_name}
                    onChange={(e) => updateLead(index, 'client_name', e.target.value)}
                    className="crm-input"
                  />
                  <Input
                    placeholder="Primary Phone *"
                    value={lead.client_phone}
                    onChange={(e) => updateLead(index, 'client_phone', e.target.value)}
                    className="crm-input"
                  />
                  <Input
                    placeholder="Secondary Phone"
                    value={lead.client_phone2}
                    onChange={(e) => updateLead(index, 'client_phone2', e.target.value)}
                    className="crm-input"
                  />
                  <Input
                    placeholder="Third Phone"
                    value={lead.client_phone3}
                    onChange={(e) => updateLead(index, 'client_phone3', e.target.value)}
                    className="crm-input"
                  />
                  <Input
                    placeholder="Client Email"
                    value={lead.client_email}
                    onChange={(e) => updateLead(index, 'client_email', e.target.value)}
                    className="crm-input"
                  />
                  <Input
                    placeholder="Job Title"
                    value={lead.client_job_title}
                    onChange={(e) => updateLead(index, 'client_job_title', e.target.value)}
                    className="crm-input"
                  />
                  <Select
                    value={lead.platform}
                    onChange={(e) => updateLead(index, 'platform', e.target.value)}
                    className="crm-input"
                  >
                    <option value="Facebook">Facebook</option>
                    <option value="Google">Google</option>
                    <option value="TikTok">TikTok</option>
                    <option value="Other">Other</option>
                  </Select>
                  <Select
                    value={lead.stage}
                    onChange={(e) => updateLead(index, 'stage', e.target.value)}
                    className="crm-input"
                  >
                    <option value="New Lead">New Lead</option>
                    <option value="Potential">Potential</option>
                    <option value="Hot Case">Hot Case</option>
                    <option value="Meeting Done">Meeting Done</option>
                    <option value="No Answer">No Answer</option>
                    <option value="Call Back">Call Back</option>
                    <option value="Whatsapp">Whatsapp</option>
                    <option value="Wrong Number">Wrong Number</option>
                    <option value="Non Potential">Non Potential</option>
                  </Select>
                </div>
              </div>
            ))}
            
            <Button 
              variant="outline" 
              onClick={addNewLead} 
              className="w-full crm-button crm-button-outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Lead
            </Button>
          </div>
        </div>
      )}

      {/* Bulk Lead Upload */}
      {uploadMode === 'bulk' && (
        <div className="card-modern p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-purple-100">
              <FileText className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Bulk Lead Upload</h3>
              <p className="text-sm text-muted-foreground">
                Upload multiple leads at once using CSV format
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            {/* Download Template Button */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
              <div>
                <h4 className="font-semibold text-green-800">CSV Template</h4>
                <p className="text-sm text-green-600">Download a pre-formatted template with sample data</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadTemplate}
                className="crm-button crm-button-outline border-green-300 text-green-700 hover:bg-green-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>

            {/* File Upload Section */}
            <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-blue-800">Upload CSV File</h4>
                  <p className="text-sm text-blue-600">Select a CSV file from your computer</p>
                </div>
                {csvFile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFile}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
              
              <div className="space-y-3">
                <div 
                  className="relative"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id="csv-file-input"
                  />
                  <label
                    htmlFor="csv-file-input"
                    className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                      csvFile 
                        ? 'border-green-300 bg-green-50 text-green-700' 
                        : 'border-blue-300 bg-blue-50 text-blue-700 hover:border-blue-400 hover:bg-blue-100'
                    }`}
                  >
                    {csvFile ? (
                      <>
                        <CheckCircle className="h-6 w-6 mb-1" />
                        <span className="font-medium">{csvFile.name}</span>
                        <span className="text-sm">({(csvFile.size / 1024).toFixed(1)} KB)</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-6 w-6 mb-1" />
                        <span className="font-medium">Click to select CSV file</span>
                        <span className="text-sm">or drag and drop here</span>
                      </>
                    )}
                  </label>
                </div>
                
                {csvFile && (
                  <div className="text-sm text-blue-700 bg-blue-100 p-2 rounded">
                    ✅ File loaded successfully. You can now upload the leads or edit the data below.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Textarea
                placeholder="Paste your CSV data here or upload a file above...

Format: client_name, client_phone, client_phone2, client_phone3, client_email, client_job_title, platform, stage

Example:
Ahmed Hassan, +201012345678, +201012345679, , ahmed@example.com, Sales Manager, Facebook, New Lead
Sarah Mohamed, +201123456789, , +201123456780, sarah@example.com, Marketing Director, Google, Potential
Omar Ali, +201234567890, , , omar@example.com, Business Owner, TikTok, Hot Case"
                value={bulkLeadsText}
                onChange={(e) => setBulkLeadsText(e.target.value)}
                rows={12}
                className="font-mono text-sm crm-input"
              />
              
              {/* CSV Preview */}
              {bulkLeadsText && (
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-semibold text-gray-800">Preview</h5>
                    <span className="text-sm text-gray-600">
                      {parseBulkLeads(bulkLeadsText).length} leads detected
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {parseBulkLeads(bulkLeadsText).slice(0, 3).map((lead, index) => (
                      <div key={index} className="py-1 border-b border-gray-200 last:border-b-0">
                        <strong>{lead.client_name}</strong> - {lead.client_phone}
                        {lead.client_job_title && ` (${lead.client_job_title})`}
                      </div>
                    ))}
                    {parseBulkLeads(bulkLeadsText).length > 3 && (
                      <div className="py-1 text-gray-500">
                        ... and {parseBulkLeads(bulkLeadsText).length - 3} more leads
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <h5 className="font-semibold text-blue-800 mb-2">Required Fields</h5>
                <div className="text-sm text-blue-700 space-y-1">
                  <div><strong>client_name:</strong> Full name of the client</div>
                  <div><strong>client_phone:</strong> Primary phone (+20xxxxxxxxx)</div>
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                <h5 className="font-semibold text-purple-800 mb-2">Optional Fields</h5>
                <div className="text-sm text-purple-700 space-y-1">
                  <div><strong>client_phone2:</strong> Secondary phone number</div>
                  <div><strong>client_phone3:</strong> Third phone number</div>
                  <div><strong>client_email:</strong> Email address</div>
                  <div><strong>client_job_title:</strong> Job title/profession</div>
                  <div><strong>platform:</strong> Facebook, Google, TikTok, Other</div>
                  <div><strong>stage:</strong> New Lead, Potential, Hot Case, etc.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Button */}
      <div className="card-modern p-6 text-center">
        {/* Upload Summary */}
        {(uploadMode === 'bulk' && bulkLeadsText) && (
          <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
            <div className="text-sm text-blue-800">
              <strong>Ready to Upload:</strong> {parseBulkLeads(bulkLeadsText).length} leads
              {csvFile && (
                <span className="ml-2">from {csvFile.name}</span>
              )}
            </div>
          </div>
        )}
        
        {(uploadMode === 'manual') && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200">
            <div className="text-sm text-green-800">
              <strong>Ready to Upload:</strong> {leadsList.filter(lead => lead.client_name && lead.client_phone).length} leads
            </div>
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={loading || !selectedProjectId}
          className="w-full h-14 text-lg crm-button crm-button-primary"
          size="lg"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              Uploading Leads...
            </>
          ) : (
            <>
              <Upload className="h-5 w-5 mr-3" />
              Upload Leads to Project
            </>
          )}
        </Button>
      </div>

      {/* Upload Result */}
      {uploadResult && (
        <div className={`card-modern p-6 ${uploadResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-xl ${uploadResult.success ? 'bg-green-100' : 'bg-red-100'}`}>
              {uploadResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-semibold">Upload Result</h3>
              <p className={`text-sm ${uploadResult.success ? 'text-green-600' : 'text-red-600'}`}>
                {uploadResult.success ? 'Upload completed successfully' : 'Upload failed'}
              </p>
            </div>
          </div>
          
          {uploadResult.success ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-white rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">{uploadResult.uploaded_count}</div>
                <div className="text-xs text-muted-foreground">Uploaded</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">{uploadResult.total_attempted}</div>
                <div className="text-xs text-muted-foreground">Attempted</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-orange-200">
                <div className="text-2xl font-bold text-orange-600">{uploadResult.skipped}</div>
                <div className="text-xs text-muted-foreground">Skipped</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-purple-200">
                <div className="text-lg font-bold text-purple-600">{selectedProject?.name}</div>
                <div className="text-xs text-muted-foreground">Project</div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-white rounded-lg border border-red-200">
              <p className="font-medium text-red-600">❌ Upload failed</p>
              <p className="text-sm text-red-500">{uploadResult.error}</p>
            </div>
          )}
        </div>
      )}

      {/* Usage Instructions */}
      <div className="card-modern p-6">
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-foreground mb-2">How It Works</h3>
          <p className="text-muted-foreground">Follow these steps to upload leads and manage your inventory</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
              <span className="text-sm font-medium">Select a project from the dropdown</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
              <span className="text-sm font-medium">Choose manual entry or bulk upload method</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-purple-50 to-violet-50">
              <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
              <span className="text-sm font-medium">Add lead information (name and phone required)</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50">
              <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-sm">4</div>
              <span className="text-sm font-medium">Click upload - project's available_leads increases</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50">
              <div className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold text-sm">5</div>
              <span className="text-sm font-medium">Projects with leads appear in the shop</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-pink-50 to-rose-50">
              <div className="w-8 h-8 bg-pink-600 text-white rounded-full flex items-center justify-center font-bold text-sm">6</div>
              <span className="text-sm font-medium">Purchases automatically decrease available_leads</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadUpload;
