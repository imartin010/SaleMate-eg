import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/auth';
import { supabase } from '../../lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Building, 
  DollarSign,
  FileText,
  Loader2
} from 'lucide-react';
import type { Database } from '../../types/database';

type PurchaseRequest = Database['public']['Tables']['lead_purchase_requests']['Row'] & {
  profiles?: { name: string; email: string } | null;
  projects?: { name: string; developer: string; region: string } | null;
};

interface ReviewDialog {
  isOpen: boolean;
  request: PurchaseRequest | null;
  action: 'approve' | 'reject' | null;
}

export const PurchaseRequestsManager: React.FC = () => {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [reviewDialog, setReviewDialog] = useState<ReviewDialog>({ isOpen: false, request: null, action: null });
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    fetchPurchaseRequests();
  }, []);

  const fetchPurchaseRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lead_purchase_requests')
        .select(`
          *,
          profiles!buyer_user_id(name, email),
          projects(name, developer, region)
        `)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      console.error('Error fetching purchase requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewRequest = async () => {
    if (!reviewDialog.request || !reviewDialog.action) return;

    setProcessing(true);
    try {
      if (reviewDialog.action === 'approve') {
        const { data: result, error } = await supabase.rpc('rpc_approve_request', {
          p_request: reviewDialog.request.id,
          p_admin_notes: adminNotes
        });

        if (error) throw error;
        
        console.log(`✅ Approved request - ${result?.[0]?.leads_assigned || 0} leads assigned`);
      } else {
        const { error } = await supabase.rpc('rpc_reject_request', {
          p_request: reviewDialog.request.id,
          p_admin_notes: adminNotes
        });

        if (error) throw error;
        console.log('❌ Request rejected');
      }

      // Refresh data
      fetchPurchaseRequests();
      
      // Close dialog
      setReviewDialog({ isOpen: false, request: null, action: null });
      setAdminNotes('');

    } catch (err: any) {
      console.error('Error processing request:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Purchase Requests</h1>
        <p className="text-muted-foreground">Review and approve lead purchase requests</p>
      </div>

      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            Pending Requests ({pendingRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No pending requests</p>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <Card key={request.id} className="border-l-4 border-l-yellow-400">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{request.profiles?.name || 'Unknown User'}</span>
                          <span className="text-sm text-muted-foreground">({request.profiles?.email})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span>{request.projects?.name || 'Unknown Project'}</span>
                          <span className="text-sm text-muted-foreground">
                            {request.projects?.developer} • {request.projects?.region}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span><strong>{request.number_of_leads}</strong> leads</span>
                          <span><strong>${request.cpl_price}</strong> per lead</span>
                          <span><strong>${request.total_price}</strong> total</span>
                          <Badge variant="outline">{request.payment_method}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Requested: {new Date(request.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setReviewDialog({ isOpen: true, request, action: 'approve' })}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => setReviewDialog({ isOpen: true, request, action: 'reject' })}
                          size="sm"
                          variant="destructive"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                        {request.receipt_file_url && (
                          <Button
                            onClick={() => {
                              // Open receipt in new tab
                              const { data } = supabase.storage.from('receipts').getPublicUrl(request.receipt_file_url);
                              window.open(data.publicUrl, '_blank');
                            }}
                            size="sm"
                            variant="outline"
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Receipt
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processed Requests */}
      {processedRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Processed Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {processedRequests.slice(0, 10).map((request) => (
                <div key={request.id} className="flex justify-between items-center p-3 border rounded">
                  <div className="flex items-center gap-4">
                    <span className="font-medium">{request.profiles?.name}</span>
                    <span className="text-sm text-muted-foreground">{request.projects?.name}</span>
                    <span className="text-sm">{request.number_of_leads} leads</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(request.status)}
                    <span className="text-xs text-muted-foreground">
                      {new Date(request.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review Dialog */}
      <Dialog open={reviewDialog.isOpen} onOpenChange={(open) => setReviewDialog(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewDialog.action === 'approve' ? 'Approve' : 'Reject'} Purchase Request
            </DialogTitle>
          </DialogHeader>
          
          {reviewDialog.request && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div><strong>Customer:</strong> {reviewDialog.request.profiles?.name} ({reviewDialog.request.profiles?.email})</div>
                <div><strong>Project:</strong> {reviewDialog.request.projects?.name}</div>
                <div><strong>Quantity:</strong> {reviewDialog.request.number_of_leads} leads</div>
                <div><strong>Total Price:</strong> ${reviewDialog.request.total_price}</div>
                <div><strong>Payment Method:</strong> {reviewDialog.request.payment_method}</div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Admin Notes</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={`Enter notes for ${reviewDialog.action}ing this request...`}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setReviewDialog({ isOpen: false, request: null, action: null })}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleReviewRequest}
                  disabled={processing}
                  className={`flex-1 ${
                    reviewDialog.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : reviewDialog.action === 'approve' ? (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  {reviewDialog.action === 'approve' ? 'Approve & Assign Leads' : 'Reject Request'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchaseRequestsManager;
