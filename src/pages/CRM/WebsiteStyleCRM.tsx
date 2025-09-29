import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/auth';
import { supabase } from '../../lib/supabaseClient';
import { CardContent, CardHeader, CardTitle } from '../../components/ui/card';
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


  MapPin,
  Target,

  AlertCircle
} from 'lucide-react';
import type { Database } from '../../types/database';

type Lead = Database['public']['Tables']['leads']['Row'] & {
  projects?: {
    id: string;
    name: string;
    region: string;
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

const WebsiteStyleCRM: React.FC = () => {
  const { user } = useAuthStore();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<LeadStage | 'all'>('all');
  const [updatingLead, setUpdatingLead] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const loadLeads = React.useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('📋 Loading CRM leads...');
      
      const { data, error: queryError } = await supabase
        .from('leads')
        .select(`
          *,
          projects(
            id,
            name,
            region
          )
        `)
        .eq('buyer_user_id', user.id)
        .order('created_at', { ascending: false });

      if (queryError) {
        console.warn('Database query failed, using fallback data:', queryError);
        setError(queryError.message);
        setLeads([]);
      } else {
        console.log(`✅ Loaded ${data?.length || 0} leads from database`);
        setLeads((data as Lead[]) || []);
      }
      
      setLastRefresh(new Date());
    } catch (err: unknown) {
      console.error('Error loading leads:', err);
      setError((err instanceof Error ? err.message : String(err)) || 'Failed to load leads');
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadLeads();
    }
  }, [user, loadLeads]);

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
  const stages = Array.from(new Set(leads.map(l => l.stage))).sort();
  
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.client_phone.includes(searchTerm) ||
                         lead.client_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = stageFilter === 'all' || !stageFilter || lead.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setStageFilter('all');
  };

  const hasActiveFilters = searchTerm || (stageFilter && stageFilter !== 'all');

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
            <h1 className="text-4xl font-bold text-gradient">My Leads</h1>
            <p className="text-lg text-muted-foreground">
              Manage your {leads.length} purchased leads and drive conversions
            </p>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-green-600 font-medium">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadLeads}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              size="sm"
              onClick={() => window.location.href = '/app/shop'}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Buy More Leads
            </Button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">{error}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setError(null)}
              className="ml-auto"
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* CRM Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card-modern card-hover p-4 text-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 mx-auto mb-2">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">{leads.length}</div>
            <div className="text-sm text-muted-foreground">Total Leads</div>
          </div>
          
          <div className="card-modern card-hover p-4 text-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 mx-auto mb-2">
              <Target className="h-5 w-5 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">{stageStats['Hot Case'] || 0}</div>
            <div className="text-sm text-muted-foreground">Hot Cases</div>
          </div>
          
          <div className="card-modern card-hover p-4 text-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 mx-auto mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">{stageStats['Meeting Done'] || 0}</div>
            <div className="text-sm text-muted-foreground">Meetings</div>
          </div>
          
          <div className="card-modern card-hover p-4 text-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 mx-auto mb-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {Math.round(((stageStats['Meeting Done'] || 0) / Math.max(leads.length, 1)) * 100)}%
            </div>
            <div className="text-sm text-muted-foreground">Conversion</div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>

        {/* Quick Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Button
            variant={stageFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStageFilter('all')}
            className="whitespace-nowrap shrink-0"
          >
            All Stages
          </Button>
          {stages.slice(0, 6).map(stage => (
            <Button
              key={stage}
              variant={stageFilter === stage ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStageFilter(stage || 'New Lead')}
              className="whitespace-nowrap shrink-0"
            >
              {stage}
            </Button>
          ))}
        </div>

        {/* Advanced Filters */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Showing {filteredLeads.length} of {leads.length} leads
            </span>
            {hasActiveFilters && (
              <span className="ml-1 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                {[searchTerm, stageFilter !== 'all'].filter(Boolean).length} filters
              </span>
            )}
          </div>
          
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Leads Grid */}
      {filteredLeads.length === 0 ? (
        <div className="text-center py-12">
          <div className="card-modern p-8">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No leads found</h3>
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
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredLeads.map((lead) => (
            <div key={lead.id} className="card-modern card-hover">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold">
                      {lead.client_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{lead.client_name}</CardTitle>
                      {lead.projects && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Building className="h-3 w-3" />
                          <span>{lead.projects.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge className={`${getStageColor(lead.stage || 'New Lead')} font-medium`}>
                    {lead.stage || 'New Lead'}
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
                <div className="grid grid-cols-3 gap-2">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Phone className="h-3 w-3 mr-1" />
                    Call
                  </Button>
                  <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white">
                    <MessageCircle className="h-3 w-3 mr-1" />
                    WhatsApp
                  </Button>
                  <Button size="sm" className="bg-purple-500 hover:bg-purple-600 text-white">
                    <FileText className="h-3 w-3 mr-1" />
                    Offer
                  </Button>
                </div>

                {/* Stage Selector */}
                <Select 
                  value={lead.stage || 'New Lead'} 
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

                {/* Metadata */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{lead.created_at ? new Date(lead.created_at).toLocaleDateString() : 'Unknown'}</span>
                  </div>
                  {lead.source && (
                    <Badge variant="outline" className="text-xs">
                      {lead.source}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default WebsiteStyleCRM;
