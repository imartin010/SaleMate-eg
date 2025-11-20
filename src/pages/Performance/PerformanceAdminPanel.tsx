import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  X
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
import type { CommissionRole } from '../../types/performance';

const PerformanceAdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'franchises' | 'taxes' | 'commission-cuts' | 'developers' | 'projects'>('franchises');
  
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
  const [commissionCutForm, setCommissionCutForm] = useState<Record<CommissionRole, { franchise_id: string; cut_per_million: number }>>({
    team_leader: { franchise_id: '', cut_per_million: 0 },
    sales_director: { franchise_id: '', cut_per_million: 0 },
    head_of_sales: { franchise_id: '', cut_per_million: 0 },
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
    franchise_id: '',
    commission_rate: 3.5,
    developer_payout_months: 3,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load unique developers from projects
  React.useEffect(() => {
    if (projects) {
      const uniqueDevelopers = [...new Set(projects.map(p => {
        try {
          const dev = typeof p.developer === 'string' ? JSON.parse(p.developer) : p.developer;
          return typeof dev === 'object' && dev !== null ? dev.name || dev : dev;
        } catch {
          return p.developer;
        }
      }).filter(Boolean))] as string[];
      setDevelopers(uniqueDevelopers);
    }
  }, [projects]);

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

  const handleSaveCommissionCut = async (role: CommissionRole, franchiseId: string) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await upsertCommissionCut.mutateAsync({
        franchise_id: franchiseId,
        role,
        cut_per_million: commissionCutForm[role].cut_per_million,
      });

      setSuccess(`Commission cut for ${role} saved successfully!`);
    } catch (err: any) {
      setError(err.message || 'Failed to save commission cut');
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
      // Create a minimal project entry with just the developer name
      // This ensures the developer appears in the system
      const { error: insertError } = await supabase
        .from('salemate-inventory')
        .insert({
          compound: `Developer Entry: ${developerForm.name}`,
          developer: developerForm.name,
          area: 'N/A',
        });

      if (insertError) throw insertError;

      setSuccess(`Developer "${developerForm.name}" added successfully!`);
      setDeveloperForm({ name: '' });
      setShowAddDeveloper(false);
      
      // Refresh developers list
      if (projects) {
        const uniqueDevelopers = [...new Set(projects.map(p => {
          try {
            const dev = typeof p.developer === 'string' ? JSON.parse(p.developer) : p.developer;
            return typeof dev === 'object' && dev !== null ? dev.name || dev : dev;
          } catch {
            return p.developer;
          }
        }).filter(Boolean))] as string[];
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
      // First, create or find the project in salemate-inventory
      const { data: projectData, error: projectError } = await supabase
        .from('salemate-inventory')
        .insert({
          compound: projectForm.compound,
          developer: projectForm.developer,
          area: projectForm.area,
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Then create commission scheme for the franchise
      if (projectForm.franchise_id && projectData) {
        await createCommissionScheme.mutateAsync({
          franchise_id: projectForm.franchise_id,
          project_id: projectData.id,
          commission_rate: projectForm.commission_rate,
          developer_payout_months: projectForm.developer_payout_months,
        });
      }

      setSuccess('Project created and commission scheme set!');
      setProjectForm({
        compound: '',
        developer: '',
        area: '',
        franchise_id: '',
        commission_rate: 3.5,
        developer_payout_months: 3,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCommissionScheme = async (schemeId: string, commissionRate: number, payoutMonths: number) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error: updateError } = await supabase
        .from('performance_commission_schemes')
        .update({
          commission_rate: commissionRate,
          developer_payout_months: payoutMonths,
        })
        .eq('id', schemeId);

      if (updateError) throw updateError;

      setSuccess('Commission scheme updated successfully!');
      // Invalidate queries to refresh data
      window.location.reload(); // Simple refresh for now
    } catch (err: any) {
      setError(err.message || 'Failed to update commission scheme');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-2 py-4 overflow-x-auto">
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
                  className={`group relative px-6 py-3 rounded-2xl font-semibold text-sm transition-all duration-300 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
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
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl text-green-700">
            {success}
          </div>
        )}

        {/* Franchises Tab */}
        {activeTab === 'franchises' && (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Franchise</h2>
            <form onSubmit={handleCreateFranchise} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Franchise Name *</label>
                <input
                  type="text"
                  value={franchiseForm.name}
                  onChange={(e) => setFranchiseForm({ ...franchiseForm, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug (optional, auto-generated if empty)</label>
                <input
                  type="text"
                  value={franchiseForm.slug}
                  onChange={(e) => setFranchiseForm({ ...franchiseForm, slug: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="auto-generated"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Headcount *</label>
                <input
                  type="number"
                  value={franchiseForm.headcount}
                  onChange={(e) => setFranchiseForm({ ...franchiseForm, headcount: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Owner User ID (optional)</label>
                <input
                  type="text"
                  value={franchiseForm.owner_user_id}
                  onChange={(e) => setFranchiseForm({ ...franchiseForm, owner_user_id: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-2xl hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Franchise'}
              </button>
            </form>
          </div>
        )}

        {/* Tax Rates Tab */}
        {activeTab === 'taxes' && (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Tax Rates Configuration</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={taxRates.tax_rate}
                  onChange={(e) => setTaxRates({ ...taxRates, tax_rate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Withholding Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={taxRates.withholding_tax_rate}
                  onChange={(e) => setTaxRates({ ...taxRates, withholding_tax_rate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Income Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={taxRates.income_tax_rate}
                  onChange={(e) => setTaxRates({ ...taxRates, income_tax_rate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <p className="text-sm text-gray-500">Total Tax Rate: {(taxRates.tax_rate + taxRates.withholding_tax_rate + taxRates.income_tax_rate).toFixed(2)}%</p>
              <button
                onClick={handleSaveTaxRates}
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-2xl hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Tax Rates'}
              </button>
            </div>
          </div>
        )}

        {/* Commission Cuts Tab */}
        {activeTab === 'commission-cuts' && (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Commission Cuts per Million</h2>
            <div className="space-y-6">
              {franchises?.map((franchise) => (
                <div key={franchise.id} className="border-2 border-gray-200 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{franchise.name}</h3>
                  <div className="space-y-4">
                    {(['team_leader', 'sales_director', 'head_of_sales'] as CommissionRole[]).map((role) => {
                      const existingCut = commissionCuts?.find(c => c.franchise_id === franchise.id && c.role === role);
                      return (
                        <div key={role} className="flex items-center gap-4">
                          <label className="w-40 text-sm font-medium text-gray-700 capitalize">
                            {role.replace('_', ' ')}:
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            defaultValue={existingCut?.cut_per_million || 0}
                            onChange={(e) => setCommissionCutForm({
                              ...commissionCutForm,
                              [role]: { franchise_id: franchise.id, cut_per_million: parseFloat(e.target.value) || 0 }
                            })}
                            className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="EGP per million"
                          />
                          <button
                            onClick={() => handleSaveCommissionCut(role, franchise.id)}
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Developers Tab */}
        {activeTab === 'developers' && (
          <div className="space-y-6">
            {/* Add Developer Form */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Developers</h2>
                <button
                  onClick={() => setShowAddDeveloper(!showAddDeveloper)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Plus className="w-4 h-4" />
                  <span>{showAddDeveloper ? 'Cancel' : 'Add New Developer'}</span>
                </button>
              </div>
              
              {showAddDeveloper && (
                <form onSubmit={handleAddDeveloper} className="mb-6 p-6 bg-gray-50 rounded-2xl border-2 border-gray-200">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Developer Name *</label>
                    <input
                      type="text"
                      value={developerForm.name}
                      onChange={(e) => setDeveloperForm({ name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter developer name"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-2xl hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                  >
                    {loading ? 'Adding...' : 'Add Developer'}
                  </button>
                </form>
              )}
              
              <p className="text-sm text-gray-500 mb-6">
                Developers are automatically extracted from existing projects in the inventory.
              </p>
            </div>

            {/* Developers List */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">All Developers ({developers.length})</h3>
              {developers.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No developers found</p>
                  <p className="text-sm text-gray-400 mt-2">Add a developer or create a project to see developers here</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {developers.map((developer, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all">
                      <p className="font-medium text-gray-900">{developer}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            {/* Add Project Form */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Project</h2>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Compound Name *</label>
                    <input
                      type="text"
                      value={projectForm.compound}
                      onChange={(e) => setProjectForm({ ...projectForm, compound: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Developer *</label>
                    <input
                      type="text"
                      value={projectForm.developer}
                      onChange={(e) => setProjectForm({ ...projectForm, developer: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
                    <input
                      type="text"
                      value={projectForm.area}
                      onChange={(e) => setProjectForm({ ...projectForm, area: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Franchise *</label>
                    <select
                      value={projectForm.franchise_id}
                      onChange={(e) => setProjectForm({ ...projectForm, franchise_id: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Franchise</option>
                      {franchises?.map((f) => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate (%) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={projectForm.commission_rate}
                      onChange={(e) => setProjectForm({ ...projectForm, commission_rate: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payout Time (Months) *</label>
                    <input
                      type="number"
                      value={projectForm.developer_payout_months}
                      onChange={(e) => setProjectForm({ ...projectForm, developer_payout_months: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      min="1"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-2xl hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Project & Set Commission'}
                </button>
              </form>
            </div>

            {/* Existing Projects & Commission Schemes */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Existing Projects & Commission Schemes</h2>
              <div className="space-y-4">
                {commissionSchemes?.map((scheme) => {
                  const project = projects?.find(p => p.id === scheme.project_id);
                  const franchise = franchises?.find(f => f.id === scheme.franchise_id);
                  return (
                    <div key={scheme.id} className="p-4 border-2 border-gray-200 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {project?.compound || `Project ID: ${scheme.project_id}`}
                          </p>
                          <p className="text-sm text-gray-600">
                            Developer: {project?.developer || 'N/A'} | Franchise: {franchise?.name || 'N/A'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.01"
                            defaultValue={scheme.commission_rate}
                            className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-sm"
                            placeholder="Rate %"
                            id={`rate-${scheme.id}`}
                          />
                          <input
                            type="number"
                            defaultValue={scheme.developer_payout_months}
                            className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-sm"
                            placeholder="Months"
                            id={`months-${scheme.id}`}
                          />
                          <button
                            onClick={() => {
                              const rateInput = document.getElementById(`rate-${scheme.id}`) as HTMLInputElement;
                              const monthsInput = document.getElementById(`months-${scheme.id}`) as HTMLInputElement;
                              handleUpdateCommissionScheme(
                                scheme.id,
                                parseFloat(rateInput.value) || scheme.commission_rate,
                                parseInt(monthsInput.value) || scheme.developer_payout_months
                              );
                            }}
                            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceAdminPanel;

