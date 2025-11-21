import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { PageTitle } from '../../components/common/PageTitle';
import { supabase } from "../../lib/supabaseClient"
import { 
  Search, 
  Building,
  Calculator,
  Heart,
  X,
  Phone,
  MessageCircle,
  Eye,
  Handshake
} from 'lucide-react';

interface PartnerProject {
  id: number;
  compound_name: string;
  compound_id: string;
  developer: string;
  area: string;
  starting_price: number;
  image_url: string;
  phone_number: string;
  developer_sales_name: string;
  
  // Commission rates for each partner
  salemate_commission: number | null;
  address_investments_commission: number | null;
  bold_routes_commission: number | null;
  nawy_partners_commission: number | null;
  coldwell_banker_commission: number | null;
  connect_homes_commission: number | null;
  view_investments_commission: number | null;
  y_network_commission: number | null;
  byit_commission: number | null;
  
  active_partners_count: number;
  highest_commission_rate: number;
}

interface PartnerInfo {
  name: string;
  displayName: string;
  commissionField: keyof PartnerProject;
  color: string;
}

const PARTNERS_INFO: PartnerInfo[] = [
  { name: 'salemate', displayName: 'SaleMate', commissionField: 'salemate_commission', color: 'bg-blue-500' },
  { name: 'address', displayName: 'The Address Investments', commissionField: 'address_investments_commission', color: 'bg-green-500' },
  { name: 'bold', displayName: 'Bold Routes', commissionField: 'bold_routes_commission', color: 'bg-purple-500' },
  { name: 'nawy', displayName: 'Nawy Partners', commissionField: 'nawy_partners_commission', color: 'bg-red-500' },
  { name: 'coldwell', displayName: 'Coldwell Banker', commissionField: 'coldwell_banker_commission', color: 'bg-indigo-500' },
  { name: 'connect', displayName: 'Connect Homes', commissionField: 'connect_homes_commission', color: 'bg-yellow-500' },
  { name: 'view', displayName: 'View Investments', commissionField: 'view_investments_commission', color: 'bg-pink-500' },
  { name: 'ynetwork', displayName: 'Y Network', commissionField: 'y_network_commission', color: 'bg-teal-500' },
  { name: 'byit', displayName: 'Byit', commissionField: 'byit_commission', color: 'bg-orange-500' }
];

const PartnersPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [projects, setProjects] = useState<PartnerProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [selectedProject, setSelectedProject] = useState<PartnerProject | null>(null);
  const [dealValue, setDealValue] = useState('');
  const [calculatorType, setCalculatorType] = useState<'normal' | 'onspot'>('normal');

  useEffect(() => {
    loadPartnerProjects();
  }, []);

  // Test/Mock data for Mountain View projects
  const getMockMountainViewProjects = (): PartnerProject[] => {
    return [
      {
        id: 9001,
        compound_name: 'Mountain View iCity',
        compound_id: 'mv-icity-001',
        developer: 'Mountain View',
        area: 'New Cairo',
        starting_price: 4500000,
        image_url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
        phone_number: '+20 123 456 7890',
        developer_sales_name: 'Ahmed Khalil',
        salemate_commission: 0,
        address_investments_commission: 4.55,
        bold_routes_commission: 4.5,
        nawy_partners_commission: 3.5,
        coldwell_banker_commission: 4.0,
        connect_homes_commission: 0,
        view_investments_commission: 0,
        y_network_commission: 3.5,
        byit_commission: 0,
        active_partners_count: 5,
        highest_commission_rate: 4.55,
      },
      {
        id: 9002,
        compound_name: 'Mountain View Hyde Park',
        compound_id: 'mv-hydepark-002',
        developer: 'Mountain View',
        area: 'New Cairo',
        starting_price: 5200000,
        image_url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
        phone_number: '+20 123 456 7891',
        developer_sales_name: 'Sara Mohamed',
        salemate_commission: 0,
        address_investments_commission: 4.55,
        bold_routes_commission: 4.5,
        nawy_partners_commission: 3.5,
        coldwell_banker_commission: 4.0,
        connect_homes_commission: 0,
        view_investments_commission: 0,
        y_network_commission: 3.5,
        byit_commission: 0,
        active_partners_count: 5,
        highest_commission_rate: 4.55,
      },
      {
        id: 9003,
        compound_name: 'Mountain View Chill Out Park',
        compound_id: 'mv-chillout-003',
        developer: 'Mountain View',
        area: '6th of October',
        starting_price: 3800000,
        image_url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
        phone_number: '+20 123 456 7892',
        developer_sales_name: 'Omar Hassan',
        salemate_commission: 0,
        address_investments_commission: 4.55,
        bold_routes_commission: 4.5,
        nawy_partners_commission: 3.5,
        coldwell_banker_commission: 4.0,
        connect_homes_commission: 0,
        view_investments_commission: 0,
        y_network_commission: 3.5,
        byit_commission: 0,
        active_partners_count: 5,
        highest_commission_rate: 4.55,
      },
      {
        id: 9004,
        compound_name: 'Mountain View North Coast',
        compound_id: 'mv-northcoast-004',
        developer: 'Mountain View',
        area: 'North Coast',
        starting_price: 6500000,
        image_url: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800',
        phone_number: '+20 123 456 7893',
        developer_sales_name: 'Layla Fathy',
        salemate_commission: 0,
        address_investments_commission: 4.55,
        bold_routes_commission: 4.5,
        nawy_partners_commission: 3.5,
        coldwell_banker_commission: 4.0,
        connect_homes_commission: 0,
        view_investments_commission: 0,
        y_network_commission: 3.5,
        byit_commission: 0,
        active_partners_count: 5,
        highest_commission_rate: 4.55,
      },
    ];
  };

  const loadPartnerProjects = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🏢 Loading partner projects...');
      // Fetch from transactions table (consolidated from project_partner_commissions)
      // Note: Foreign keys to system_data don't exist, so we fetch data separately
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let data: any[] | null = null;
      
      // Try to fetch with project join first
      const { data: joinedData, error: queryError } = await ((supabase as unknown as { from: (table: string) => any })
        .from('transactions')
        .select(`
          commission_rate,
          project_id,
          partner_id,
          projects:project_id (
            id,
            name,
            region,
            cover_image
          )
        `)
        .eq('transaction_type', 'commission'));

      if (queryError) {
        console.warn('Failed to load transactions with project join, trying simpler query:', queryError);
        // Fallback: fetch transactions without joins
        const { data: simpleData, error: simpleError } = await ((supabase as unknown as { from: (table: string) => any })
          .from('transactions')
          .select('commission_rate, project_id, partner_id')
          .eq('transaction_type', 'commission'));

        if (simpleError) {
          throw new Error(`Database error: ${simpleError.message}`);
        }

        // Fetch projects separately
        const projectIds = [...new Set((simpleData || []).map((t: any) => t.project_id).filter(Boolean))];
        let projectsMap: Record<string, any> = {};
        
        if (projectIds.length > 0) {
          const { data: projectsData } = await ((supabase as unknown as { from: (table: string) => any })
            .from('projects')
            .select('id, name, region, cover_image')
            .in('id', projectIds));
          
          if (projectsData) {
            projectsData.forEach((p: any) => {
              projectsMap[p.id] = p;
            });
          }
        }

        // Transform simple data with manually joined projects
        data = (simpleData || []).map((t: any) => ({
          commission_rate: t.commission_rate,
          project_id: t.project_id,
          partner_id: t.partner_id,
          projects: projectsMap[t.project_id] || null,
        }));
      } else {
        data = joinedData;
      }

      // Fetch partner names from system_data if we have partner_ids
      const partnerIds = [...new Set((data || []).map((r: any) => r.partner_id).filter(Boolean))];
      let partnersMap: Record<string, string> = {};
      
      if (partnerIds.length > 0) {
        try {
          const { data: partnersData } = await ((supabase as unknown as { from: (table: string) => any })
            .from('system_data')
            .select('id, entity_name')
            .eq('data_type', 'entity')
            .eq('entity_type', 'partner')
            .in('id', partnerIds));
          
          if (partnersData) {
            partnersData.forEach((p: any) => {
              partnersMap[p.id] = p.entity_name || 'Unknown Partner';
            });
          }
        } catch (err) {
          console.warn('Failed to fetch partner names from system_data:', err);
          // Continue without partner names
        }
      }

      // Aggregate rows into one record per project with partner-specific commission fields
      const extractName = (value: unknown): string => {
        if (value == null) return 'Unknown';
        if (typeof value === 'string') {
          // Try to extract name from JSON or pseudo-JSON (single quotes)
          const jsonMatch = value.match(/"name"\s*:\s*"([^"]+)"/);
          if (jsonMatch && jsonMatch[1]) return jsonMatch[1];
          const pseudoJsonMatch = value.match(/'name'\s*:\s*'([^']+)'/);
          if (pseudoJsonMatch && pseudoJsonMatch[1]) return pseudoJsonMatch[1];
          return value;
        }
        if (typeof value === 'object') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const v: any = value;
          return v.name ?? v.area ?? v.region ?? 'Unknown';
        }
        return String(value);
      };
      type Row = {
        commission_rate: number | null;
        project_id?: string;
        partner_id?: string;
        projects: { id: string; name: string | null; region: unknown; cover_image?: string | null } | null;
      };

      const byProject = new Map<string, PartnerProject>();

      (data as unknown as Row[] | null)?.forEach((row) => {
        if (!row?.projects?.id) return;
        const pid = row.projects.id;
        // Normalize compound (project) name: it might be JSON text or object
        const compoundName = extractName(row.projects.name);
        // region may be JSON or text; try to extract a readable string
        const areaText = extractName(row.projects.region);

        if (!byProject.has(pid)) {
          // Developer name is stored in the region field
          // (e.g., "Palm Hills Developments", "Mountain View", etc.)
          const developerName = areaText || 'Unknown';
          byProject.set(pid, {
            id: 0, // not used in UI for keys; using pid via map key instead
            compound_name: compoundName,
            compound_id: pid,
            developer: developerName,
            area: areaText,
            starting_price: 0,
            image_url: (row.projects?.cover_image ?? '') as string,
            phone_number: '',
            developer_sales_name: '',
            salemate_commission: 0,
            address_investments_commission: 0,
            bold_routes_commission: 0,
            nawy_partners_commission: 0,
            coldwell_banker_commission: 0,
            connect_homes_commission: 0,
            view_investments_commission: 0,
            y_network_commission: 0,
            byit_commission: 0,
            active_partners_count: 0,
            highest_commission_rate: 0,
          });
        }

        const proj = byProject.get(pid)!;
        // Get partner name from map or use partner_id as fallback
        const partnerId = row.partner_id || '';
        const partnerName = (partnersMap[partnerId] || partnerId || '').toLowerCase();
        const rate = row.commission_rate ?? 0;

        // Map known partner names to fields
        if (partnerName.includes('address')) proj.address_investments_commission = rate;
        else if (partnerName.includes('bold')) proj.bold_routes_commission = rate;
        else if (partnerName.includes('nawy')) proj.nawy_partners_commission = rate;
        else if (partnerName.includes('coldwell')) proj.coldwell_banker_commission = rate;
        else if (partnerName.includes('salemate')) proj.salemate_commission = rate;
        else if (partnerName.includes('connect')) proj.connect_homes_commission = rate;
        else if (partnerName.includes('view')) proj.view_investments_commission = rate;
        else if (partnerName.includes('y network') || partnerName === 'ynetwork') proj.y_network_commission = rate;
        else if (partnerName.includes('byit')) proj.byit_commission = rate;

        // Update summary stats
        const rates = [
          proj.salemate_commission,
          proj.address_investments_commission,
          proj.bold_routes_commission,
          proj.nawy_partners_commission,
          proj.coldwell_banker_commission,
          proj.connect_homes_commission,
          proj.view_investments_commission,
          proj.y_network_commission,
          proj.byit_commission,
        ].filter((v) => typeof v === 'number') as number[];
        proj.active_partners_count = rates.filter((v) => v > 0).length;
        proj.highest_commission_rate = rates.reduce((m, v) => (v > m ? v : m), 0);
      });

      const aggregated = Array.from(byProject.values()).sort((a, b) =>
        a.compound_name.localeCompare(b.compound_name)
      );

      // Fetch representative images per compound from salemate-inventory and attach
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: inventoryRows, error: invErr } = await ((supabase as unknown as { from: (table: string) => any })
        .from('salemate-inventory')
        .select('compound,image'));
      if (invErr) {
        console.warn('Could not fetch images from salemate-inventory:', invErr.message);
      } else if (inventoryRows) {
        const imageByName = new Map<string, string>();
        (inventoryRows as Array<{ compound: unknown; image: string | null }>).forEach(r => {
          const name = extractName(r.compound);
          if (!imageByName.has(name) && r.image) imageByName.set(name, r.image);
        });
        aggregated.forEach(p => {
          const img = imageByName.get(p.compound_name);
          if (img) p.image_url = img;
        });
      }

      // Add mock Mountain View projects for testing
      const mockProjects = getMockMountainViewProjects();
      const allProjects = [...mockProjects, ...aggregated];
      
      console.log(`✅ Loaded ${aggregated.length} partner projects (aggregated) + ${mockProjects.length} test Mountain View projects`);
      setProjects(allProjects);

    } catch (err: unknown) {
      const message = err instanceof Error ? (err instanceof Error ? err.message : String(err)) : 'Unknown error';
      console.error('❌ Error loading partner projects:', err);
      console.log('📝 Loading mock Mountain View projects for testing...');
      
      // Still load mock projects even if database query fails
      const mockProjects = getMockMountainViewProjects();
      setProjects(mockProjects);
      setError(null); // Clear error since we have mock data
    } finally {
      setLoading(false);
    }
  };

  // Priority developers list
  const priorityDevelopers = [
    'Mountain View',
    'Palm Hills',
    'akam al rajhi',
    'Hydepark', 
    'MNHD',
    'Misr Italia',
    'PRE',
    'taj misr'
  ];

  // Filter and sort projects with priority developers first
  const filteredProjects = projects
    .filter(project => 
      project.compound_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.developer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.area.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      // Check if developers are in priority list (case insensitive)
      const aIsPriority = priorityDevelopers.some(dev => 
        a.developer.toLowerCase().includes(dev.toLowerCase())
      );
      const bIsPriority = priorityDevelopers.some(dev => 
        b.developer.toLowerCase().includes(dev.toLowerCase())
      );
      
      // Priority developers first
      if (aIsPriority && !bIsPriority) return -1;
      if (!aIsPriority && bIsPriority) return 1;
      
      // Within priority developers, sort by highest commission
      if (aIsPriority && bIsPriority) {
        return b.highest_commission_rate - a.highest_commission_rate;
      }
      
      // For non-priority developers, sort by highest commission
      return b.highest_commission_rate - a.highest_commission_rate;
    });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EG').format(amount);
  };

  const openCalculator = (project: PartnerProject) => {
    setSelectedProject(project);
    setShowCalculator(true);
    setDealValue('');
  };

  const closeCalculator = () => {
    setShowCalculator(false);
    setSelectedProject(null);
    setDealValue('');
  };

  const viewInInventory = (project: PartnerProject) => {
    // Navigate to inventory page with compound filter
    navigate(`/app/inventory?compound=${encodeURIComponent(project.compound_name)}`);
  };

  // Return a unique image URL per project. If no image_url is available from DB,
  // use a deterministic Unsplash placeholder seeded by compound_id so each card differs.
  const getProjectImage = (p: PartnerProject): string => {
    if (p.image_url && p.image_url.trim().length > 0) return p.image_url;
    const seed = encodeURIComponent(p.compound_id || p.compound_name || 'salemate');
    return `https://source.unsplash.com/featured/640x420?real-estate,building,architecture&sig=${seed}`;
  };

  const calculateEarnings = (dealValue: number, commissionRate: number) => {
    const grossCommission = dealValue * (commissionRate / 100);
    const tax = grossCommission * 0.05; // 5% tax
    const netCommission = grossCommission - tax;
    const yourEarnings = netCommission * 0.95; // Agent gets 95%

      return {
      grossCommission,
      tax,
      netCommission,
      yourEarnings
    };
  };

  // Normalize display names that may be stringified JSON like {"id": 10, "name": "Aden"}
  // or pseudo-JSON with single quotes. Falls back to the original string.
  const normalizeDisplayName = (value?: string | null): string => {
    const s = value == null ? '' : String(value);
    if (!s) return 'Unknown';
    const m1 = s.match(/"name"\s*:\s*"([^"]+)"/);
    if (m1 && m1[1]) return m1[1];
    const m2 = s.match(/'name'\s*:\s*'([^']+)'/);
    if (m2 && m2[1]) return m2[1];
    return s;
  };

  // Get active partners for a project (only those with commission rates)
  const getActivePartners = (project: PartnerProject) => {
    return PARTNERS_INFO.filter(partner => {
      const commissionRate = project[partner.commissionField] as number | null;
      return commissionRate !== null && commissionRate > 0;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-lg animate-pulse">
                <div className="h-64 bg-gray-200"></div>
                <div className="p-6 space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
  return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load projects</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadPartnerProjects}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/30 via-blue-50/20 to-white">
      {/* Compact Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="text-center space-y-4 mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 bg-clip-text text-transparent mb-2">
                Partner Commissions
              </h1>
              <p className="text-gray-600 text-base md:text-lg">
                Calculate earnings • {filteredProjects.length} compounds
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
                placeholder="Search compounds..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-80 h-10"
          />
            </div>
          </div>
        </div>
      </div>

      {/* Optimized Project Cards */}
      <div className="max-w-7xl mx-auto p-3 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredProjects.map((project, index) => {
            const activePartners = getActivePartners(project);
            const isPriority = priorityDevelopers.some(dev => 
              project.developer.toLowerCase().includes(dev.toLowerCase())
            );
            
            return (
              <Card 
                key={project.compound_id} 
                className={`group overflow-hidden rounded-2xl shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 ${
                  isPriority 
                    ? 'bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200 ring-1 ring-blue-300' 
                    : 'bg-white border-0'
                }`}
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: 'slideInUp 0.6s ease-out forwards'
                }}
              >
                {/* Compact Image Section */}
                <div className="relative h-48 sm:h-56 overflow-hidden">
                  <img 
                    src={getProjectImage(project)}
                    alt={project.compound_name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = getProjectImage(project);
                    }}
                  />
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Compact Action Buttons */}
                  <div className="absolute top-3 left-3">
                    <button className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-700 hover:bg-white hover:scale-110 transition-all duration-200">
                      <Heart className="w-4 h-4" />
                    </button>
          </div>
                  
                  <div className="absolute top-3 right-3">
                    <button 
                      onClick={() => viewInInventory(project)}
                      className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-700 hover:bg-white hover:scale-110 transition-all duration-200"
                      title={`View ${project.compound_name} in inventory`}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
          </div>

                  <div className="absolute bottom-3 right-3">
                    <button 
                      onClick={() => openCalculator(project)}
                      className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 animate-pulse"
                    >
                      <Calculator className="w-5 h-5" />
                    </button>
      </div>

                  {/* Partners Count Badge */}
                  <div className="absolute bottom-3 left-3">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full px-2 py-1 text-xs font-bold shadow-lg">
                      {activePartners.length} Partners
                    </div>
                  </div>

                  {/* Priority Developer Badge */}
                  {isPriority && (
                    <div className="absolute top-3 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-full px-3 py-1 text-xs font-bold shadow-lg animate-pulse">
                        ⭐ Premium
                      </div>
                    </div>
                  )}

                  {/* Best Commission Badge */}
                  {project.highest_commission_rate > 0 && !isPriority && (
                    <div className="absolute top-3 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full px-3 py-1 text-xs font-bold shadow-lg animate-bounce">
                        {project.highest_commission_rate}% Best
                    </div>
                  </div>
                  )}
                </div>

                {/* Compact Project Details */}
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Project Name & Location */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {normalizeDisplayName(project.compound_name)}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-1">{normalizeDisplayName(project.area)}</p>
              </div>

                    {/* Compact Info Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-gray-500 font-medium">Starting Price</p>
                        <p className="font-bold text-gray-900 truncate">
                          {project.starting_price ? `${(project.starting_price / 1000000).toFixed(1)}M EGP` : 'On Request'}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-gray-500 font-medium">Down Payment</p>
                        <p className="font-bold text-gray-900">5%</p>
                      </div>
                    </div>

                    {/* Developer Info - Compact */}
                    <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                      <div className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center">
                        <Building className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">{normalizeDisplayName(project.developer)}</p>
                        <p className="text-xs text-gray-600 truncate">{project.developer_sales_name}</p>
                      </div>
                      <div className="flex gap-1">
                        <button className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors">
                          <Phone className="w-3 h-3 text-blue-600" />
                        </button>
                        <button className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center hover:bg-green-200 transition-colors">
                          <MessageCircle className="w-3 h-3 text-green-600" />
                        </button>
                      </div>
                    </div>
                  </div>
            </CardContent>
          </Card>
            );
          })}
      </div>

        {/* Empty State */}
        {filteredProjects.length === 0 && !loading && (
          <div className="text-center py-16 animate-fadeIn">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No compounds found</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Try adjusting your search terms to find the right compound.
          </p>
        </div>
      )}
                </div>
                
      {/* Add CSS animations */}
      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      {/* Optimized Calculator Modal */}
      {showCalculator && selectedProject && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-sm sm:max-w-md mx-2 overflow-hidden shadow-2xl transform animate-slideInUp">
            {/* Compact Modal Header */}
            <div className="relative">
              <div className="h-20 sm:h-24 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500"></div>
              <button 
                onClick={closeCalculator}
                className="absolute top-2 right-2 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-200 hover:scale-110"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-4 right-4">
                <h3 className="text-lg font-bold text-white">Calculate your earnings</h3>
                <p className="text-white/90 text-sm truncate">{selectedProject.compound_name}</p>
              </div>
            </div>
            
            <div className="p-4 sm:p-6 space-y-4">
              {/* Compact Calculator Type Toggle */}
              <div className="flex bg-gray-100 rounded-full p-1">
                <button
                  onClick={() => setCalculatorType('normal')}
                  className={`flex-1 py-2 px-3 rounded-full text-sm font-medium transition-all duration-200 ${
                    calculatorType === 'normal' 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  NORMAL
                </button>
                <button
                  onClick={() => setCalculatorType('onspot')}
                  className={`flex-1 py-2 px-3 rounded-full text-sm font-medium transition-all duration-200 ${
                    calculatorType === 'onspot' 
                      ? 'bg-blue-400 text-white shadow-md' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  ON SPOT
                </button>
              </div>

              {/* Deal Value Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Deal Value</label>
                <Input
                  type="text"
                  placeholder="e.g., 10,000,000 EGP"
                  value={dealValue ? formatCurrency(parseFloat(dealValue.replace(/,/g, ''))) : ''}
                  onChange={(e) => {
                    // Remove all non-numeric characters except decimal points
                    const numericValue = e.target.value.replace(/[^\d.]/g, '');
                    setDealValue(numericValue);
                  }}
                  className="text-base h-12 border-2 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Enter amount in Egyptian Pounds (EGP)</p>
              </div>

              {/* ON SPOT Requirements Notice */}
              {calculatorType === 'onspot' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-yellow-800">ON SPOT Requirements:</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        • Client must pay <strong>10% down payment</strong> to activate ON SPOT commission
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Compact Commission Calculations */}
              {dealValue && (
                <div className="space-y-3 max-h-64 sm:max-h-80 overflow-y-auto">
                  {getActivePartners(selectedProject).map((partner, index) => {
                    const baseCommissionRate = selectedProject[partner.commissionField] as number;
                    const commissionRate = calculatorType === 'onspot' ? baseCommissionRate / 2 : baseCommissionRate;
                    const earnings = calculateEarnings(parseFloat(dealValue), commissionRate);
                    
                    return (
                      <div 
                        key={partner.name} 
                        className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-3 border border-gray-100 hover:shadow-md transition-all duration-200"
                        style={{
                          animationDelay: `${index * 100}ms`,
                          animation: 'slideInLeft 0.4s ease-out forwards'
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full ${partner.color} flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
                              {partner.displayName.charAt(0)}
                            </div>
                            <span className="font-medium text-sm truncate">{partner.displayName}</span>
                          </div>
                          <span className="text-sm font-bold text-green-600">{commissionRate}%</span>
            </div>
            
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="text-gray-600">
                            <span>Gross: </span>
                            <span className="font-medium text-gray-900">{formatCurrency(earnings.grossCommission)} LE</span>
                          </div>
                          <div className="text-gray-600">
                            <span>Taxes: </span>
                            <span className="font-medium text-gray-900">{formatCurrency(earnings.tax)} LE</span>
                          </div>
                          <div className="text-gray-600">
                            <span>Net: </span>
                            <span className="font-medium text-gray-900">{formatCurrency(earnings.netCommission)} LE</span>
                          </div>
                          <div className="text-orange-600">
                            <span className="font-semibold">Your Earnings: </span>
                            <span className="font-bold">{formatCurrency(earnings.yourEarnings)} LE (95%)</span>
                          </div>
                        </div>
              </div>
                    );
                  })}
                  
                  <p className="text-xs text-gray-500 text-center mt-3">Plus any incentives from the developer</p>
              </div>
              )}

              {/* OK Button */}
              <Button 
                onClick={closeCalculator} 
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-3 rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Ok
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Additional CSS for animations */}
      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Mobile responsive adjustments */
        @media (max-width: 640px) {
          .grid-cols-1 {
            grid-template-columns: repeat(1, minmax(0, 1fr));
          }
        }
      `}</style>
    </div>
  );
};

export default PartnersPage;