import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/auth';
import { supabase } from '../../lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { 
  Search, 
  Filter, 
  Users,
  Phone,
  Mail,
  Building,
  Calendar,
  Loader2,
  RefreshCw,
  CheckCircle,
  ShoppingCart,
  MessageCircle,
  FileText,
  TrendingUp,
  Activity,
  Star,
  MapPin
} from 'lucide-react';
import type { Database } from '../../types/database';

type Lead = Database['public']['Tables']['leads']['Row'] & {
  projects?: { 
    name: string | any; 
    region: string | any; 
    developers?: { name: string } | null;
  } | null;
};

type LeadStage = Database['public']['Enums']['lead_stage'];

const LEAD_STAGES: LeadStage[] = [
  'New Lead',
  'Potential', 
  'Hot Case',
  'Meeting Done',
  'No Answer',
  'Call Back',
  'Whatsapp',
  'Wrong Number',
  'Non Potential'
];

const EnhancedMyLeads: React.FC = () => {
  const { user } = useAuthStore();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<LeadStage | 'all'>('all');
  const [updatingLead, setUpdatingLead] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadLeads();
    }
  }, [user]);

  const loadLeads = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          projects(
            id,
            name,
            region,
            developers:developers ( name )
          )
        `)
        .eq('buyer_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading leads:', error);
        setLeads([]);
      } else {
        setLeads(data || []);
      }
    } catch (err) {
      console.error('Error loading leads:', err);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const updateLeadStage = async (leadId: string, newStage: LeadStage) => {
    setUpdatingLead(leadId);
    try {
      const { error } = await supabase
        .from('leads')
        .update({ 
          stage: newStage,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (error) throw error;

      setLeads(prev => prev.map(lead => 
        lead.id === leadId ? { ...lead, stage: newStage } : lead
      ));
    } catch (err) {
      console.error('Error updating lead stage:', err);
    } finally {
      setUpdatingLead(null);
    }
  };

  const updateLeadFeedback = async (leadId: string, feedback: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ 
          feedback,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (error) throw error;

      setLeads(prev => prev.map(lead => 
        lead.id === leadId ? { ...lead, feedback } : lead
      ));
    } catch (err) {
      console.error('Error updating lead feedback:', err);
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.client_phone.includes(searchTerm) ||
                         lead.client_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = stageFilter === 'all' || !stageFilter || lead.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  const getStageColor = (stage: LeadStage) => {
    switch (stage) {
      case 'New Lead': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Potential': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Hot Case': return 'bg-red-100 text-red-800 border-red-200';
      case 'Meeting Done': return 'bg-green-100 text-green-800 border-green-200';
      case 'No Answer': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Call Back': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Whatsapp': return 'bg-green-100 text-green-800 border-green-200';
      case 'Wrong Number': return 'bg-red-100 text-red-800 border-red-200';
      case 'Non Potential': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStageStats = () => {
    const stats = LEAD_STAGES.reduce((acc, stage) => {
      acc[stage] = leads.filter(lead => lead.stage === stage).length;
      return acc;
    }, {} as Record<LeadStage, number>);
    return stats;
  };

  const stageStats = getStageStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-muted-foreground">Loading your leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gradient">My Leads</h1>
                <p className="text-sm text-muted-foreground">Manage your {leads.length} purchased leads</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button onClick={loadLeads} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={() => window.location.href = '/app/shop'}>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Buy More Leads
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{leads.length}</div>
              <div className="text-sm text-blue-600 font-medium">Total Leads</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stageStats['Hot Case'] || 0}</div>
              <div className="text-sm text-green-600 font-medium">Hot Cases</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stageStats['Meeting Done'] || 0}</div>
              <div className="text-sm text-orange-600 font-medium">Meetings</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(((stageStats['Meeting Done'] || 0) / Math.max(leads.length, 1)) * 100)}%
              </div>
              <div className="text-sm text-purple-600 font-medium">Conversion</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search leads by name, phone, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={stageFilter} onValueChange={(value) => setStageFilter(value as LeadStage | 'all')}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {LEAD_STAGES.map(stage => (
                  <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leads Grid */}
      {filteredLeads.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No leads found</h3>
            <p className="text-muted-foreground mb-6">
              {leads.length === 0 
                ? "You haven't purchased any leads yet. Visit the Shop to buy leads from projects."
                : 'No leads match your search criteria.'}
            </p>
            {leads.length === 0 && (
              <Button onClick={() => window.location.href = '/app/shop'}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Visit Shop
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredLeads.map((lead) => (
            <Card key={lead.id} className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold text-lg shadow-lg">
                      {lead.client_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{lead.client_name}</CardTitle>
                      {lead.projects && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Building className="h-3 w-3" />
                          {lead.projects.name}
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge className={`${getStageColor(lead.stage)} px-3 py-1 rounded-lg font-medium`}>
                    {lead.stage}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Contact Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${lead.client_phone}`} className="text-blue-600 hover:underline">
                      {lead.client_phone}
                    </a>
                  </div>
                  
                  {lead.client_email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${lead.client_email}`} className="text-blue-600 hover:underline">
                        {lead.client_email}
                      </a>
                    </div>
                  )}
                  
                  {lead.projects && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{lead.projects.region}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
                    <Phone className="h-4 w-4 mr-1" />
                    Call
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 border-green-500 text-green-600 hover:bg-green-50">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    WhatsApp
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 border-purple-500 text-purple-600 hover:bg-purple-50">
                    <FileText className="h-4 w-4 mr-1" />
                    Offer
                  </Button>
                </div>

                {/* Stage Selector */}
                <div className="space-y-2">
                  <Select 
                    value={lead.stage} 
                    onValueChange={(value) => updateLeadStage(lead.id, value as LeadStage)}
                    disabled={updatingLead === lead.id}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAD_STAGES.map(stage => (
                        <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Notes */}
                  <Input
                    placeholder="Add notes..."
                    defaultValue={lead.feedback || ''}
                    onBlur={(e) => {
                      if (e.target.value !== (lead.feedback || '')) {
                        updateLeadFeedback(lead.id, e.target.value);
                      }
                    }}
                    className="text-sm"
                  />
                </div>

                {/* Metadata */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(lead.created_at).toLocaleDateString()}
                  </div>
                  {lead.source && (
                    <Badge variant="outline" className="text-xs">
                      {lead.source}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Performance Insights */}
      {leads.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Performance Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stageStats['New Lead'] || 0}</div>
                <div className="text-sm text-muted-foreground">New Leads</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stageStats['Potential'] || 0}</div>
                <div className="text-sm text-muted-foreground">Potential</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stageStats['Hot Case'] || 0}</div>
                <div className="text-sm text-muted-foreground">Hot Cases</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stageStats['Meeting Done'] || 0}</div>
                <div className="text-sm text-muted-foreground">Meetings</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedMyLeads;
