import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useProjectStore } from '../../store/projects';
import type { Project } from '../../types';
import { 
  Building, 
  Percent, 
  Search, 
  ExternalLink,
  Star,
  TrendingUp,
  Award,
  Home
} from 'lucide-react';

// Sample commission data (in a real app, this would come from the database)
const PARTNER_COMMISSIONS = [
  {
    partnerId: '1',
    partnerName: 'Bold Routes',
    logo: 'partners-logos/bold-routes-logo.png',
    description: 'Leading real estate brokerage with premium service',
    website: 'https://boldroutes.com',
    commissionRates: {
      'default': 4.5,
      'premium': 5.0
    }
  },
  {
    partnerId: '2',
    partnerName: 'The Address Investments',
    logo: 'partners-logos/the-address-investments-logo.png',
    description: 'Premium investment consultancy and development',
    website: 'https://theaddress.com',
    commissionRates: {
      'default': 4.55,
      'luxury': 5.5
    }
  },
  {
    partnerId: '3',
    partnerName: 'Nawy',
    logo: 'partners-logos/nawy-partners.png',
    description: 'Digital real estate platform and marketplace',
    website: 'https://nawy.com',
    commissionRates: {
      'default': 3.2,
      'digital': 3.8
    }
  },
  {
    partnerId: '4',
    partnerName: 'CB Link by Coldwell Banker',
    logo: 'partners-logos/coldwell-banker-logo.png',
    description: 'CB Link by Coldwell Banker - Global real estate franchise with local expertise',
    website: 'https://cblink.com',
    commissionRates: {
      'default': 3.5,
      'luxury': 4.0
    }
  },
  {
    partnerId: '5',
    partnerName: 'SaleMate',
    logo: 'partners-logos/sale_mate_logo.png',
    description: 'Leading real estate platform connecting buyers with verified properties and trusted agents across Egypt',
    website: 'https://salemate.com',
    commissionRates: {
      'default': 5.0,
      'premium': 5.5
    }
  }
];

interface ProjectCommission {
  project: Project;
  commissions: Array<{
    partner: typeof PARTNER_COMMISSIONS[0];
    rate: number;
    category: string;
  }>;
}

