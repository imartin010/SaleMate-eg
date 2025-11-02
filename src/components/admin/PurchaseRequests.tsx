import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Package, 
  DollarSign,
  FileText,
  ExternalLink,
  AlertCircle,
  Loader2,
  Eye
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { format } from 'date-fns';

interface PurchaseRequest {
  id: string;
  user_id: string;
  project_id: string;
  quantity: number;
  total_amount: number;
  status: 'pending' | 'approved' | 'rejected';
  receipt_url: string;
  receipt_file_name?: string;
  created_at: string;
  user?: {
    name: string;
    email: string;
    phone: string;
  };
  project?: {
    name: string;
    available_leads: number;
    price_per_lead: number;
  };
  signedReceiptUrl?: string;
}

export const PurchaseRequests: React.FC = () => {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [tableExists, setTableExists] = useState<boolean | null>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      
      // First check if purchase_requests table exists
      const { data: checkData, error: checkError } = await supabase
        .from('purchase_requests')
        .select('id')
        .limit(1);

      if (checkError) {
        // Table doesn't exist or other error
        console.warn('Lead purchase requests table not found:', checkError);
        setTableExists(false);
        setRequests([]);
        setLoading(false);
        return;
      }

      setTableExists(true);

      // Fetch purchase requests (basic query first)
      const { data, error } = await supabase
        .from('purchase_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching requests:', error);
        setRequests([]);
        setLoading(false);
        return;
      }
      
      // Manually fetch related data for each request
      const requestsWithRelations = await Promise.all(
        (data || []).map(async (request: any) => {
          // Fetch user profile
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('name, email, phone')
            .eq('id', request.user_id)
            .single();

          // Fetch project
          const { data: project } = await supabase
            .from('projects')
            .select('name, available_leads, price_per_lead')
            .eq('id', request.project_id)
            .single();

          // Generate signed URL for receipt
          let signedUrl = null;
          if (request.receipt_url) {
            signedUrl = await getReceiptUrl(request.receipt_url);
          }

          return {
            id: request.id,
            user_id: request.user_id,
            project_id: request.project_id,
            quantity: request.quantity,
            total_amount: request.total_amount,
            status: request.status,
            receipt_url: request.receipt_url,
            receipt_file_name: request.receipt_file_name,
            created_at: request.created_at,
            user: userProfile,
            project: project,
            signedReceiptUrl: signedUrl
          } as PurchaseRequest;
        })
      );
      
      setRequests(requestsWithRelations);
    } catch (error) {
      console.error('Error fetching purchase requests:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApprove = async (request: PurchaseRequest) => {
    if (!request.project || request.project.available_leads < request.quantity) {
      alert('Not enough leads available for this project!');
      return;
    }

    if (!confirm(`Approve purchase of ${request.quantity} leads for ${request.user?.name}?`)) {
      return;
    }

    try {
      setProcessingId(request.id);

      // Call RPC function to approve purchase (creates leads, updates project, updates request status)
      const { error } = await (supabase as any).rpc('approve_purchase_request', {
        request_id: request.id,
        lead_quantity: request.quantity
      });

      if (error) throw error;

      alert('Purchase approved and leads assigned successfully!');
      fetchRequests(); // Refresh list
    } catch (error: any) {
      console.error('Error approving purchase:', error);
      alert(`Failed to approve purchase: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!confirm('Are you sure you want to reject this purchase request?')) {
      return;
    }

    try {
      setProcessingId(requestId);

      const { error } = await supabase
        .from('purchase_requests')
        .update({ status: 'rejected', rejected_at: new Date().toISOString() })
        .eq('id', requestId);

      if (error) throw error;

      alert('Purchase request rejected.');
      fetchRequests();
    } catch (error: unknown) {
      console.error('Error rejecting purchase:', error);
      alert(`Failed to reject purchase: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setProcessingId(null);
    }
  };

  const getReceiptUrl = async (receiptPath: string) => {
    if (!receiptPath) return null;
    
    try {
      // Use signed URL for private buckets (valid for 1 hour)
      const { data, error } = await supabase.storage
        .from('payment-receipts')
        .createSignedUrl(receiptPath, 3600);
      
      if (error) {
        console.error('Error creating signed URL:', error);
        return null;
      }
      
      return data.signedUrl;
    } catch (error) {
      console.error('Error getting receipt URL:', error);
      return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Show setup message if table doesn't exist
  if (tableExists === false) {
    return (
      <div className="space-y-6">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="py-12">
            <div className="max-w-2xl mx-auto text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-yellow-900 mb-3">
                Purchase Requests System Not Set Up
              </h3>
              <p className="text-yellow-800 mb-6">
                The purchase requests table hasn't been created yet. Please run the database migration to enable this feature.
              </p>
              
              <div className="bg-white rounded-lg p-6 text-left mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Setup Instructions:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                  <li>Go to Supabase Dashboard → SQL Editor</li>
                  <li>Open the file: <code className="bg-gray-100 px-2 py-1 rounded">create_purchase_requests_system_fixed.sql</code></li>
                  <li>Copy all contents and paste into SQL Editor</li>
                  <li>Click "Run" button</li>
                  <li>Wait for success message</li>
                  <li>Refresh this page</li>
                </ol>
              </div>

              <div className="flex gap-3 justify-center">
                <Button onClick={fetchRequests} variant="default">
                  <Clock className="h-4 w-4 mr-2" />
                  Check Again
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Supabase
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Purchase Requests</h2>
        <Button onClick={fetchRequests} variant="outline" size="sm">
          <Clock className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No purchase requests yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">
                      Purchase Request #{request.id.slice(0, 8)}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(request.status)}
                      <span className="text-sm text-gray-500">
                        {format(new Date(request.created_at), 'MMM d, yyyy HH:mm')}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  {/* User Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <User className="h-4 w-4" />
                      Buyer Information
                    </div>
                    <div className="pl-6 space-y-1 text-sm">
                      <p className="font-medium">{request.user?.name || 'Unknown'}</p>
                      <p className="text-gray-600">{request.user?.email}</p>
                      <p className="text-gray-600">{request.user?.phone}</p>
                    </div>
                  </div>

                  {/* Project Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Package className="h-4 w-4" />
                      Project Details
                    </div>
                    <div className="pl-6 space-y-1 text-sm">
                      <p className="font-medium">{request.project?.name || 'Unknown Project'}</p>
                      <p className="text-gray-600">
                        Requesting: <span className="font-semibold text-blue-600">{request.quantity} leads</span>
                      </p>
                      <p className="text-gray-600">
                        Available: <span className="font-semibold">{request.project?.available_leads || 0} leads</span>
                      </p>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <DollarSign className="h-4 w-4" />
                      Payment Details
                    </div>
                    <div className="pl-6 space-y-1 text-sm">
                      <p className="text-gray-600">
                        Price per lead: <span className="font-semibold">{request.project?.price_per_lead || 0} EGP</span>
                      </p>
                      <p className="text-gray-600">
                        Subtotal: {request.quantity * (request.project?.price_per_lead || 0)} EGP
                      </p>
                      <p className="text-lg font-bold text-green-600">
                        Total: {request.total_amount} EGP
                      </p>
                    </div>
                  </div>
                </div>

                {/* Receipt Section */}
                {request.receipt_url && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 font-semibold text-gray-700">
                        <FileText className="h-4 w-4" />
                        Payment Receipt
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedReceipt(request.receipt_url)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Receipt
                      </Button>
                    </div>
                    {selectedReceipt === request.receipt_url && request.signedReceiptUrl && (
                      <div className="mt-3">
                        <img
                          src={request.signedReceiptUrl}
                          alt="Payment Receipt"
                          className="max-w-full h-auto rounded-lg border-2 border-blue-300 shadow-lg"
                          onError={(e) => {
                            console.error('Error loading receipt image');
                            e.currentTarget.src = '';
                            e.currentTarget.alt = 'Failed to load receipt';
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedReceipt(null)}
                          className="mt-2"
                        >
                          Hide Receipt
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Validation Warning */}
                {request.status === 'pending' && request.project && request.project.available_leads < request.quantity && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-red-800">
                      <strong>Warning:</strong> Not enough leads available! 
                      Project has {request.project.available_leads} leads but {request.quantity} requested.
                    </div>
                  </div>
                )}

                {/* Actions */}
                {request.status === 'pending' && (
                  <div className="flex items-center gap-3 pt-4 border-t">
                    <Button
                      onClick={() => handleApprove(request)}
                      disabled={processingId === request.id || !request.project || request.project.available_leads < request.quantity}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {processingId === request.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve & Assign Leads
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleReject(request.id)}
                      disabled={processingId === request.id}
                      variant="destructive"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

