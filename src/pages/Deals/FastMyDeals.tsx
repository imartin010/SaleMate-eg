import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/auth';
import { supabase } from '../../lib/supabaseClient';
import { 
  Plus, 
  FileText, 
  Calendar, 
  DollarSign, 
  Building, 
  User, 
  Phone, 
  Mail,
  CheckCircle,
  Clock,
  AlertCircle,
  Edit,
  Trash2,
  Eye,
  Filter,
  Search,
  Download,
  Upload,
  Briefcase,
  TrendingUp,
  Award
} from 'lucide-react';

interface Deal {
  id: string;
  deal_type: 'EOI' | 'Reservation' | 'Contract';
  project_name: string;
  developer_name: string;
  client_name: string;
  unit_code: string;
  developer_sales_name: string;
  developer_sales_phone: string;
  deal_value: number;
  downpayment_percentage: number;
  payment_plan_years: number;
  attachments: string[];
  status: 'Reservation' | 'Contracted' | 'Collected' | 'Ready to payout';
  created_at: string;
  updated_at: string;
  user_id: string;
}

const FastMyDeals: React.FC = () => {
  const { user } = useAuthStore();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    deal_type: 'EOI' as const,
    project_name: '',
    developer_name: '',
    client_name: '',
    unit_code: '',
    developer_sales_name: '',
    developer_sales_phone: '',
    deal_value: '',
    downpayment_percentage: '',
    payment_plan_years: '',
    attachments: [] as File[]
  });

  useEffect(() => {
    if (user) {
      fetchDeals();
    }
  }, [user]);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeals(data || []);
    } catch (error) {
      console.error('Error fetching deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Creating deal with data:', formData);
    
    try {
      setLoading(true);

      // Upload attachments if any (temporarily disabled to fix storage issues)
      const attachmentUrls: string[] = [];
      if (formData.attachments.length > 0) {
        console.log('File uploads temporarily disabled - attachments will be added later');
        // TODO: Re-enable file uploads after fixing storage policies
        // for (const file of formData.attachments) {
        //   const fileName = `${Date.now()}-${file.name}`;
        //   const { data, error } = await supabase.storage
        //     .from('deal-attachments')
        //     .upload(fileName, file);

        //   if (error) {
        //     console.error('Attachment upload error:', error);
        //     throw error;
        //   }
        //   attachmentUrls.push(data.path);
        // }
      }

      console.log('Inserting deal into database...');
      const dealData = {
        deal_type: formData.deal_type,
        project_name: formData.project_name,
        developer_name: formData.developer_name,
        client_name: formData.client_name,
        unit_code: formData.unit_code,
        developer_sales_name: formData.developer_sales_name,
        developer_sales_phone: formData.developer_sales_phone,
        deal_value: parseFloat(formData.deal_value),
        downpayment_percentage: parseFloat(formData.downpayment_percentage),
        payment_plan_years: parseInt(formData.payment_plan_years),
        attachments: attachmentUrls,
        status: 'Reservation',
        user_id: user?.id
      };

      console.log('Deal data to insert:', dealData);

      const { data, error } = await supabase
        .from('deals')
        .insert(dealData)
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log('Deal created successfully:', data);
      setDeals([data, ...deals]);
      setShowCreateModal(false);
      resetForm();
      setFormSuccess('Deal created successfully!');
      setFormError(null);
      
    } catch (error) {
      console.error('Error creating deal:', error);
      setFormError(`Error creating deal: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setFormSuccess(null);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      deal_type: 'EOI',
      project_name: '',
      developer_name: '',
      client_name: '',
      unit_code: '',
      developer_sales_name: '',
      developer_sales_phone: '',
      deal_value: '',
      downpayment_percentage: '',
      payment_plan_years: '',
      attachments: []
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }));
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Reservation': return 'bg-blue-100 text-blue-800';
      case 'Contracted': return 'bg-yellow-100 text-yellow-800';
      case 'Collected': return 'bg-green-100 text-green-800';
      case 'Ready to payout': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Reservation': return <Clock className="h-4 w-4" />;
      case 'Contracted': return <FileText className="h-4 w-4" />;
      case 'Collected': return <CheckCircle className="h-4 w-4" />;
      case 'Ready to payout': return <Award className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const filteredDeals = deals.filter(deal => {
    const matchesSearch = 
      deal.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.unit_code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || deal.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: deals.length,
    reservation: deals.filter(d => d.status === 'Reservation').length,
    contracted: deals.filter(d => d.status === 'Contracted').length,
    collected: deals.filter(d => d.status === 'Collected').length,
    readyToPayout: deals.filter(d => d.status === 'Ready to payout').length,
    totalValue: deals.reduce((sum, deal) => sum + deal.deal_value, 0)
  };

  if (loading && deals.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your deals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Deals</h1>
            <p className="text-gray-600">Manage and track your real estate deals</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Create New Deal
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Briefcase className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-600">Total Deals</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.reservation}</p>
                <p className="text-sm text-gray-600">Reservation</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <FileText className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.contracted}</p>
                <p className="text-sm text-gray-600">Contracted</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.collected}</p>
                <p className="text-sm text-gray-600">Collected</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Award className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.readyToPayout}</p>
                <p className="text-sm text-gray-600">Ready to Payout</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">${stats.totalValue.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Total Value</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search deals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="Reservation">Reservation</option>
            <option value="Contracted">Contracted</option>
            <option value="Collected">Collected</option>
            <option value="Ready to payout">Ready to Payout</option>
          </select>
        </div>
      </div>

      {/* Deals Grid */}
      {filteredDeals.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No deals found</h3>
          <p className="text-gray-600 mb-6">
            {deals.length === 0 
              ? "You haven't created any deals yet. Start by creating your first deal!"
              : "No deals match your current filters."
            }
          </p>
          {deals.length === 0 && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Create Your First Deal
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDeals.map((deal) => (
            <div key={deal.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{deal.project_name}</h3>
                    <p className="text-sm text-gray-600">{deal.developer_name}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(deal.status)}`}>
                    {getStatusIcon(deal.status)}
                    {deal.status}
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Client: {deal.client_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Building className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Unit: {deal.unit_code}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Value: ${deal.deal_value.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Created: {new Date(deal.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedDeal(deal);
                      setShowViewModal(true);
                    }}
                    className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Deal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Create New Deal</h2>
                                 <button
                   onClick={() => {
                     setShowCreateModal(false);
                     setFormError(null);
                     setFormSuccess(null);
                   }}
                   className="text-gray-400 hover:text-gray-600"
                 >
                   ✕
                 </button>
              </div>
            </div>

            <form onSubmit={handleCreateDeal} className="p-6 space-y-6">
              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <span className="text-red-800">{formError}</span>
                  </div>
                </div>
              )}
              {formSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-green-800">{formSuccess}</span>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Deal Type</label>
                  <select
                    value={formData.deal_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, deal_type: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="EOI">EOI</option>
                    <option value="Reservation">Reservation</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
                  <input
                    type="text"
                    value={formData.project_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, project_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Developer Name</label>
                  <input
                    type="text"
                    value={formData.developer_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, developer_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Client Name</label>
                  <input
                    type="text"
                    value={formData.client_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, client_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Unit Code</label>
                  <input
                    type="text"
                    value={formData.unit_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit_code: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Developer Sales Name</label>
                  <input
                    type="text"
                    value={formData.developer_sales_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, developer_sales_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Developer Sales Phone</label>
                  <input
                    type="tel"
                    value={formData.developer_sales_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, developer_sales_phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Deal Value ($)</label>
                  <input
                    type="number"
                    value={formData.deal_value}
                    onChange={(e) => setFormData(prev => ({ ...prev, deal_value: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Downpayment (%)</label>
                  <input
                    type="number"
                    value={formData.downpayment_percentage}
                    onChange={(e) => setFormData(prev => ({ ...prev, downpayment_percentage: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Plan (Years)</label>
                  <input
                    type="number"
                    value={formData.payment_plan_years}
                    onChange={(e) => setFormData(prev => ({ ...prev, payment_plan_years: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Attachments</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer text-blue-600 hover:text-blue-700">
                    Click to upload files
                  </label>
                  <p className="text-sm text-gray-500 mt-1">or drag and drop</p>
                </div>
                {formData.attachments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {formData.attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Deal Modal */}
      {showViewModal && selectedDeal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Deal Details</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deal Type</label>
                  <p className="text-gray-900">{selectedDeal.deal_type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${getStatusColor(selectedDeal.status)}`}>
                    {getStatusIcon(selectedDeal.status)}
                    {selectedDeal.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                  <p className="text-gray-900">{selectedDeal.project_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Developer Name</label>
                  <p className="text-gray-900">{selectedDeal.developer_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                  <p className="text-gray-900">{selectedDeal.client_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Code</label>
                  <p className="text-gray-900">{selectedDeal.unit_code}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Developer Sales Name</label>
                  <p className="text-gray-900">{selectedDeal.developer_sales_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Developer Sales Phone</label>
                  <p className="text-gray-900">{selectedDeal.developer_sales_phone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deal Value</label>
                  <p className="text-gray-900">${selectedDeal.deal_value.toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Downpayment</label>
                  <p className="text-gray-900">{selectedDeal.downpayment_percentage}%</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Plan</label>
                  <p className="text-gray-900">{selectedDeal.payment_plan_years} years</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                  <p className="text-gray-900">{new Date(selectedDeal.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {selectedDeal.attachments.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Attachments</label>
                  <div className="space-y-2">
                    {selectedDeal.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{attachment}</span>
                        <button className="ml-auto text-blue-600 hover:text-blue-700">
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FastMyDeals;
