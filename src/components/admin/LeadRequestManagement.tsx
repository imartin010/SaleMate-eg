import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { supabase } from '../../lib/supabaseClient';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  MessageSquare,
  DollarSign,
  Calendar
} from 'lucide-react';

interface LeadRequest {
  id: string;
  user_id: string;
  project_id: string;
  project_name: string;
  developer: string;
  region: string;
  requested_quantity: number;
  price_per_lead: number;
  total_amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'refunded';
  user_notes: string;
  admin_notes: string;
  created_at: string;
  first_name?: string;
  last_name?: string;
  email: string;
}

export const LeadRequestManagement: React.FC = () => {
  const [requests, setRequests] = useState<LeadRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<LeadRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadLeadRequests();
  }, []);

  const loadLeadRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lead_request_details')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (err: any) {
      console.error('Error loading lead requests:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId: string, status: string) => {
    try {
      setIsUpdating(true);
      const { error } = await supabase
        .from('lead_requests')
        .update({ 
          status,
          admin_notes: adminNotes || null,
          updated_at: new Date().toISOString(),
          ...(status === 'approved' && { approved_at: new Date().toISOString() }),
          ...(status === 'fulfilled' && { fulfilled_at: new Date().toISOString() })
        })
        .eq('id', requestId);

      if (error) throw error;

      await loadLeadRequests();
      setSelectedRequest(null);
      setAdminNotes('');
    } catch (err: any) {
      console.error('Error updating request:', err);
      setError(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'fulfilled': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lead requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Lead Request Management</h2>
        <Button onClick={loadLeadRequests} variant="outline">
          Refresh
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4">
        {requests.map((request) => (
          <Card key={request.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{request.project_name}</CardTitle>
                  <p className="text-sm text-gray-600">
                    {request.developer} • {request.region}
                  </p>
                  <p className="text-sm text-gray-500">
                    Requested by: {request.first_name || ''} {request.last_name || ''} ({request.email})
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge className={getStatusColor(request.status)}>
                    {request.status}
                  </Badge>
                  <Badge variant="outline">
                    {request.payment_status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="font-medium text-gray-600">Quantity</div>
                  <div className="text-lg font-semibold">{request.requested_quantity}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-600">Price per Lead</div>
                  <div className="text-lg font-semibold">EGP {request.price_per_lead}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-600">Total Amount</div>
                  <div className="text-lg font-semibold text-green-600">EGP {request.total_amount}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-600">Requested</div>
                  <div className="text-sm">{formatDate(request.created_at)}</div>
                </div>
              </div>

              {request.user_notes && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="h-4 w-4 text-gray-600" />
                    <span className="font-medium text-gray-700">User Notes</span>
                  </div>
                  <p className="text-sm text-gray-600">{request.user_notes}</p>
                </div>
              )}

              {request.admin_notes && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-700">Admin Notes</span>
                  </div>
                  <p className="text-sm text-blue-600">{request.admin_notes}</p>
                </div>
              )}

              {request.status === 'pending' && (
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => setSelectedRequest(request)}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Review
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {requests.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Lead Requests</h3>
          <p className="text-gray-600">No lead requests have been submitted yet.</p>
        </div>
      )}

      {/* Review Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Review Lead Request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Project:</span>
                  <span>{selectedRequest.project_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Quantity:</span>
                  <span>{selectedRequest.requested_quantity} leads</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Total Amount:</span>
                  <span className="font-semibold">EGP {selectedRequest.total_amount}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Admin Notes</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this request..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => updateRequestStatus(selectedRequest.id, 'approved')}
                  disabled={isUpdating}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => updateRequestStatus(selectedRequest.id, 'rejected')}
                  disabled={isUpdating}
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </div>

              <Button
                variant="outline"
                onClick={() => {
                  setSelectedRequest(null);
                  setAdminNotes('');
                }}
                className="w-full"
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
