import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/auth';
import { supabase } from '../../lib/supabaseClient';
import { PageTitle } from '../../components/common/PageTitle';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { 
  ShoppingCart, 
  Building, 
  MapPin, 
  DollarSign, 
  Users, 
  Search,
  Filter,
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import type { Database } from '../../types/database';

type Project = Database['public']['Views']['lead_availability']['Row'];
type PaymentMethod = Database['public']['Enums']['payment_method'];

interface PurchaseFormData {
  quantity: number;
  paymentMethod: PaymentMethod | '';
  receiptFile: File | null;
}

const Shop: React.FC = () => {
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState<PurchaseFormData>({
    quantity: 50,
    paymentMethod: '',
    receiptFile: null
  });
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: queryError } = await supabase
        .from('lead_availability')
        .select('*')
        .order('available_leads', { ascending: false });

      if (queryError) {
        throw new Error(queryError.message);
      }

      setProjects(data || []);
    } catch (err: any) {
      console.error('Error loading projects:', err);
      setError(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedProject || !user || !purchaseForm.receiptFile) {
      return;
    }

    setPurchasing(true);
    setError(null);

    try {
      // 1. Upload receipt file
      const timestamp = Date.now();
      const fileName = `${timestamp}_${purchaseForm.receiptFile.name}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(filePath, purchaseForm.receiptFile);

      if (uploadError) {
        throw new Error(`Failed to upload receipt: ${uploadError.message}`);
      }

      // 2. Create purchase request
      const { data: requestId, error: orderError } = await supabase.rpc('rpc_start_order', {
        p_project: selectedProject.project_id,
        p_qty: purchaseForm.quantity,
        p_payment: purchaseForm.paymentMethod as PaymentMethod,
        p_receipt_url: filePath,
        p_receipt_name: fileName
      });

      if (orderError) {
        throw new Error(`Failed to create order: ${orderError.message}`);
      }

      setPurchaseSuccess(true);
      setTimeout(() => {
        setShowPurchaseDialog(false);
        setPurchaseSuccess(false);
        loadProjects(); // Refresh projects
      }, 3000);

    } catch (err: any) {
      console.error('Purchase error:', err);
      setError(err.message || 'Purchase failed');
    } finally {
      setPurchasing(false);
    }
  };

  const openPurchaseDialog = (project: Project) => {
    setSelectedProject(project);
    setPurchaseForm({
      quantity: 50,
      paymentMethod: '',
      receiptFile: null
    });
    setShowPurchaseDialog(true);
    setError(null);
  };

  const regions = Array.from(new Set(projects.map(p => p.region))).sort();
  
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.developer?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegion = !regionFilter || project.region === regionFilter;
    return matchesSearch && matchesRegion && (project.available_leads || 0) > 0;
  });

  const totalAvailableLeads = filteredProjects.reduce((sum, p) => sum + (p.available_leads || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title="Leads Shop"
        subtitle="Purchase high-quality leads from premium real estate projects"
        icon={ShoppingCart}
        color="green"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Building className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold">{projects.length}</div>
            <div className="text-sm text-muted-foreground">Total Projects</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold">{totalAvailableLeads}</div>
            <div className="text-sm text-muted-foreground">Available Leads</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <MapPin className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold">{regions.length}</div>
            <div className="text-sm text-muted-foreground">Regions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <DollarSign className="h-8 w-8 mx-auto mb-2 text-orange-600" />
            <div className="text-2xl font-bold">Premium</div>
            <div className="text-sm text-muted-foreground">Quality</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects by name, developer, or region..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Regions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Regions</SelectItem>
                {regions.map(region => (
                  <SelectItem key={region} value={region}>{region}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Building className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No lead packages available</h3>
            <p className="text-muted-foreground">
              {projects.length === 0 
                ? 'There are currently no projects with leads available for purchase.'
                : 'No projects match your search criteria.'}
            </p>
            {searchTerm || regionFilter ? (
              <Button 
                onClick={() => { setSearchTerm(''); setRegionFilter(''); }}
                variant="outline"
                className="mt-4"
              >
                Clear Filters
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card key={project.project_id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{project.developer}</p>
                  </div>
                  <Badge variant="secondary">
                    <MapPin className="h-3 w-3 mr-1" />
                    {project.region}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <Badge className="bg-green-100 text-green-800">
                    <Users className="h-3 w-3 mr-1" />
                    {project.available_leads} leads
                  </Badge>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      ${project.current_cpl}/lead
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {project.description && (
                  <p className="text-sm text-muted-foreground">{project.description}</p>
                )}
                
                <Button 
                  onClick={() => openPurchaseDialog(project)}
                  className="w-full"
                  disabled={(project.available_leads || 0) < 50}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {(project.available_leads || 0) >= 50 ? 'Purchase Leads' : 'Insufficient Leads'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Purchase Dialog */}
      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Purchase Leads</DialogTitle>
          </DialogHeader>
          
          {purchaseSuccess ? (
            <div className="text-center py-6">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Request Submitted!</h3>
              <p className="text-muted-foreground">
                Your purchase request has been submitted for admin approval. 
                You'll be notified once it's processed.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedProject && (
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold">{selectedProject.name}</h4>
                  <p className="text-sm text-muted-foreground">{selectedProject.developer} • {selectedProject.region}</p>
                  <p className="text-sm font-medium">Available: {selectedProject.available_leads} leads</p>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Number of Leads</label>
                <Input
                  type="number"
                  min="50"
                  max={selectedProject?.available_leads || 50}
                  value={purchaseForm.quantity}
                  onChange={(e) => setPurchaseForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 50 }))}
                  placeholder="Minimum 50 leads"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Total: ${((selectedProject?.current_cpl || 0) * purchaseForm.quantity).toFixed(2)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Payment Method</label>
                <Select 
                  value={purchaseForm.paymentMethod} 
                  onValueChange={(value) => setPurchaseForm(prev => ({ ...prev, paymentMethod: value as PaymentMethod }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Instapay">Instapay</SelectItem>
                    <SelectItem value="VodafoneCash">Vodafone Cash</SelectItem>
                    <SelectItem value="BankTransfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Payment Receipt</label>
                <div className="border-2 border-dashed border-muted rounded-lg p-4 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setPurchaseForm(prev => ({ ...prev, receiptFile: file }));
                      }
                    }}
                    className="hidden"
                    id="receipt-upload"
                  />
                  <label 
                    htmlFor="receipt-upload" 
                    className="cursor-pointer text-sm text-muted-foreground hover:text-foreground"
                  >
                    {purchaseForm.receiptFile ? purchaseForm.receiptFile.name : 'Click to upload receipt'}
                  </label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowPurchaseDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handlePurchase}
                  disabled={!purchaseForm.paymentMethod || !purchaseForm.receiptFile || purchasing || purchaseForm.quantity < 50}
                  className="flex-1"
                >
                  {purchasing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Submit Request
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Shop;