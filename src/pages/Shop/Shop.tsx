import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { supabase } from '../../lib/supabaseClient';
import { useWallet } from '../../contexts/WalletContext';
import { PageTitle } from '../../components/common/PageTitle';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
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
  Loader2,
  Wallet,
  CreditCard
} from 'lucide-react';
// Note: We avoid strict DB typings here to support views/RPC not in generated types

// Define types locally to avoid database schema dependencies
interface Project {
  project_id: string;
  name: string;
  developer: string;
  region: string;
  description?: string;
  available_leads: number;
  current_cpl: number;
  created_at?: string;
  updated_at?: string;
}

type PaymentMethod = 'wallet' | 'card' | 'instapay';

interface PurchaseFormData {
  quantity: number;
  paymentMethod: PaymentMethod | 'none';
  receiptFile: File | null; // Only required for non-wallet payments
}

const Shop: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { balance, loading: walletLoading, refreshBalance } = useWallet();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState<PurchaseFormData>({
    quantity: 30,
    paymentMethod: 'none',
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
      // Load projects directly from projects table
      const { data: projectData, error: queryError } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          region,
          description,
          available_leads,
          price_per_lead,
          developers:developer_id (
            name
          )
        `)
        .order('created_at', { ascending: false });
      
      if (queryError) {
        throw new Error(queryError.message);
      }

      const base = (projectData || []).map((p: any) => ({
        project_id: p.id,
        name: p.name || 'Unknown Project',
        developer: p.developers?.name || p.region || 'Unknown Developer',
        region: p.region || 'Unknown Region',
        description: p.description || '',
        available_leads: Number(p.available_leads || 0),
        current_cpl: Number(p.price_per_lead || 0),
      })) as Project[];

      setProjects(base);
    } catch (err: unknown) {
      console.error('Error loading projects:', err);
      setError((err instanceof Error ? err.message : String(err)) || 'Failed to load projects');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedProject) {
      return;
    }

    // Require login for purchase
    if (!user) {
      navigate('/auth/login', { state: { from: { pathname: '/app/shop' } } });
      return;
    }

    // Validate payment method
    if (purchaseForm.paymentMethod === 'none') {
      setError('Please select a payment method');
      return;
    }

    // Validate quantity
    if (purchaseForm.quantity < 30) {
      setError('Minimum 30 leads required');
      return;
    }

    // For non-wallet payments, require receipt
    if (purchaseForm.paymentMethod !== 'wallet' && !purchaseForm.receiptFile) {
      setError('Please upload payment receipt');
      return;
    }

    // Check wallet balance for wallet payments
    const totalAmount = selectedProject.current_cpl * purchaseForm.quantity;
    if (purchaseForm.paymentMethod === 'wallet' && balance < totalAmount) {
      setError(`Insufficient wallet balance. You need ${totalAmount.toFixed(2)} EGP, but have ${balance.toFixed(2)} EGP`);
      return;
    }

    setPurchasing(true);
    setError(null);

    try {
      // For wallet payments, use purchase-leads edge function (immediate)
      if (purchaseForm.paymentMethod === 'wallet') {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('Not authenticated');
        }

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const response = await fetch(`${supabaseUrl}/functions/v1/purchase-leads`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            project_id: selectedProject.project_id,
            quantity: purchaseForm.quantity,
            payment_method: 'wallet',
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Purchase failed');
        }

        // Refresh wallet balance and projects
        await refreshBalance();
        await loadProjects();

        setPurchaseSuccess(true);
        setTimeout(() => {
          setShowPurchaseDialog(false);
          setPurchaseSuccess(false);
          // Redirect to CRM to see purchased leads
          window.location.href = '/app/crm';
        }, 2000);
        return;
      }

      // For card/instapay payments, upload receipt and create purchase request (requires approval)
      const timestamp = Date.now();
      const fileName = `${timestamp}_${purchaseForm.receiptFile!.name}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(filePath, purchaseForm.receiptFile!);

      if (uploadError) {
        throw new Error(`Failed to upload receipt: ${uploadError.message}`);
      }

      // Create purchase request (for admin approval)
      const { error: requestError } = await supabase
        .from('purchase_requests')
        .insert({
          user_id: user.id,
          project_id: selectedProject.project_id,
          project_name: selectedProject.name, // Denormalized for performance
          quantity: purchaseForm.quantity,
          payment_method: purchaseForm.paymentMethod,
          total_amount: totalAmount,
          receipt_url: filePath,
          receipt_file_name: fileName,
          status: 'pending',
        });

      if (requestError) {
        throw new Error(`Failed to create purchase request: ${requestError.message}`);
      }

      setPurchaseSuccess(true);
      setTimeout(() => {
        setShowPurchaseDialog(false);
        setPurchaseSuccess(false);
        loadProjects(); // Refresh projects
      }, 3000);

    } catch (err: unknown) {
      console.error('Purchase error:', err);
      setError((err instanceof Error ? err.message : String(err)) || 'Purchase failed');
    } finally {
      setPurchasing(false);
    }
  };

  const openPurchaseDialog = (project: Project) => {
    // Require login to open purchase dialog
    if (!user) {
      navigate('/auth/login', { state: { from: { pathname: '/app/shop' } } });
      return;
    }
    
    setSelectedProject(project);
    setPurchaseForm({
      quantity: 30,
      paymentMethod: 'none',
      receiptFile: null
    });
    setShowPurchaseDialog(true);
    setError(null);
  };

  const regions = Array.from(new Set(projects.map(p => p.region))).sort();
  
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.developer?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegion = regionFilter === 'all' || !regionFilter || project.region === regionFilter;
    return matchesSearch && matchesRegion; // do not hide projects with 0 available
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
                <SelectItem value="all">All Regions</SelectItem>
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
            {searchTerm || (regionFilter && regionFilter !== 'all') ? (
              <Button 
                onClick={() => { setSearchTerm(''); setRegionFilter('all'); }}
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
                  disabled={(project.available_leads || 0) < 1}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {(project.available_leads || 0) >= 1 ? 'Purchase Leads' : 'No Leads Available'}
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
              <h3 className="text-lg font-semibold mb-2">
                {purchaseForm.paymentMethod === 'wallet' ? 'Purchase Complete!' : 'Request Submitted!'}
              </h3>
              <p className="text-muted-foreground">
                {purchaseForm.paymentMethod === 'wallet' 
                  ? 'Your leads have been assigned to your account. Redirecting to CRM...'
                  : 'Your purchase request has been submitted for admin approval. You\'ll be notified once it\'s processed.'}
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
                  min="30"
                  max={selectedProject?.available_leads || 30}
                  value={purchaseForm.quantity}
                  onChange={(e) => setPurchaseForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 30 }))}
                  placeholder="Minimum 30 leads"
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-muted-foreground">
                    Price per lead: {selectedProject?.current_cpl || 0} EGP
                  </p>
                  <p className="text-sm font-semibold">
                    Total: {((selectedProject?.current_cpl || 0) * purchaseForm.quantity).toFixed(2)} EGP
                  </p>
                </div>
              </div>

              {/* Wallet Balance Display */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Wallet Balance</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">
                    {walletLoading ? 'Loading...' : `${balance.toFixed(2)} EGP`}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Payment Method</label>
                <Select 
                  value={purchaseForm.paymentMethod} 
                  onValueChange={(value) => {
                    setPurchaseForm(prev => ({ 
                      ...prev, 
                      paymentMethod: value as PaymentMethod | 'none',
                      receiptFile: value === 'wallet' ? null : prev.receiptFile // Clear receipt for wallet
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" disabled>Select payment method</SelectItem>
                    <SelectItem value="wallet">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        Wallet (Instant)
                      </div>
                    </SelectItem>
                    <SelectItem value="card">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Credit/Debit Card
                      </div>
                    </SelectItem>
                    <SelectItem value="instapay">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Instapay
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {purchaseForm.paymentMethod === 'wallet' && balance < ((selectedProject?.current_cpl || 0) * purchaseForm.quantity) && (
                  <p className="text-xs text-red-600 mt-1">
                    Insufficient balance. Add funds to your wallet.
                  </p>
                )}
              </div>

              {purchaseForm.paymentMethod !== 'wallet' && purchaseForm.paymentMethod !== 'none' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Payment Receipt *</label>
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
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload receipt for admin approval (may take 1-2 business days)
                  </p>
                </div>
              )}

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
                  disabled={
                    purchasing || 
                    purchaseForm.paymentMethod === 'none' || 
                    purchaseForm.quantity < 30 ||
                    purchaseForm.quantity > (selectedProject?.available_leads || 0) ||
                    (purchaseForm.paymentMethod !== 'wallet' && !purchaseForm.receiptFile) ||
                    (purchaseForm.paymentMethod === 'wallet' && balance < ((selectedProject?.current_cpl || 0) * purchaseForm.quantity))
                  }
                  className="flex-1"
                >
                  {purchasing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {purchaseForm.paymentMethod === 'wallet' ? 'Processing...' : 'Submitting...'}
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {purchaseForm.paymentMethod === 'wallet' ? 'Purchase Now' : 'Submit Request'}
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