import React, { useState, useEffect } from 'react';
import { useDealsStore } from '../../store/deals';
import { Deal, DealType, DealStage, DealStatus } from '../../types/deals';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { PageTitle } from '../../components/common/PageTitle';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  FileText, 
  DollarSign,
  Calendar,
  Building,
  User,
  Sparkles,
  Activity
} from 'lucide-react';

const MyDeals: React.FC = () => {
  const { 
    deals, 
    loading, 
    error, 
    fetchDeals, 
    createDeal, 
    updateDeal, 
    deleteDeal,
    uploadFiles,
    filterDeals,
    clearError 
  } = useDealsStore();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    deal_type: '' as DealType | '',
    deal_stage: '' as DealStage | '',
    status: '' as DealStatus | ''
  });

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  const handleCreateDeal = async (formData: FormData) => {
    const dealData = {
      deal_type: formData.get('deal_type') as DealType,
      project_name: formData.get('project_name') as string,
      developer_name: formData.get('developer_name') as string,
      client_name: formData.get('client_name') as string,
      unit_code: formData.get('unit_code') as string,
      developer_sales_name: formData.get('developer_sales_name') as string,
      developer_sales_phone: formData.get('developer_sales_phone') as string,
      deal_value: parseFloat(formData.get('deal_value') as string),
      downpayment_percentage: parseFloat(formData.get('downpayment_percentage') as string),
      payment_plan_years: parseInt(formData.get('payment_plan_years') as string),
    };

    const result = await createDeal(dealData);
    if (result) {
      setIsCreateModalOpen(false);
      // Reset form
      (document.getElementById('create-deal-form') as HTMLFormElement)?.reset();
    }
  };

  const handleUpdateDeal = async (formData: FormData) => {
    if (!selectedDeal) return;

    const dealData = {
      deal_type: formData.get('deal_type') as DealType,
      project_name: formData.get('project_name') as string,
      developer_name: formData.get('developer_name') as string,
      client_name: formData.get('client_name') as string,
      unit_code: formData.get('unit_code') as string,
      developer_sales_name: formData.get('developer_sales_name') as string,
      developer_sales_phone: formData.get('developer_sales_phone') as string,
      deal_value: parseFloat(formData.get('deal_value') as string),
      downpayment_percentage: parseFloat(formData.get('downpayment_percentage') as string),
      payment_plan_years: parseInt(formData.get('payment_plan_years') as string),
    };

    const result = await updateDeal(selectedDeal.id, dealData);
    if (result) {
      setIsEditModalOpen(false);
      setSelectedDeal(null);
    }
  };

  const handleDeleteDeal = async (dealId: string) => {
    if (confirm('Are you sure you want to delete this deal?')) {
      await deleteDeal(dealId);
    }
  };

  const handleFileUpload = async (dealId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files);
    await uploadFiles(dealId, fileArray);
  };

  const filteredDeals = filterDeals({
    ...filters,
    project_name: searchTerm || undefined,
    developer_name: searchTerm || undefined,
    deal_type: filters.deal_type || undefined,
    deal_stage: filters.deal_stage || undefined,
    status: filters.status || undefined,
  });

  const getStatusColor = (status: DealStatus) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStageColor = (stage: DealStage) => {
    switch (stage) {
      case 'Ready to payout': return 'bg-purple-100 text-purple-800';
      case 'Collected': return 'bg-blue-100 text-blue-800';
      case 'Contracted': return 'bg-green-100 text-green-800';
      case 'Reservation': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && deals.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your deals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-4 mb-8">
          <PageTitle
            title="My Deals"
            subtitle="Track and manage your real estate deals with comprehensive tools and insights."
            icon={FileText}
            color="orange"
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="group">
            <div className="relative overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300 p-6 h-full group-hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                    <DollarSign className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">{deals.length}</div>
                    <p className="text-sm text-gray-600 font-medium">Total Deals</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="group">
            <div className="relative overflow-hidden rounded-2xl border border-green-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300 p-6 h-full group-hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                    <Building className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">
                      ${deals.reduce((sum, deal) => sum + deal.deal_value, 0).toLocaleString()}
                    </div>
                    <p className="text-sm text-gray-600 font-medium">Total Value</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="group">
            <div className="relative overflow-hidden rounded-2xl border border-purple-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300 p-6 h-full group-hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">
                      {deals.filter(d => d.status === 'pending').length}
                    </div>
                    <p className="text-sm text-gray-600 font-medium">Pending</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="group">
            <div className="relative overflow-hidden rounded-2xl border border-orange-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300 p-6 h-full group-hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                    <User className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">
                      {deals.filter(d => d.status === 'approved').length}
                    </div>
                    <p className="text-sm text-gray-600 font-medium">Approved</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Deal Management</h2>
              <p className="text-sm text-gray-600">Search, filter, and manage your deals</p>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search deals, projects, or developers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Select value={filters.deal_type} onValueChange={(value) => setFilters(prev => ({ ...prev, deal_type: value as DealType | '' }))}>
                <SelectTrigger className="w-40 rounded-xl border-gray-200">
                  <SelectValue placeholder="Deal Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="EOI">EOI</SelectItem>
                  <SelectItem value="Reservation">Reservation</SelectItem>
                  <SelectItem value="Contract">Contract</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.deal_stage} onValueChange={(value) => setFilters(prev => ({ ...prev, deal_stage: value as DealStage | '' }))}>
                <SelectTrigger className="w-40 rounded-xl border-gray-200">
                  <SelectValue placeholder="Deal Stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Stages</SelectItem>
                  <SelectItem value="Reservation">Reservation</SelectItem>
                  <SelectItem value="Contracted">Contracted</SelectItem>
                  <SelectItem value="Collected">Collected</SelectItem>
                  <SelectItem value="Ready to payout">Ready to payout</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as DealStatus | '' }))}>
                <SelectTrigger className="w-40 rounded-xl border-gray-200">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl hover:shadow-lg transition-all duration-300"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Deal
              </Button>

              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Deal</DialogTitle>
                  </DialogHeader>
                  <form id="create-deal-form" onSubmit={(e) => {
                    e.preventDefault();
                    handleCreateDeal(new FormData(e.currentTarget));
                  }} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="deal_type">Deal Type *</Label>
                        <Select name="deal_type" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select deal type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="EOI">EOI</SelectItem>
                            <SelectItem value="Reservation">Reservation</SelectItem>
                            <SelectItem value="Contract">Contract</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="project_name">Project Name *</Label>
                        <Input name="project_name" required />
                      </div>

                      <div>
                        <Label htmlFor="developer_name">Developer Name *</Label>
                        <Input name="developer_name" required />
                      </div>

                      <div>
                        <Label htmlFor="client_name">Client Name *</Label>
                        <Input name="client_name" required />
                      </div>

                      <div>
                        <Label htmlFor="unit_code">Unit Code *</Label>
                        <Input name="unit_code" required />
                      </div>

                      <div>
                        <Label htmlFor="developer_sales_name">Developer Sales Name *</Label>
                        <Input name="developer_sales_name" required />
                      </div>

                      <div>
                        <Label htmlFor="developer_sales_phone">Developer Sales Phone *</Label>
                        <Input name="developer_sales_phone" required />
                      </div>

                      <div>
                        <Label htmlFor="deal_value">Deal Value *</Label>
                        <Input name="deal_value" type="number" step="0.01" required />
                      </div>

                      <div>
                        <Label htmlFor="downpayment_percentage">Downpayment % *</Label>
                        <Input name="downpayment_percentage" type="number" step="0.01" required />
                      </div>

                      <div>
                        <Label htmlFor="payment_plan_years">Payment Plan (Years) *</Label>
                        <Input name="payment_plan_years" type="number" required />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">Create Deal</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
            <div className="flex justify-between items-center">
              <span className="font-medium">{error}</span>
              <Button variant="ghost" size="sm" onClick={clearError} className="text-red-600 hover:text-red-800">×</Button>
            </div>
          </div>
        )}

        {/* Deals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDeals.map((deal) => (
            <div key={deal.id} className="group">
              <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300 h-full group-hover:scale-[1.02]">
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{deal.project_name}</h3>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                          {deal.deal_type}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStageColor(deal.deal_stage)}`}>
                          {deal.deal_stage}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(deal.status)}`}>
                          {deal.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedDeal(deal);
                          setIsEditModalOpen(true);
                        }}
                        className="text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDeal(deal.id)}
                        className="text-gray-600 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Developer:</span>
                        <p className="font-medium text-gray-900">{deal.developer_name}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Client:</span>
                        <p className="font-medium text-gray-900">{deal.client_name}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Unit Code:</span>
                        <p className="font-medium text-gray-900">{deal.unit_code}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Value:</span>
                        <p className="font-bold text-green-600">${deal.deal_value.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-500">Sales Contact:</span>
                        <span className="font-medium text-gray-900">{deal.developer_sales_name}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Phone:</span>
                        <span className="font-medium text-gray-900">{deal.developer_sales_phone}</span>
                      </div>
                    </div>

                    {/* File Upload */}
                    <div className="pt-4 border-t border-gray-100">
                      <Label htmlFor={`file-upload-${deal.id}`} className="text-sm font-medium text-gray-700">
                        Upload Documents
                      </Label>
                      <Input
                        id={`file-upload-${deal.id}`}
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload(deal.id, e.target.files)}
                        className="mt-2 rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    {/* Attachments */}
                    {deal.attachments && deal.attachments.length > 0 && (
                      <div className="pt-4 border-t border-gray-100">
                        <p className="text-sm font-medium text-gray-700 mb-2">Attachments:</p>
                        <div className="space-y-2">
                          {deal.attachments.map((attachment) => (
                            <div key={attachment.id} className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded-lg">
                              <FileText className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">{attachment.file_name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredDeals.length === 0 && !loading && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-shadow duration-300 p-12 text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full flex items-center justify-center">
              <Building className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No deals found</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {searchTerm || Object.values(filters).some(f => f !== '')
                ? 'Try adjusting your search terms or filters to find the right deals.'
                : 'Get started by creating your first deal. Click the "New Deal" button above to begin.'
            }
            </p>
          </div>
        )}
      </div>

      {/* Edit Deal Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Deal</DialogTitle>
          </DialogHeader>
          {selectedDeal && (
            <form onSubmit={(e) => {
              e.preventDefault();
              handleUpdateDeal(new FormData(e.currentTarget));
            }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_deal_type">Deal Type *</Label>
                  <Select name="deal_type" defaultValue={selectedDeal.deal_type} required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EOI">EOI</SelectItem>
                      <SelectItem value="Reservation">Reservation</SelectItem>
                      <SelectItem value="Contract">Contract</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="edit_project_name">Project Name *</Label>
                  <Input name="project_name" defaultValue={selectedDeal.project_name} required />
                </div>

                <div>
                  <Label htmlFor="edit_developer_name">Developer Name *</Label>
                  <Input name="developer_name" defaultValue={selectedDeal.developer_name} required />
                </div>

                <div>
                  <Label htmlFor="edit_client_name">Client Name *</Label>
                  <Input name="client_name" defaultValue={selectedDeal.client_name} required />
                </div>

                <div>
                  <Label htmlFor="edit_unit_code">Unit Code *</Label>
                  <Input name="unit_code" defaultValue={selectedDeal.unit_code} required />
                </div>

                <div>
                  <Label htmlFor="edit_developer_sales_name">Developer Sales Name *</Label>
                  <Input name="developer_sales_name" defaultValue={selectedDeal.developer_sales_name} required />
                </div>

                <div>
                  <Label htmlFor="edit_developer_sales_phone">Developer Sales Phone *</Label>
                  <Input name="developer_sales_phone" defaultValue={selectedDeal.developer_sales_phone} required />
                </div>

                <div>
                  <Label htmlFor="edit_deal_value">Deal Value *</Label>
                  <Input name="deal_value" type="number" step="0.01" defaultValue={selectedDeal.deal_value} required />
                </div>

                <div>
                  <Label htmlFor="edit_downpayment_percentage">Downpayment % *</Label>
                  <Input name="downpayment_percentage" type="number" step="0.01" defaultValue={selectedDeal.downpayment_percentage} required />
                </div>

                <div>
                  <Label htmlFor="edit_payment_plan_years">Payment Plan (Years) *</Label>
                  <Input name="payment_plan_years" type="number" defaultValue={selectedDeal.payment_plan_years} required />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update Deal</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyDeals;