const PartnersPage: React.FC = () => {
  const { projects, fetchProjects } = useProjectStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [projectCommissions, setProjectCommissions] = useState<ProjectCommission[]>([]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    // Generate commission data for projects
    const commissions: ProjectCommission[] = projects.map(project => {
      // Assign random but consistent commissions based on project characteristics
      const projectCommissions = PARTNER_COMMISSIONS.map(partner => {
        // Determine commission category based on project characteristics
        let category = 'default';
        let rate = partner.commissionRates.default;

        if (project.pricePerLead && project.pricePerLead > 150) {
          category = Object.keys(partner.commissionRates).find(key => key.includes('luxury') || key.includes('premium')) || 'default';
          rate = partner.commissionRates[category as keyof typeof partner.commissionRates] || partner.commissionRates.default;
        } else if (project.region.toLowerCase().includes('new cairo') || project.region.toLowerCase().includes('north coast')) {
          category = Object.keys(partner.commissionRates).find(key => key.includes('premium') || key.includes('digital')) || 'default';
          rate = partner.commissionRates[category as keyof typeof partner.commissionRates] || partner.commissionRates.default;
        }

        return {
          partner,
          rate,
          category
        };
      });

      return {
        project,
        commissions: projectCommissions
      };
    });

    setProjectCommissions(commissions);
  }, [projects]);

  const filteredCommissions = projectCommissions.filter(pc =>
    pc.project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pc.project.developer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pc.project.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pc.commissions.some(comm => comm.partner.partnerName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPartners = new Set(projectCommissions.flatMap(pc => pc.commissions.map(c => c.partner.partnerId))).size;
  const avgCommission = projectCommissions.length > 0 
    ? projectCommissions.reduce((sum, pc) => sum + pc.commissions.reduce((pSum, c) => pSum + c.rate, 0) / pc.commissions.length, 0) / projectCommissions.length
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gradient">Partner Commissions</h1>
            <p className="text-lg text-muted-foreground">
              Discover commission opportunities with our verified partners
            </p>
          </div>
          <Button onClick={() => fetchProjects(true)} variant="outline" size="sm">
            <TrendingUp className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects, developers, or partners..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 mx-auto mb-2">
            <Building className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-foreground">{filteredCommissions.length}</div>
          <div className="text-sm text-muted-foreground">Projects</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 mx-auto mb-2">
            <Award className="h-5 w-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-foreground">{totalPartners}</div>
          <div className="text-sm text-muted-foreground">Partners</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 mx-auto mb-2">
            <Percent className="h-5 w-5 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-foreground">{avgCommission.toFixed(1)}%</div>
          <div className="text-sm text-muted-foreground">Avg Commission</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-100 mx-auto mb-2">
            <Star className="h-5 w-5 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {Math.max(...projectCommissions.flatMap(pc => pc.commissions.map(c => c.rate))).toFixed(1)}%
          </div>
          <div className="text-sm text-muted-foreground">Highest Rate</div>
        </Card>
      </div>

      {/* Commission Cards */}
      <div className="space-y-6">
        {filteredCommissions.map((projectComm) => (
          <Card key={projectComm.project.id} className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{projectComm.project.name}</CardTitle>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Building className="h-4 w-4" />
                      {projectComm.project.developer}
                    </div>
                    <div className="flex items-center gap-1">
                      <Home className="h-4 w-4" />
                      {projectComm.project.region}
                    </div>
                  </div>
                </div>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {projectComm.commissions.length} Partners
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {projectComm.commissions
                  .sort((a, b) => b.rate - a.rate)
                  .map((commission, index) => (
                  <div 
                    key={commission.partner.partnerId}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 flex items-center justify-center">
                        {typeof commission.partner.logo === 'string' && commission.partner.logo.startsWith('partners-logos/') ? (
                          <img 
                            src={`https://wkxbhvckmgrmdkdkhnqo.supabase.co/storage/v1/object/public/${commission.partner.logo}`}
                            alt={`${commission.partner.partnerName} logo`}
                            className="w-8 h-8 object-contain"
                            onError={(e) => {
                              // Fallback to emoji if image fails
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallbackIcon = document.createElement('div');
                              fallbackIcon.className = 'w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center';
                              fallbackIcon.innerHTML = '🏢';
                              target.parentNode?.appendChild(fallbackIcon);
                            }}
                          />
                        ) : (
                          <div className="text-2xl">{commission.partner.logo}</div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">
                          {commission.partner.partnerName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {commission.category}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        {commission.rate}%
                      </div>
                      {index === 0 && (
                        <Badge variant="secondary" className="text-xs">
                          Best Rate
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Project Description */}
              {projectComm.project.description && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">{projectComm.project.description}</p>
                </div>
              )}

              {/* Best Commission Highlight */}
              {projectComm.commissions.length > 0 && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      Best Commission: {Math.max(...projectComm.commissions.map(c => c.rate)).toFixed(1)}% 
                      with {projectComm.commissions.find(c => c.rate === Math.max(...projectComm.commissions.map(c => c.rate)))?.partner.partnerName}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Results */}
      {filteredCommissions.length === 0 && (
        <div className="text-center py-12">
          <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No commission data found</h3>
          <p className="text-muted-foreground">
            {searchTerm ? 'Try adjusting your search terms' : 'Commission data will be available soon'}
          </p>
        </div>
      )}

      {/* Partner Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Partner Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {PARTNER_COMMISSIONS.map((partner) => (
              <div key={partner.partnerId} className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 flex items-center justify-center">
                    {typeof partner.logo === 'string' && partner.logo.startsWith('partners-logos/') ? (
                      <img 
                        src={`https://wkxbhvckmgrmdkdkhnqo.supabase.co/storage/v1/object/public/${partner.logo}`}
                        alt={`${partner.partnerName} logo`}
                        className="w-8 h-8 object-contain"
                        onError={(e) => {
                          // Fallback to emoji if image fails
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallbackIcon = document.createElement('div');
                          fallbackIcon.className = 'w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center';
                          fallbackIcon.innerHTML = '🏢';
                          target.parentNode?.appendChild(fallbackIcon);
                        }}
                      />
                    ) : (
                      <div className="text-2xl">{partner.logo}</div>
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{partner.partnerName}</div>
                    <div className="text-sm text-muted-foreground">
                      {Object.keys(partner.commissionRates).length} commission tiers
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">
                  {partner.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="font-medium text-green-600">
                      Up to {Math.max(...Object.values(partner.commissionRates))}%
                    </span>
                  </div>
                  <a 
                    href={partner.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-2 py-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Commission Info */}
      <Card>
        <CardHeader>
          <CardTitle>How Partner Commissions Work</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs mt-0.5">
                1
              </div>
              <div>
                <div className="font-medium text-foreground">Choose Your Partner</div>
                <div>Select a partner from the list above based on their commission rate and expertise.</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-xs mt-0.5">
                2
              </div>
              <div>
                <div className="font-medium text-foreground">Close the Deal</div>
                <div>Work with your leads and close deals under the partner's agreement.</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs mt-0.5">
                3
              </div>
              <div>
                <div className="font-medium text-foreground">Earn Commission</div>
                <div>Receive the percentage shown as commission on the deal value.</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PartnersPage;
