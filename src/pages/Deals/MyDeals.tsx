import React, { useState, useEffect } from 'react';
import { useDealsStore } from '../../store/deals';
import { Deal, DealType, DealStage, DealStatus } from '../../types/deals';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  FileText, 
  Upload,
  DollarSign,
  Calendar,
  Building,
  User,
  Phone,
  MapPin
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your deals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Deals</h1>
          <p className="text-gray-600">Track and manage your real estate deals</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Deals</p>
                  <p className="text-2xl font-bold text-gray-900">{deals.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Building className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${deals.reduce((sum, deal) => sum + deal.deal_value, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {deals.filter(d => d.status === 'pending').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <User className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {deals.filter(d => d.status === 'approved').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search deals, projects, or developers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Select value={filters.deal_type} onValueChange={(value) => setFilters(prev => ({ ...prev, deal_type: value as DealType | '' }))}>
              <SelectTrigger className="w-40">
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
              <SelectTrigger className="w-40">
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
              <SelectTrigger className="w-40">
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
              className="bg-blue-600 hover:bg-blue-700"
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

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <div className="flex justify-between items-center">
              <span>{error}</span>
              <Button variant="ghost" size="sm" onClick={clearError}>×</Button>
            </div>
          </div>
        )}

        {/* Deals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDeals.map((deal) => (
            <Card key={deal.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{deal.project_name}</CardTitle>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Badge variant="outline">{deal.deal_type}</Badge>
                      <Badge className={getStageColor(deal.deal_stage)}>{deal.deal_stage}</Badge>
                      <Badge className={getStatusColor(deal.status)}>{deal.status}</Badge>
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
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDeal(deal.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Developer:</span>
                    <p className="font-medium">{deal.developer_name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Client:</span>
                    <p className="font-medium">{deal.client_name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Unit Code:</span>
                    <p className="font-medium">{deal.unit_code}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Value:</span>
                    <p className="font-medium">${deal.deal_value.toLocaleString()}</p>
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Sales Contact:</span>
                    <span className="font-medium">{deal.developer_sales_name}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Phone:</span>
                    <span className="font-medium">{deal.developer_sales_phone}</span>
                  </div>
                </div>

                {/* File Upload */}
                <div className="pt-3 border-t">
                  <Label htmlFor={`file-upload-${deal.id}`} className="text-sm font-medium">
                    Upload Documents
                  </Label>
                  <Input
                    id={`file-upload-${deal.id}`}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload(deal.id, e.target.files)}
                    className="mt-1"
                  />
                </div>

                {/* Attachments */}
                {deal.attachments && deal.attachments.length > 0 && (
                  <div className="pt-3 border-t">
                    <p className="text-sm font-medium text-gray-700 mb-2">Attachments:</p>
                    <div className="space-y-1">
                      {deal.attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center gap-2 text-sm">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">{attachment.file_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredDeals.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
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
