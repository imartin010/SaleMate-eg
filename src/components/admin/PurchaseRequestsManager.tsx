import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { supabase } from "../../lib/supabaseClient"
import type { AdminPurchaseRequest } from '../../types';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  DollarSign, 
  Users, 
  Building,
  Receipt,
  Eye,
  Loader2,
  AlertCircle,
  FileText
} from 'lucide-react';

interface ReviewDialogState {
  isOpen: boolean;
  request: AdminPurchaseRequest | null;
  action: 'approve' | 'reject' | null;
}

export const PurchaseRequestsManager: React.FC = () => {
  const [requests, setRequests] = useState<AdminPurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewDialog, setReviewDialog] = useState<ReviewDialogState>({ 
    isOpen: false, 
    request: null, 
    action: null 
  });
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPurchaseRequests();
  }, []);

  const fetchPurchaseRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      // Since we don't have Edge Functions deployed, let's fetch directly from Supabase
      const { data: requestsData, error } = await supabase
        .from('lead_purchase_requests' as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .select(`
          id,
          buyer_user_id,
          project_id,
          number_of_leads,
          cpl_price,
          total_price,
          receipt_file_url,
          receipt_file_name,
          status,
          admin_notes,
          created_at,
          approved_at,
          rejected_at,
          profiles!buyer_user_id (
            id,
            name,
            email
          ),
          projects (
            id,
            name,
            developer,
            region
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Transform data to match our interface
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transformedRequests: AdminPurchaseRequest[] = (requestsData || []).map((req: any) => ({
        id: req.id,
        buyerUserId: req.buyer_user_id,
        projectId: req.project_id,
        numberOfLeads: req.number_of_leads,
        cplPrice: req.cpl_price,
        totalPrice: req.total_price,
        receiptFileUrl: req.receipt_file_url,
        receiptFileName: req.receipt_file_name,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        status: req.status as any,
        adminNotes: req.admin_notes,
        approvedAt: req.approved_at,
        rejectedAt: req.rejected_at,
        createdAt: req.created_at,
        updatedAt: req.created_at, // Using created_at as fallback
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        buyer: (req.profiles as any) || { id: '', name: 'Unknown', email: '' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        project: (req.projects as any) || { id: '', name: 'Unknown', developer: 'Unknown', region: 'Unknown' }
      }));

      setRequests(transformedRequests);
    } catch (err) {
      console.error('Error fetching purchase requests:', err);
      setError('Failed to load purchase requests');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewRequest = async () => {
    if (!reviewDialog.request || !reviewDialog.action) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('lead_purchase_requests' as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .update({
          status: reviewDialog.action === 'approve' ? 'approved' : 'rejected',
          admin_notes: adminNotes,
          [`${reviewDialog.action}d_at`]: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', reviewDialog.request.id);

      if (error) throw error;

      // If approving, we need to transfer leads (simplified version)
      if (reviewDialog.action === 'approve') {
        // Get available leads for this project
        const { data: availableLeads, error: leadsError } = await supabase
          .from('leads')
          .select('id')
          .eq('project_id', reviewDialog.request.projectId)
          .is('buyer_user_id', null)
          .limit(reviewDialog.request.numberOfLeads);

        if (!leadsError && availableLeads && availableLeads.length > 0) {
          // Transfer leads to buyer
          const leadIds = availableLeads.map(lead => lead.id);
          await supabase
            .from('leads')
            .update({ 
              buyer_user_id: reviewDialog.request.buyerUserId,
              updated_at: new Date().toISOString()
            })
            .in('id', leadIds);

          // Update project available leads count
          await supabase
            .from('projects')
            .update({ 
              available_leads: (supabase as any).sql`available_leads - ${leadIds.length}`, // eslint-disable-line @typescript-eslint/no-explicit-any
              updated_at: new Date().toISOString()
            })
            .eq('id', reviewDialog.request.projectId);
        }
      }

      // Refresh data
      fetchPurchaseRequests();
      
      // Close dialog
      setReviewDialog({ isOpen: false, request: null, action: null });
      setAdminNotes('');

    } catch (err) {
      console.error('Error processing request:', err);
      setError(err instanceof Error ? err.message : 'Failed to process request');
    } finally {
      setProcessing(false);
    }
  };

  const openReviewDialog = (request: AdminPurchaseRequest, action: 'approve' | 'reject') => {
    setReviewDialog({ isOpen: true, request, action });
    setAdminNotes('');
  };

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
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const pendingRequests = requests.filter(req => req.status === 'pending');
  const processedRequests = requests.filter(req => req.status !== 'pending');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading purchase requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Purchase Requests</h2>
          <p className="text-muted-foreground">Review and approve lead purchase requests</p>
        </div>
        <Button onClick={fetchPurchaseRequests} variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100 mx-auto mb-2">
            <Clock className="h-5 w-5 text-yellow-600" />
          </div>
          <div className="text-2xl font-bold text-foreground">{pendingRequests.length}</div>
          <div className="text-sm text-muted-foreground">Pending</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 mx-auto mb-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {requests.filter(r => r.status === 'approved').length}
          </div>
          <div className="text-sm text-muted-foreground">Approved</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 mx-auto mb-2">
            <XCircle className="h-5 w-5 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {requests.filter(r => r.status === 'rejected').length}
          </div>
          <div className="text-sm text-muted-foreground">Rejected</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 mx-auto mb-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            ${requests.reduce((sum, r) => r.status === 'approved' ? sum + r.totalPrice : sum, 0).toFixed(0)}
          </div>
          <div className="text-sm text-muted-foreground">Total Sales</div>
        </Card>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <Clock className="h-5 w-5" />
              Pending Approval ({pendingRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4 bg-yellow-50">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{request.project.name}</span>
                        <Badge variant="outline">{request.project.developer}</Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {request.buyer.name}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {request.numberOfLeads} leads
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          ${request.totalPrice}
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Requested: {new Date(request.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {request.receiptFileUrl && (
                        <a href={request.receiptFileUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm">
                            <Eye className="h-3 w-3 mr-1" />
                            Receipt
                          </Button>
                        </a>
                      )}
                      <Button 
                        size="sm" 
                        onClick={() => openReviewDialog(request, 'approve')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => openReviewDialog(request, 'reject')}
                        className="text-red-600 hover:text-red-700"
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Processed Requests */}
      {processedRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Processed Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {processedRequests.slice(0, 10).map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">{request.project.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {request.buyer.name} • {request.numberOfLeads} leads • ${request.totalPrice}
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

      {/* No Requests */}
      {requests.length === 0 && !loading && (
        <div className="text-center py-12">
          <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No purchase requests</h3>
          <p className="text-muted-foreground">
            Purchase requests will appear here when users submit them
          </p>
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={reviewDialog.isOpen} onOpenChange={(open) => !processing && setReviewDialog({ isOpen: open, request: null, action: null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {reviewDialog.action === 'approve' ? 'Approve' : 'Reject'} Purchase Request
            </DialogTitle>
            <DialogDescription>
              {reviewDialog.request?.project.name} - {reviewDialog.request?.buyer.name}
            </DialogDescription>
          </DialogHeader>
          
          {reviewDialog.request && (
            <div className="space-y-4">
              {/* Request Details */}
              <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Leads:</span>
                  <span className="font-medium">{reviewDialog.request.numberOfLeads}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">CPL:</span>
                  <span className="font-medium">${reviewDialog.request.cplPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total:</span>
                  <span className="font-bold text-lg">${reviewDialog.request.totalPrice}</span>
                </div>
              </div>

              {/* Receipt Info */}
              {reviewDialog.request.receiptFileName && (
                <div className="flex items-center gap-2 p-2 bg-blue-50 rounded border">
                  <Receipt className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-700">{reviewDialog.request.receiptFileName}</span>
                  {reviewDialog.request.receiptFileUrl && (
                    <a href={reviewDialog.request.receiptFileUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-3 w-3" />
                      </Button>
                    </a>
                  )}
                </div>
              )}

              {/* Admin Notes */}
              <div className="space-y-2">
                <Label htmlFor="admin-notes">Admin Notes</Label>
                <Textarea
                  id="admin-notes"
                  placeholder="Add notes about this decision..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Warning for Approval */}
              {reviewDialog.action === 'approve' && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Approving this request will transfer {reviewDialog.request.numberOfLeads} leads to {reviewDialog.request.buyer.name} and they will appear in their CRM.
                  </AlertDescription>
                </Alert>
              )}

              {/* Warning for Rejection */}
              {reviewDialog.action === 'reject' && (
                <Alert className="border-red-200 bg-red-50">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    Rejecting this request will notify the buyer that their purchase was not approved.
                  </AlertDescription>
                </Alert>
              )}

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setReviewDialog({ isOpen: false, request: null, action: null })}
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleReviewRequest} 
                  disabled={processing}
                  className={reviewDialog.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {reviewDialog.action === 'approve' ? (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-2" />
                      )}
                      {reviewDialog.action === 'approve' ? 'Approve Request' : 'Reject Request'}
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
