import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { 
  Phone, 
  MessageCircle, 
  Mail, 
  Users, 
  Target, 
  TrendingUp, 
  BarChart3 
} from 'lucide-react';

interface Lead {
  id: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  project: string;
  platform: string;
  stage: string;
}

const mockLeads: Lead[] = [];

const getStageColor = (stage: string) => {
  switch (stage) {
    case 'New Lead': return 'bg-blue-100 text-blue-800';
    case 'Potential': return 'bg-yellow-100 text-yellow-800';
    case 'Hot Case': return 'bg-red-100 text-red-800';
    case 'Meeting Done': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const SimpleCRM: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gradient">My Leads</h1>
        <p className="text-muted-foreground">Manage your lead pipeline and drive conversions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
          <div className="text-2xl font-bold">{mockLeads.length}</div>
          <div className="text-sm text-muted-foreground">Total Leads</div>
        </Card>
        
        <Card className="p-4 text-center">
          <Target className="h-8 w-8 mx-auto mb-2 text-green-600" />
          <div className="text-2xl font-bold">{mockLeads.filter(l => l.stage === 'New Lead').length}</div>
          <div className="text-sm text-muted-foreground">New Leads</div>
        </Card>
        
        <Card className="p-4 text-center">
          <TrendingUp className="h-8 w-8 mx-auto mb-2 text-red-600" />
          <div className="text-2xl font-bold">{mockLeads.filter(l => l.stage === 'Hot Case').length}</div>
          <div className="text-sm text-muted-foreground">Hot Cases</div>
        </Card>
        
        <Card className="p-4 text-center">
          <BarChart3 className="h-8 w-8 mx-auto mb-2 text-purple-600" />
          <div className="text-2xl font-bold">33%</div>
          <div className="text-sm text-muted-foreground">Conversion</div>
        </Card>
      </div>

      {/* Leads Grid */}
      {mockLeads.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mockLeads.map(lead => (
            <Card key={lead.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{lead.clientName}</CardTitle>
                  <Badge className={getStageColor(lead.stage)}>
                    {lead.stage}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{lead.project}</p>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{lead.clientPhone}</span>
                  </div>
                  
                  {lead.clientEmail && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{lead.clientEmail}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className="text-xs">
                      {lead.platform}
                    </Badge>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" className="flex-1">
                    <Phone className="h-4 w-4 mr-1" />
                    Call
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    WhatsApp
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No Leads Available</h3>
          <p className="text-muted-foreground mb-4">
            You don't have any leads yet. Purchase leads from the shop to get started.
          </p>
          <Button variant="outline">
            Go to Shop
          </Button>
        </div>
      )}

      <div className="text-center p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-700">
          🔧 Simple CRM Mode: Sample data has been removed for production use
        </p>
      </div>
    </div>
  );
};
