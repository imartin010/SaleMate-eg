import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/auth';
import { supabase } from '../../lib/supabaseClient';
import { PageTitle } from '../../components/common/PageTitle';
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
  RefreshCw
} from 'lucide-react';
import type { Database } from '../../types/database';

type Lead = Database['public']['Tables']['leads']['Row'] & {
  projects?: { name: string; developer: string; region: string } | null;
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

const MyLeads: React.FC = () => {
  const { user } = useAuthStore();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<LeadStage | ''>('');
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
          projects(name, developer, region)
        `)
        .eq('buyer_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (err) {
      console.error('Error loading leads:', err);
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

      // Update local state
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

      // Update local state
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
    const matchesStage = !stageFilter || lead.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  const getStageColor = (stage: LeadStage) => {
    switch (stage) {
      case 'New Lead': return 'bg-blue-100 text-blue-800';
      case 'Potential': return 'bg-yellow-100 text-yellow-800';
      case 'Hot Case': return 'bg-red-100 text-red-800';
      case 'Meeting Done': return 'bg-green-100 text-green-800';
      case 'No Answer': return 'bg-gray-100 text-gray-800';
      case 'Call Back': return 'bg-purple-100 text-purple-800';
      case 'Whatsapp': return 'bg-green-100 text-green-800';
      case 'Wrong Number': return 'bg-red-100 text-red-800';
      case 'Non Potential': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
        title="My Leads"
        subtitle={`Manage your ${leads.length} purchased leads`}
        icon={Users}
        color="blue"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <div className="text-xl font-bold">{leads.length}</div>
            <div className="text-sm text-muted-foreground">Total Leads</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <div className="text-xl font-bold">{leads.filter(l => l.stage === 'New Lead').length}</div>
            <div className="text-sm text-muted-foreground">New Leads</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Phone className="h-6 w-6 mx-auto mb-2 text-orange-600" />
            <div className="text-xl font-bold">{leads.filter(l => l.stage === 'Hot Case').length}</div>
            <div className="text-sm text-muted-foreground">Hot Cases</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-6 w-6 mx-auto mb-2 text-purple-600" />
            <div className="text-xl font-bold">{leads.filter(l => l.stage === 'Meeting Done').length}</div>
            <div className="text-sm text-muted-foreground">Meetings</div>
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
                  placeholder="Search leads by name, phone, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={stageFilter} onValueChange={(value) => setStageFilter(value as LeadStage | '')}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Stages</SelectItem>
                {LEAD_STAGES.map(stage => (
                  <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={loadLeads} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Leads List */}
      {filteredLeads.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No leads found</h3>
            <p className="text-muted-foreground mb-4">
              {leads.length === 0 
                ? "You haven't purchased any leads yet. Visit the Shop to buy leads from projects."
                : 'No leads match your search criteria.'}
            </p>
            {leads.length === 0 && (
              <Button onClick={() => window.location.href = '/shop'}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Visit Shop
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredLeads.map((lead) => (
            <Card key={lead.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{lead.client_name}</h4>
                      <Badge className={getStageColor(lead.stage)}>{lead.stage}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {lead.client_phone}
                      </div>
                      {lead.client_email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {lead.client_email}
                        </div>
                      )}
                      {lead.projects && (
                        <div className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {lead.projects.name}
                        </div>
                      )}
                    </div>
                    {lead.client_job_title && (
                      <p className="text-sm text-muted-foreground">Position: {lead.client_job_title}</p>
                    )}
                    {lead.feedback && (
                      <p className="text-sm bg-muted p-2 rounded">Notes: {lead.feedback}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Select 
                      value={lead.stage} 
                      onValueChange={(value) => updateLeadStage(lead.id, value as LeadStage)}
                      disabled={updatingLead === lead.id}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LEAD_STAGES.map(stage => (
                          <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Input
                      placeholder="Add notes..."
                      defaultValue={lead.feedback || ''}
                      onBlur={(e) => {
                        if (e.target.value !== (lead.feedback || '')) {
                          updateLeadFeedback(lead.id, e.target.value);
                        }
                      }}
                      className="w-40 text-xs"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyLeads;