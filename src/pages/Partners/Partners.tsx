import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { PageTitle } from '../../components/common/PageTitle';
import { supabase } from "../../lib/supabaseClient"
import { 
  Search, 
  Building,
  MapPin,
  Users,
  Percent,
  TrendingUp,
  Award,
  Home,
  RefreshCw,
  Eye,
  DollarSign,
  Handshake
} from 'lucide-react';

interface CompoundProject {
  id: string;
  name: string;
  developer: string;
  area: string;
  totalUnits: number;
  averagePrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  propertyTypes: string[];
  launchStatus: boolean;
  readyBy: string | null;
  description: string;
  image?: string;
}

// Partner commission data - this is what you wanted to edit
const PARTNER_COMMISSIONS = [
  {
    partnerId: '1',
    partnerName: 'SaleMate',
    logo: 'partners-logos/sale_mate_logo.png',
    commissionRates: {
      'default': 5.0,
      'premium': 5.5,
      'luxury': 6.0
    }
  },
  {
    partnerId: '2',
    partnerName: 'Bold Routes',
    logo: 'partners-logos/bold-routes-logo.png',
    commissionRates: {
      'default': 4.5,
      'premium': 5.0,
      'luxury': 5.5
    }
  },
  {
    partnerId: '3',
    partnerName: 'The Address Investments',
    logo: 'partners-logos/the-address-investments-logo.png',
    commissionRates: {
      'default': 4.55,
      'premium': 5.0,
      'luxury': 5.5
    }
  },
  {
    partnerId: '4',
    partnerName: 'Nawy',
    logo: 'partners-logos/nawy-partners.png',
    commissionRates: {
      'default': 3.2,
      'premium': 3.8,
      'digital': 4.0
    }
  },
  {
    partnerId: '5',
    partnerName: 'CB Link by Coldwell Banker',
    logo: 'partners-logos/coldwell-banker-logo.png',
    commissionRates: {
      'default': 3.5,
      'premium': 4.0,
      'luxury': 4.5
    }
  }
];

export const Partners: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [projects, setProjects] = useState<CompoundProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCompoundProjects();
  }, []);

  const loadCompoundProjects = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🏢 Loading compound projects for Partners page...');
      
      // Fetch compound data from inventory
      const { data, error: queryError } = await (supabase as any)
        .from('salemate-inventory')
        .select('compound, developer, area, price_in_egp, property_type, is_launch, ready_by, unit_area, image')
        .not('compound', 'is', null);

      if (queryError) {
        throw new Error(`Database error: ${queryError.message}`);
      }

      // Group by compound and aggregate data
      const compoundMap = new Map<string, CompoundProject>();

      data?.forEach(property => {
        const compound = property.compound as any;
        let compoundName = '';
        
        if (compound?.name) {
          compoundName = compound.name;
        } else if (typeof compound === 'string') {
          try {
            const parsed = JSON.parse(compound.replace(/'/g, '"'));
            compoundName = parsed.name || '';
          } catch {
            compoundName = compound;
          }
        }

        if (!compoundName) return;

        const developer = property.developer as any;
        let developerName = '';
        if (developer?.name) {
          developerName = developer.name;
        } else if (typeof developer === 'string') {
          try {
            const parsed = JSON.parse(developer.replace(/'/g, '"'));
            developerName = parsed.name || '';
          } catch {
            developerName = developer;
          }
        }

        const area = property.area as any;
        let areaName = '';
        if (area?.name) {
          areaName = area.name;
        } else if (typeof area === 'string') {
          try {
            const parsed = JSON.parse(area.replace(/'/g, '"'));
            areaName = parsed.name || '';
          } catch {
            areaName = area;
          }
        }

        const propertyType = property.property_type as any;
        let propertyTypeName = '';
        if (propertyType?.name) {
          propertyTypeName = propertyType.name;
        } else if (typeof propertyType === 'string') {
          try {
            const parsed = JSON.parse(propertyType.replace(/'/g, '"'));
            propertyTypeName = parsed.name || '';
          } catch {
            propertyTypeName = propertyType;
          }
        }

        if (!compoundMap.has(compoundName)) {
          compoundMap.set(compoundName, {
            id: compoundName.toLowerCase().replace(/\s+/g, '-'),
            name: compoundName,
            developer: developerName,
            area: areaName,
            totalUnits: 0,
            averagePrice: 0,
            priceRange: { min: Infinity, max: 0 },
            propertyTypes: [],
            launchStatus: false,
            readyBy: null,
            description: `Premium residential compound in ${areaName} by ${developerName}`,
            image: property.image,
          });
        }

        const project = compoundMap.get(compoundName)!;
        project.totalUnits += 1;
        
        if (property.price_in_egp) {
          project.priceRange.min = Math.min(project.priceRange.min, property.price_in_egp);
          project.priceRange.max = Math.max(project.priceRange.max, property.price_in_egp);
        }
        
        if (property.is_launch) {
          project.launchStatus = true;
        }
        
        if (property.ready_by && !project.readyBy) {
          project.readyBy = property.ready_by;
        }
        
        if (propertyTypeName && !project.propertyTypes.includes(propertyTypeName)) {
          project.propertyTypes.push(propertyTypeName);
        }
      });

      // Calculate average prices
      const projectsArray = Array.from(compoundMap.values()).map(project => {
        project.averagePrice = project.priceRange.min !== Infinity ? 
          Math.round((project.priceRange.min + project.priceRange.max) / 2) : 0;
        return project;
      });

      console.log(`✅ Loaded ${projectsArray.length} compound projects for Partners page`);
      setProjects(projectsArray);

    } catch (error: any) {
      console.error('❌ Error loading compound projects:', error);
      setError(error.message || 'Failed to load projects');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter projects based on search
  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.developer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.area.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate commission for a project based on its characteristics
  const getCommissionRate = (project: CompoundProject, partner: typeof PARTNER_COMMISSIONS[0]) => {
    // Determine commission category based on project characteristics
    if (project.averagePrice > 50000000) { // Over 50M EGP = luxury
      return partner.commissionRates.luxury || partner.commissionRates.premium || partner.commissionRates.default;
    } else if (project.averagePrice > 20000000 || project.launchStatus) { // Over 20M EGP or launch project = premium
      return partner.commissionRates.premium || partner.commissionRates.default;
    } else if (partner.commissionRates.digital && project.area.toLowerCase().includes('new cairo')) { // Digital for tech-savvy areas
      return partner.commissionRates.digital;
    } else {
      return partner.commissionRates.default;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-4">
          <div className="h-10 bg-gray-200 rounded animate-pulse w-1/3"></div>
          <div className="h-5 bg-gray-200 rounded animate-pulse w-1/2"></div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card-modern p-6">
              <div className="h-8 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-gradient">Partner Commissions</h1>
          <p className="text-lg text-muted-foreground">
            Discover commission opportunities with our verified partners
          </p>
        </div>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Failed to load projects
          </h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadCompoundProjects}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="space-y-4">
        <PageTitle
          title="Partner Commissions"
          subtitle="Discover commission opportunities with our verified partners"
          icon={Handshake}
          color="indigo"
        />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Button onClick={loadCompoundProjects} variant="outline" size="sm">
            <TrendingUp className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 mx-auto mb-2">
              <Building className="h-5 w-5 text-blue-600" />
              </div>
            <div className="text-2xl font-bold text-foreground">{filteredProjects.length}</div>
            <div className="text-sm text-muted-foreground">Projects</div>
          </Card>
          
          <Card className="p-4 text-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 mx-auto mb-2">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">{PARTNER_COMMISSIONS.length}</div>
            <div className="text-sm text-muted-foreground">Partners</div>
          </Card>
          
          <Card className="p-4 text-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 mx-auto mb-2">
              <Percent className="h-5 w-5 text-purple-600" />
          </div>
            <div className="text-2xl font-bold text-foreground">4.4%</div>
            <div className="text-sm text-muted-foreground">Avg Commission</div>
          </Card>
          
          <Card className="p-4 text-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-100 mx-auto mb-2">
              <Award className="h-5 w-5 text-orange-600" />
          </div>
            <div className="text-2xl font-bold text-foreground">6.0%</div>
            <div className="text-sm text-muted-foreground">Highest Rate</div>
          </Card>
        </div>

        {/* Search */}
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects, developers, or areas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Project Cards with Commission Rates */}
      <div className="space-y-6">
        {filteredProjects.map((project) => (
          <Card key={project.id} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                      {project.image ? (
                        <img 
                          src={project.image}
                          alt={`${project.name} image`}
                          className="w-12 h-12 object-cover rounded"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = document.createElement('div');
                                fallback.className = 'w-12 h-12 text-2xl flex items-center justify-center text-blue-600';
                                fallback.innerHTML = '🏢';
                                target.parentNode?.appendChild(fallback);
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12 text-2xl flex items-center justify-center text-blue-600">🏢</div>
                          )}
                        </div>
                        </div>
                  <div>
                    <CardTitle className="text-xl">{project.name}</CardTitle>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Building className="w-4 h-4" />
                        {project.developer}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {project.area}
                        </div>
                      <div className="flex items-center gap-1">
                        <Home className="w-4 h-4" />
                        {project.totalUnits} Units
                      </div>
                    </div>
                  </div>
                    </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">
                    {project.averagePrice > 0 ? formatCurrency(project.averagePrice) : 'On Request'}
                  </div>
                  <div className="text-sm text-gray-500">Average Price</div>
                      </div>
                    </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">{project.description}</p>
                    
                {/* Partner Commission Rates */}
                        <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Commission Rates by Partner:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {PARTNER_COMMISSIONS.map((partner) => {
                      const commissionRate = getCommissionRate(project, partner);
                      return (
                        <div key={partner.partnerId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                              {partner.partnerName.charAt(0)}
                            </div>
                            <span className="font-medium text-sm">{partner.partnerName}</span>
                        </div>
                        <div className="text-right">
                            <div className="font-bold text-green-600">{commissionRate}%</div>
                            <div className="text-xs text-gray-500">commission</div>
                          </div>
                        </div>
                      );
                    })}
                        </div>
                      </div>
                      
                {/* Best Commission Highlight */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-800">
                      Best Commission: {Math.max(...PARTNER_COMMISSIONS.map(p => getCommissionRate(project, p)))}% 
                      with {PARTNER_COMMISSIONS.find(p => getCommissionRate(project, p) === Math.max(...PARTNER_COMMISSIONS.map(p => getCommissionRate(project, p))))?.partnerName}
                    </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        
        {filteredProjects.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Try adjusting your search terms to find the right project for your needs.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};