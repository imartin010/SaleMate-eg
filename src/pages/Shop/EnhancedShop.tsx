import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { useAuthStore } from '../../store/auth';
import { supabase } from '../../lib/supabaseClient';
import type { MarketplaceProject, CreatePurchaseRequest, LeadPurchaseRequest } from '../../types';
import { 
  ShoppingCart, 
  Building, 
  MapPin, 
  DollarSign, 
  Users, 
  Search,
  Filter,
  Loader2,
  CheckCircle,
  AlertCircle,
  Receipt,
  Upload,
  Eye,
  Clock,
  TrendingUp
} from 'lucide-react';

interface PurchaseDialogState {
  isOpen: boolean;
  project: MarketplaceProject | null;
}

interface PurchaseFormData {
  numberOfLeads: number;
  receiptFile: File | null;
  receiptFileName: string;
  receiptFileUrl: string;
}

export const EnhancedShop: React.FC = () => {
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<MarketplaceProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [purchaseDialog, setPurchaseDialog] = useState<PurchaseDialogState>({ isOpen: false, project: null });
  const [purchaseForm, setPurchaseForm] = useState<PurchaseFormData>({
    numberOfLeads: 1,
    receiptFile: null,
    receiptFileName: '',
    receiptFileUrl: ''
  });
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [myRequests, setMyRequests] = useState<LeadPurchaseRequest[]>([]);

  useEffect(() => {
    fetchMarketplaceData();
    fetchMyPurchaseRequests();
  }, []);

  const fetchMarketplaceData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.functions.invoke('marketplace', {
        method: 'GET'
      });

      if (error) throw error;

      setProjects(data.projects || []);
    } catch (err) {
      console.error('Error fetching marketplace data:', err);
      setError('Failed to load marketplace data');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyPurchaseRequests = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('marketplace/purchase-requests', {
        method: 'GET'
      });

      if (error) throw error;

      setMyRequests(data.requests || []);
    } catch (err) {
      console.error('Error fetching purchase requests:', err);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // In a real app, you'd upload to storage and get a URL
    // For now, we'll simulate with a data URL
    const reader = new FileReader();
    reader.onload = () => {
      setPurchaseForm(prev => ({
        ...prev,
        receiptFile: file,
        receiptFileName: file.name,
        receiptFileUrl: reader.result as string
      }));
    };
    reader.readAsDataURL(file);
  };

  const handlePurchase = async () => {
    if (!purchaseDialog.project || !user) return;

    setPurchasing(true);
    try {
      const requestData: CreatePurchaseRequest = {
        projectId: purchaseDialog.project.projectId,
        numberOfLeads: purchaseForm.numberOfLeads,
        receiptFileUrl: purchaseForm.receiptFileUrl,
        receiptFileName: purchaseForm.receiptFileName
      };

      const { data, error } = await supabase.functions.invoke('marketplace/purchase-request', {
        method: 'POST',
        body: requestData
      });

      if (error) throw error;

      if (data.success) {
        setPurchaseSuccess(true);
        setPurchaseDialog({ isOpen: false, project: null });
        setPurchaseForm({
          numberOfLeads: 1,
          receiptFile: null,
          receiptFileName: '',
          receiptFileUrl: ''
        });
        
        // Refresh data
        fetchMarketplaceData();
        fetchMyPurchaseRequests();
        
        // Show success message
        setTimeout(() => setPurchaseSuccess(false), 5000);
      } else {
        throw new Error(data.error || 'Purchase failed');
      }
    } catch (err) {
      console.error('Purchase error:', err);
      setError(err instanceof Error ? err.message : 'Purchase failed');
    } finally {
      setPurchasing(false);
    }
  };

  const openPurchaseDialog = (project: MarketplaceProject) => {
    setPurchaseDialog({ isOpen: true, project });
    setPurchaseForm({
      numberOfLeads: Math.min(10, project.availableLeads),
      receiptFile: null,
      receiptFileName: '',
      receiptFileUrl: ''
    });
  };

  const filteredProjects = projects.filter(project =>
    project.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.developerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.region.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading marketplace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gradient">Lead Marketplace</h1>
            <p className="text-lg text-muted-foreground">
              Purchase high-quality leads from verified projects
            </p>
          </div>
          <Button onClick={fetchMarketplaceData} variant="outline" size="sm">
            <TrendingUp className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Success Message */}
        {purchaseSuccess && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Purchase request submitted successfully! You'll be notified once it's approved.
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Search */}
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects, developers, or regions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Marketplace Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 mx-auto mb-2">
            <Building className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-foreground">{projects.length}</div>
          <div className="text-sm text-muted-foreground">Available Projects</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 mx-auto mb-2">
            <Users className="h-5 w-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {projects.reduce((sum, p) => sum + p.availableLeads, 0).toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground">Total Leads</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 mx-auto mb-2">
            <DollarSign className="h-5 w-5 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            ${projects.length > 0 ? Math.round(projects.reduce((sum, p) => sum + p.avgCplPrice, 0) / projects.length) : 0}
          </div>
          <div className="text-sm text-muted-foreground">Avg. CPL</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-100 mx-auto mb-2">
            <Receipt className="h-5 w-5 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-foreground">{myRequests.length}</div>
          <div className="text-sm text-muted-foreground">My Requests</div>
        </Card>
      </div>

      {/* Projects Grid */}
      <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
        {filteredProjects.map((project) => (
          <Card key={project.projectId} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{project.projectName}</CardTitle>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Building className="h-4 w-4 mr-1" />
                    {project.developerName}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-1" />
                    {project.region}
                  </div>
                </div>
                <Badge variant="secondary">
                  {project.availableLeads} leads
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Price Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">
                    ${project.minCplPrice}
                  </div>
                  <div className="text-xs text-blue-600">Min CPL</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">
                    ${project.avgCplPrice.toFixed(0)}
                  </div>
                  <div className="text-xs text-green-600">Avg CPL</div>
                </div>
              </div>

              {/* Description */}
              {project.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {project.description}
                </p>
              )}

              {/* Action Button */}
              <Button 
                onClick={() => openPurchaseDialog(project)}
                className="w-full"
                disabled={project.availableLeads === 0}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                {project.availableLeads > 0 ? 'Purchase Leads' : 'Sold Out'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Results */}
      {filteredProjects.length === 0 && !loading && (
        <div className="text-center py-12">
          <Building className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No projects found</h3>
          <p className="text-muted-foreground">
            {searchTerm ? 'Try adjusting your search terms' : 'No projects are currently available'}
          </p>
        </div>
      )}

      {/* My Purchase Requests */}
      {myRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              My Purchase Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {myRequests.slice(0, 5).map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">
                      {request.project?.name || 'Unknown Project'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {request.numberOfLeads} leads • ${request.totalPrice}
                    </div>
                  </div>
                  <Badge className={getStatusColor(request.status)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(request.status)}
                      {request.status}
                    </div>
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Purchase Dialog */}
      <Dialog open={purchaseDialog.isOpen} onOpenChange={(open) => !purchasing && setPurchaseDialog({ isOpen: open, project: null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Purchase Leads</DialogTitle>
            <DialogDescription>
              {purchaseDialog.project?.projectName} - {purchaseDialog.project?.developerName}
            </DialogDescription>
          </DialogHeader>
          
          {purchaseDialog.project && (
            <div className="space-y-4">
              {/* Project Info */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-muted-foreground">Available Leads</div>
                <div className="text-lg font-bold">{purchaseDialog.project.availableLeads}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Price: ${purchaseDialog.project.avgCplPrice.toFixed(2)} per lead
                </div>
              </div>

              {/* Number of Leads */}
              <div className="space-y-2">
                <Label htmlFor="lead-quantity">Number of Leads</Label>
                <Input
                  id="lead-quantity"
                  type="number"
                  min="1"
                  max={purchaseDialog.project.availableLeads}
                  value={purchaseForm.numberOfLeads}
                  onChange={(e) => setPurchaseForm(prev => ({ 
                    ...prev, 
                    numberOfLeads: Math.min(parseInt(e.target.value) || 1, purchaseDialog.project!.availableLeads)
                  }))}
                />
              </div>

              {/* Total Price */}
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-sm text-blue-600">Total Price</div>
                <div className="text-xl font-bold text-blue-700">
                  ${(purchaseForm.numberOfLeads * purchaseDialog.project.avgCplPrice).toFixed(2)}
                </div>
              </div>

              {/* Receipt Upload */}
              <div className="space-y-2">
                <Label htmlFor="receipt-upload">Payment Receipt *</Label>
                <Input
                  id="receipt-upload"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                />
                <p className="text-xs text-muted-foreground">
                  Upload proof of payment (bank transfer receipt, screenshot, etc.)
                </p>
              </div>

              {/* Receipt Preview */}
              {purchaseForm.receiptFileName && (
                <div className="flex items-center gap-2 p-2 bg-green-50 rounded border">
                  <Upload className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700">{purchaseForm.receiptFileName}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setPurchaseDialog({ isOpen: false, project: null })}
                  disabled={purchasing}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handlePurchase} 
                  disabled={purchasing || !purchaseForm.receiptFileName}
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

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your purchase request will be reviewed by an admin. You'll be notified once approved and leads will be added to your CRM.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
