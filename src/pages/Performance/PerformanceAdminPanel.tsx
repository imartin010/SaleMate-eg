import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Building2, 
  Settings, 
  Users, 
  DollarSign, 
  FileText,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Calendar,
  LogOut
} from 'lucide-react';
import { 
  usePerformanceFranchises,
  usePerformanceCommissionCuts,
  useUpsertCommissionCut,
  useCreateCommissionScheme,
  usePerformanceCommissionSchemes,
} from '../../hooks/performance/usePerformanceData';
import { useProjects } from '../../hooks/performance/useProjects';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../features/auth';
import type { CommissionRole } from '../../types/performance';

// Component to list all projects from coldwell_banker_inventory
const CBProjectsList: React.FC = () => {
  const [projects, setProjects] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');

  React.useEffect(() => {
    const loadProjects = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('coldwell_banker_inventory')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (fetchError) throw fetchError;
        if (data) setProjects(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load projects');
      } finally {
        setLoading(false);
      }
    };
    loadProjects();
  }, []);

  const handleUpdateProject = async (projectId: number, commissionRate: number, payoutMonths: number) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error: updateError } = await supabase
        .from('coldwell_banker_inventory')
        .update({
          commission_rate: commissionRate,
          developer_payout_months: payoutMonths,
        })
        .eq('id', projectId);
      
      if (updateError) throw updateError;
      
      setSuccess('Project updated successfully!');
      
      // Refresh projects list
      const { data, error: fetchError } = await supabase
        .from('coldwell_banker_inventory')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!fetchError && data) setProjects(data);
    } catch (err: any) {
      setError(err.message || 'Failed to update project');
    } finally {
      setLoading(false);
    }
  };

  if (loading && projects.length === 0) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 p-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 p-4 sm:p-8">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">All Projects</h2>
      {error && (
        <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-2xl text-xs sm:text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-2xl text-xs sm:text-sm text-green-700">
          {success}
        </div>
      )}
      <div className="space-y-3 sm:space-y-4">
        {projects.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
            <p className="text-sm sm:text-base text-gray-500">No projects found</p>
            <p className="text-xs sm:text-sm text-gray-400 mt-2">Add a project to get started</p>
          </div>
        ) : (
          projects.map((project) => (
            <div key={project.id} className="p-3 sm:p-4 border-2 border-gray-200 rounded-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                    {project.compound}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 truncate">
                    Developer: {project.developer}
                  </p>
                  {project.area && (
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      Area: {project.area}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Commission Rate & Payout Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 sm:p-3 mb-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs">
                  <div className="flex items-start gap-2">
                    <DollarSign className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-gray-900">Commission Rate:</span>
                      <span className="text-gray-600 ml-1">% of transaction amount</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-gray-900">Payout Time:</span>
                      <span className="text-gray-600 ml-1">Months after contract</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Input Fields */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2 sm:gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Commission Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={project.commission_rate}
                    className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm"
                    placeholder="Rate %"
                    id={`rate-${project.id}`}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Payout (Months)</label>
                  <input
                    type="number"
                    defaultValue={project.developer_payout_months}
                    className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm"
                    placeholder="Months"
                    id={`months-${project.id}`}
                  />
                </div>
                <div className="pt-0 sm:pt-5">
                  <button
                    onClick={() => {
                      const rateInput = document.getElementById(`rate-${project.id}`) as HTMLInputElement;
                      const monthsInput = document.getElementById(`months-${project.id}`) as HTMLInputElement;
                      handleUpdateProject(
                        project.id,
                        parseFloat(rateInput.value) || project.commission_rate,
                        parseInt(monthsInput.value) || project.developer_payout_months
                      );
                    }}
                    disabled={loading}
                    className="w-full sm:w-auto p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                    title="Save changes"
                  >
                    <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const PerformanceAdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const signOut = useAuthStore((state) => state.signOut);
  const [activeTab, setActiveTab] = useState<'franchises' | 'taxes' | 'commission-cuts' | 'developers' | 'projects'>('franchises');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
      // signOut already handles redirect to '/'
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };
  
  // Franchise management
  const [franchiseForm, setFranchiseForm] = useState({
    name: '',
    slug: '',
    headcount: 0,
    owner_user_id: '',
    is_active: true,
  });
  
  // Tax rates
  const [taxRates, setTaxRates] = useState({
    tax_rate: 14,
    withholding_tax_rate: 5,
    income_tax_rate: 4,
  });
  
  // Commission cuts
  const { data: commissionCuts } = usePerformanceCommissionCuts();
  const upsertCommissionCut = useUpsertCommissionCut();
  const [commissionCutForm, setCommissionCutForm] = useState<Record<CommissionRole, number>>({
    sales_agent: 6000,
    team_leader: 0,
    sales_director: 0,
    head_of_sales: 0,
  });
  
  // Developers
  const [developerForm, setDeveloperForm] = useState({ name: '' });
  const [developers, setDevelopers] = useState<string[]>([]);
  const [showAddDeveloper, setShowAddDeveloper] = useState(false);
  
  // Projects
  const { data: projects } = useProjects();
  const { data: franchises } = usePerformanceFranchises();
  const { data: commissionSchemes } = usePerformanceCommissionSchemes(); // Get all schemes
  const createCommissionScheme = useCreateCommissionScheme();
  const [projectForm, setProjectForm] = useState({
    compound: '',
    developer: '',
    area: '',
    commission_rate: 3.5,
    developer_payout_months: 3,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [projectDetails, setProjectDetails] = useState<Record<number, { compound: string; developer: string }>>({});

  // Load unique developers from coldwell_banker_inventory
  React.useEffect(() => {
    const loadDevelopers = async () => {
      try {
        const { data, error } = await supabase
          .from('coldwell_banker_inventory')
          .select('developer')
          .not('developer', 'is', null);
        
        if (error) throw error;
        
        if (data) {
          const uniqueDevelopers = [...new Set(data.map(p => p.developer).filter(Boolean))] as string[];
          setDevelopers(uniqueDevelopers);
        }
      } catch (err) {
        console.error('Failed to load developers:', err);
      }
    };
    
    loadDevelopers();
  }, []);

  // Load project details for commission schemes
  React.useEffect(() => {
    const loadProjectDetails = async () => {
      if (!commissionSchemes || commissionSchemes.length === 0) return;
      
      const projectIds = [...new Set(commissionSchemes.map(s => s.project_id))];
      if (projectIds.length === 0) return;

      try {
        const { data, error } = await supabase
          .from('salemate-inventory')
          .select('id, compound, developer')
          .in('id', projectIds);

        if (error) throw error;

        const detailsMap: Record<number, { compound: string; developer: string }> = {};
        
        data?.forEach((item: any) => {
          // Extract compound name
          let compoundName = 'Unknown';
          if (item.compound) {
            if (typeof item.compound === 'string') {
              try {
                const compoundObj = JSON.parse(item.compound.replace(/'/g, '"'));
                compoundName = compoundObj?.name || item.compound;
              } catch {
                compoundName = item.compound;
              }
            } else if (typeof item.compound === 'object') {
              compoundName = item.compound?.name || 'Unknown';
            }
          }

          // Extract developer name
          let developerName = 'N/A';
          if (item.developer) {
            if (typeof item.developer === 'string') {
              try {
                const developerObj = JSON.parse(item.developer.replace(/'/g, '"'));
                developerName = developerObj?.name || item.developer;
              } catch {
                developerName = item.developer;
              }
            } else if (typeof item.developer === 'object') {
              developerName = item.developer?.name || 'N/A';
            }
          }

          detailsMap[item.id] = { compound: compoundName, developer: developerName };
        });

        setProjectDetails(detailsMap);
      } catch (err) {
        console.error('Failed to load project details:', err);
      }
    };

    loadProjectDetails();
  }, [commissionSchemes]);

  const handleCreateFranchise = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const slug = franchiseForm.slug || franchiseForm.name.toLowerCase().replace(/\s+/g, '-');
      
      const { data, error: insertError } = await supabase
        .from('performance_franchises')
        .insert({
          name: franchiseForm.name,
          slug,
          headcount: franchiseForm.headcount,
          owner_user_id: franchiseForm.owner_user_id || null,
          is_active: franchiseForm.is_active,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setSuccess('Franchise created successfully!');
      setFranchiseForm({ name: '', slug: '', headcount: 0, owner_user_id: '', is_active: true });
    } catch (err: any) {
      setError(err.message || 'Failed to create franchise');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTaxRates = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Tax rates are currently hardcoded in the transaction modal
      // In a real implementation, you'd store these in a settings table
      setSuccess('Tax rates saved! (Note: These are currently hardcoded in the transaction calculation)');
    } catch (err: any) {
      setError(err.message || 'Failed to save tax rates');
    } finally {
      setLoading(false);
    }
  };

  // Load existing commission cuts (use first franchise's cuts as default, or any franchise if they're all the same)
  React.useEffect(() => {
    if (commissionCuts && commissionCuts.length > 0 && franchises && franchises.length > 0) {
      // Get cuts from the first franchise
      const firstFranchiseId = franchises[0].id;
      const cutsForFirstFranchise = commissionCuts.filter(c => c.franchise_id === firstFranchiseId);
      
      const formData: Record<CommissionRole, number> = {
        sales_agent: 6000,
        team_leader: 0,
        sales_director: 0,
        head_of_sales: 0,
      };
      
      // Load values from the first franchise
      cutsForFirstFranchise.forEach(cut => {
        if (cut.role === 'sales_agent' || cut.role === 'team_leader' || cut.role === 'sales_director' || cut.role === 'head_of_sales') {
          formData[cut.role] = cut.cut_per_million;
        }
      });
      
      // Only update if we have actual values (not all zeros)
      if (formData.sales_agent > 0 || formData.team_leader > 0 || formData.sales_director > 0 || formData.head_of_sales > 0) {
        setCommissionCutForm(formData);
      }
    } else if (commissionCuts && commissionCuts.length === 0 && franchises && franchises.length > 0) {
      // No commission cuts exist yet, initialize with default values
      setCommissionCutForm({
        sales_agent: 6000,
        team_leader: 0,
        sales_director: 0,
        head_of_sales: 0,
      });
    }
  }, [commissionCuts, franchises]);

  const handleSaveAllCommissionCuts = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!franchises || franchises.length === 0) {
        setError('No franchises found. Please add a franchise first.');
        setLoading(false);
        return;
      }

      // Prepare all commission cuts to save
      const cutsToSave: Array<{ franchise_id: string; role: CommissionRole; cut_per_million: number }> = [];
      
      for (const franchise of franchises) {
        cutsToSave.push(
          { franchise_id: franchise.id, role: 'sales_agent', cut_per_million: commissionCutForm.sales_agent },
          { franchise_id: franchise.id, role: 'team_leader', cut_per_million: commissionCutForm.team_leader },
          { franchise_id: franchise.id, role: 'sales_director', cut_per_million: commissionCutForm.sales_director },
          { franchise_id: franchise.id, role: 'head_of_sales', cut_per_million: commissionCutForm.head_of_sales }
        );
      }

      // Save all cuts using bulk upsert
      const { data, error: upsertError } = await supabase
        .from('performance_commission_cuts')
        .upsert(cutsToSave, { onConflict: 'franchise_id,role' })
        .select();

      if (upsertError) throw upsertError;

      // Invalidate and refetch commission cuts data
      queryClient.invalidateQueries({ queryKey: ['performance-commission-cuts'] });
      queryClient.invalidateQueries({ queryKey: ['performance-analytics'] });
      // Force refetch to ensure UI updates immediately
      queryClient.refetchQueries({ queryKey: ['performance-commission-cuts'] });
      queryClient.refetchQueries({ queryKey: ['performance-analytics'] });

      setSuccess(`Commission cuts saved successfully for all ${franchises.length} franchise(s)!`);
      
    } catch (err: any) {
      setError(err.message || 'Failed to save commission cuts');
      console.error('Error saving commission cuts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDeveloper = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Create a minimal project entry in coldwell_banker_inventory with just the developer name
      // This ensures the developer appears in the system
      const { error: insertError } = await supabase
        .from('coldwell_banker_inventory')
        .insert({
          compound: `Developer Entry: ${developerForm.name}`,
          developer: developerForm.name,
          area: 'N/A',
        });

      if (insertError) throw insertError;

      setSuccess(`Developer "${developerForm.name}" added successfully!`);
      setDeveloperForm({ name: '' });
      setShowAddDeveloper(false);
      
      // Refresh developers list by fetching from coldwell_banker_inventory
      const { data: cbProjects } = await supabase
        .from('coldwell_banker_inventory')
        .select('developer')
        .not('developer', 'is', null);
      
      if (cbProjects) {
        const uniqueDevelopers = [...new Set(cbProjects.map(p => p.developer).filter(Boolean))] as string[];
        setDevelopers(uniqueDevelopers);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add developer');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Create project in coldwell_banker_inventory
      const { data: projectData, error: projectError } = await supabase
        .from('coldwell_banker_inventory')
        .insert({
          compound: projectForm.compound,
          developer: projectForm.developer,
          area: projectForm.area || null,
          commission_rate: projectForm.commission_rate,
          developer_payout_months: projectForm.developer_payout_months,
        })
        .select()
        .single();

      if (projectError) throw projectError;

      setSuccess('Project created successfully!');
      setProjectForm({
        compound: '',
        developer: '',
        area: '',
        commission_rate: 3.5,
        developer_payout_months: 3,
      });
      
      // Refresh developers list
      const { data: cbProjects } = await supabase
        .from('coldwell_banker_inventory')
        .select('developer')
        .not('developer', 'is', null);
      
      if (cbProjects) {
        const uniqueDevelopers = [...new Set(cbProjects.map(p => p.developer).filter(Boolean))] as string[];
        setDevelopers(uniqueDevelopers);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => navigate('/dashboard')}
                className="group flex items-center justify-center w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-2xl transition-all duration-300 hover:scale-110"
              >
                <ArrowLeft className="w-6 h-6 text-white" />
              </button>
              <div>
                <h1 className="text-4xl font-bold text-white tracking-tight">Admin Panel</h1>
                <p className="mt-2 text-lg text-blue-100 font-medium">
                  Manage Franchises, Taxes, Commission Cuts, Developers & Projects
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center space-x-2 px-5 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-xl transition-all duration-300 text-sm font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
              <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-2 py-2 sm:py-4 overflow-x-auto scrollbar-hide -mx-4 sm:mx-0 px-4 sm:px-0">
            {[
              { id: 'franchises', label: 'Franchises', icon: Building2 },
              { id: 'taxes', label: 'Tax Rates', icon: DollarSign },
              { id: 'commission-cuts', label: 'Commission Cuts', icon: Users },
              { id: 'developers', label: 'Developers', icon: FileText },
              { id: 'projects', label: 'Projects', icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`group relative px-3 sm:px-6 py-2 sm:py-3 rounded-2xl font-semibold text-xs sm:text-sm transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span className="flex items-center space-x-1 sm:space-x-2">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                  </span>
                  {activeTab === tab.id && (
                    <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-600 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Messages */}
        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-2xl text-xs sm:text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-2xl text-xs sm:text-sm text-green-700">
            {success}
          </div>
        )}

        {/* Franchises Tab */}
        {activeTab === 'franchises' && (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 p-4 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Add New Franchise</h2>
            <form onSubmit={handleCreateFranchise} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Franchise Name *</label>
                <input
                  type="text"
                  value={franchiseForm.name}
                  onChange={(e) => setFranchiseForm({ ...franchiseForm, name: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  required
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Slug (optional, auto-generated if empty)</label>
                <input
                  type="text"
                  value={franchiseForm.slug}
                  onChange={(e) => setFranchiseForm({ ...franchiseForm, slug: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="auto-generated"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Headcount *</label>
                <input
                  type="number"
                  value={franchiseForm.headcount}
                  onChange={(e) => setFranchiseForm({ ...franchiseForm, headcount: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  required
                  min="0"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Owner User ID (optional)</label>
                <input
                  type="text"
                  value={franchiseForm.owner_user_id}
                  onChange={(e) => setFranchiseForm({ ...franchiseForm, owner_user_id: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={franchiseForm.is_active}
                  onChange={(e) => setFranchiseForm({ ...franchiseForm, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm font-medium text-gray-700">Active</label>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-2xl hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 text-xs sm:text-sm"
              >
                {loading ? 'Creating...' : 'Create Franchise'}
              </button>
            </form>
          </div>
        )}

        {/* Tax Rates Tab */}
        {activeTab === 'taxes' && (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 p-4 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Tax Rates Configuration</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={taxRates.tax_rate}
                  onChange={(e) => setTaxRates({ ...taxRates, tax_rate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Withholding Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={taxRates.withholding_tax_rate}
                  onChange={(e) => setTaxRates({ ...taxRates, withholding_tax_rate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Income Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={taxRates.income_tax_rate}
                  onChange={(e) => setTaxRates({ ...taxRates, income_tax_rate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>
              <p className="text-sm text-gray-500">Total Tax Rate: {(taxRates.tax_rate + taxRates.withholding_tax_rate + taxRates.income_tax_rate).toFixed(2)}%</p>
              <button
                onClick={handleSaveTaxRates}
                disabled={loading}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-2xl hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 text-xs sm:text-sm"
              >
                {loading ? 'Saving...' : 'Save Tax Rates'}
              </button>
            </div>
          </div>
        )}

        {/* Commission Cuts Tab */}
        {activeTab === 'commission-cuts' && (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 p-4 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Commission Cuts per Million</h2>
            <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">
              These commission cuts will be applied to all franchises.
            </p>
            <div className="space-y-4 max-w-2xl">
              {(['sales_agent', 'team_leader', 'sales_director', 'head_of_sales'] as CommissionRole[]).map((role) => {
                const roleLabels: Record<CommissionRole, string> = {
                  team_leader: 'Team Leader',
                  sales_director: 'Sales Manager',
                  head_of_sales: 'Sales Director',
                  sales_agent: 'Sales Agent',
                  royalty: 'Royalty',
                };
                
                return (
                <div key={role} className="flex items-center gap-4">
                  <label className="w-40 text-sm font-medium text-gray-700">
                    {roleLabels[role]}:
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={commissionCutForm[role]}
                    onChange={(e) => setCommissionCutForm({
                      ...commissionCutForm,
                      [role]: parseFloat(e.target.value) || 0
                    })}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="EGP per million"
                  />
                </div>
              );
              })}
              <div className="pt-4">
                <button
                  onClick={handleSaveAllCommissionCuts}
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-2xl hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 flex items-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {loading ? 'Saving...' : 'Save Commission Cuts for All Franchises'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Developers Tab */}
        {activeTab === 'developers' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Add Developer Form */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 p-4 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Developers</h2>
                <button
                  onClick={() => setShowAddDeveloper(!showAddDeveloper)}
                  className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 text-xs sm:text-sm w-full sm:w-auto justify-center"
                >
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{showAddDeveloper ? 'Cancel' : 'Add New Developer'}</span>
                </button>
              </div>
              
              {showAddDeveloper && (
                <form onSubmit={handleAddDeveloper} className="mb-4 sm:mb-6 p-4 sm:p-6 bg-gray-50 rounded-2xl border-2 border-gray-200">
                  <div className="mb-3 sm:mb-4">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Developer Name *</label>
                    <input
                      type="text"
                      value={developerForm.name}
                      onChange={(e) => setDeveloperForm({ name: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                      placeholder="Enter developer name"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-2xl hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 text-xs sm:text-sm"
                  >
                    {loading ? 'Adding...' : 'Add Developer'}
                  </button>
                </form>
              )}
              
              <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">
                Developers are automatically extracted from existing projects in the Coldwell Banker inventory.
              </p>
            </div>

            {/* Developers List */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 p-4 sm:p-8">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">All Developers ({developers.length})</h3>
              {developers.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                  <p className="text-sm sm:text-base text-gray-500">No developers found</p>
                  <p className="text-xs sm:text-sm text-gray-400 mt-2">Add a developer or create a project to see developers here</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {developers.map((developer, index) => (
                    <div key={index} className="p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all">
                      <p className="text-sm sm:text-base font-medium text-gray-900 truncate">{developer}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Add Project Form */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 p-4 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Add New Project</h2>
              <form onSubmit={handleCreateProject} className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Compound Name *</label>
                    <input
                      type="text"
                      value={projectForm.compound}
                      onChange={(e) => setProjectForm({ ...projectForm, compound: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Developer *</label>
                    <select
                      value={projectForm.developer}
                      onChange={(e) => setProjectForm({ ...projectForm, developer: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                      required
                    >
                      <option value="">Select Developer</option>
                      {developers.map((developer, index) => (
                        <option key={index} value={developer}>{developer}</option>
                      ))}
                    </select>
                    {developers.length === 0 && (
                      <p className="mt-2 text-xs text-amber-600">
                        No developers available. Please add a developer first.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Area</label>
                    <input
                      type="text"
                      value={projectForm.area}
                      onChange={(e) => setProjectForm({ ...projectForm, area: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Commission Rate (%) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={projectForm.commission_rate}
                      onChange={(e) => setProjectForm({ ...projectForm, commission_rate: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Payout Time (Months) *</label>
                    <input
                      type="number"
                      value={projectForm.developer_payout_months}
                      onChange={(e) => setProjectForm({ ...projectForm, developer_payout_months: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                      required
                      min="1"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-2xl hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 text-xs sm:text-sm"
                >
                  {loading ? 'Creating...' : 'Create Project & Set Commission'}
                </button>
              </form>
            </div>

            {/* All Projects from coldwell_banker_inventory */}
            <CBProjectsList />
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceAdminPanel;

