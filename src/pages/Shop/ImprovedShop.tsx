import React, { useEffect, useState } from 'react';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { ImprovedProjectCard } from '../../components/projects/ImprovedProjectCard';
import { WalletDisplay } from '../../components/wallet/WalletDisplay';
import { supabase } from "../../lib/supabaseClient"
import { Project } from '../../types';
import { 
  Search, 
  Filter, 
  ShoppingCart,
  MapPin,
  Building,
  Star,
  Zap,
  Shield,
  Users,
  DollarSign,
  Clock,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export const ImprovedShop: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'leads' | 'region' | 'price'>('leads');
  const [showFilters, setShowFilters] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    loadShopProjects();
  }, []);

  const loadShopProjects = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🏪 Loading shop projects...');
      
      // Try to load from database with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database timeout')), 10000)
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const queryPromise = (supabase as any)
        .from('projects')
        .select(`
          id,
          name,
          region,
          description,
          price_per_lead,
          available_leads,
          cover_image,
          developers:developers ( name )
        `)
        .order('name');

      const { data: projectsData, error: projectsError } = await Promise.race([
        queryPromise, 
        timeoutPromise
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ]) as any;

      if (projectsError) {
        console.warn('Database query failed, using fallback data:', projectsError);
        throw new Error(projectsError.message);
      }

      if (projectsData && projectsData.length > 0) {
        console.log(`✅ Loaded ${projectsData.length} projects from database`);

        const extractName = (val: unknown): string => {
          if (!val) return 'Unknown';
          if (typeof val === 'string') {
            const m1 = val.match(/"name"\s*:\s*"([^"]+)"/); if (m1?.[1]) return m1[1];
            const m2 = val.match(/'name'\s*:\s*'([^']+)'/); if (m2?.[1]) return m2[1];
            return val;
          }
          if (typeof val === 'object') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const o: any = val; return o.name ?? o.region ?? o.area ?? 'Unknown';
          }
          return String(val);
        };

        // Base list from projects table
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const base: Project[] = (projectsData as any[]).map((p: Record<string, unknown>) => {
          const name = extractName(p.name);
          const developers = p.developers as Record<string, unknown> | undefined;
          const developer = extractName(developers?.name ?? p.developer);
          const region = extractName(p.region);
          // Prefer a clean description; if it looks like JSON, replace with developer tagline
          const desc = typeof p.description === 'string' && /['"]name['"]\s*:/.test(p.description)
            ? `Project from ${developer}`
            : (p.description || `Project from ${developer}`);
          return {
            id: p.id,
            name,
            developer,
            region,
            availableLeads: Number(p.available_leads ?? 0),
            description: desc,
            createdAt: undefined,
            pricePerLead: Number(p.price_per_lead ?? 100),
            coverImage: p.cover_image ?? null,
          } as Project;
        });

        setProjects(base);
      } else {
        // No projects available
        console.log('📝 No projects available');
        setProjects([]);
      }

      setLastRefresh(new Date());

    } catch (err: unknown) {
      console.error('❌ Failed to load projects:', err);
      setError((err instanceof Error ? err.message : String(err)) || 'Failed to load projects');
      
      // No fallback data - show empty state
      console.log('📝 No projects available');
      setProjects([]);
      
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseSuccess = () => {
    // Refresh projects to update available counts
    loadShopProjects();
  };

  const regions = Array.from(new Set(projects.map(p => p.region))).sort();

  const filteredAndSortedProjects = projects
    .filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           project.developer.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRegion = !regionFilter || project.region === regionFilter;
      return matchesSearch && matchesRegion; // do not hide 0-availability projects
    })
    .sort((a, b) => {
      // First priority: Sort by available leads (highest first)
      const leadsDiff = b.availableLeads - a.availableLeads;
      if (leadsDiff !== 0) return leadsDiff;
      
      // If leads are equal, sort by selected criteria
      switch (sortBy) {
        case 'leads':
          return b.availableLeads - a.availableLeads; // This is already handled above
        case 'region':
          return a.region.localeCompare(b.region);
        case 'price':
          return (a.pricePerLead || 0) - (b.pricePerLead || 0);
        default:
          return a.name.localeCompare(b.name);
      }
    });

  const clearFilters = () => {
    setSearchTerm('');
    setRegionFilter('');
    setSortBy('leads');
  };

  const hasActiveFilters = searchTerm || regionFilter || sortBy !== 'leads';
  const totalAvailableLeads = filteredAndSortedProjects.reduce((sum, p) => sum + p.availableLeads, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading premium projects...</p>
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
            <h1 className="text-4xl font-bold text-gradient">Leads Shop</h1>
            <p className="text-lg text-muted-foreground">
              Purchase high-quality leads from premium real estate projects
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
              onClick={loadShopProjects}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size="sm">
              <ShoppingCart className="h-4 w-4 mr-2" />
              View Cart
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

        {/* Shop Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card-modern card-hover p-4 text-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 mx-auto mb-2">
              <Building className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">{projects.length}</div>
            <div className="text-sm text-muted-foreground">Active Projects</div>
          </div>
          
          <div className="card-modern card-hover p-4 text-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 mx-auto mb-2">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">{totalAvailableLeads.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Available Leads</div>
          </div>
          
          <div className="card-modern card-hover p-4 text-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 mx-auto mb-2">
              <MapPin className="h-5 w-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">{regions.length}</div>
            <div className="text-sm text-muted-foreground">Regions</div>
          </div>
          
          <div className="card-modern card-hover p-4 text-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-100 mx-auto mb-2">
              <Star className="h-5 w-5 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">Premium</div>
            <div className="text-sm text-muted-foreground">Quality</div>
          </div>
        </div>

        {/* Wallet Display */}
        <div className="mt-6">
          <WalletDisplay />
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects by name, developer, or region..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>

        {/* Quick Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Button
            variant={!regionFilter ? 'default' : 'outline'}
            size="sm"
            onClick={() => setRegionFilter('')}
            className="whitespace-nowrap shrink-0"
          >
            All Regions
          </Button>
          {regions.slice(0, 6).map(region => (
            <Button
              key={region}
              variant={regionFilter === region ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRegionFilter(region)}
              className="whitespace-nowrap shrink-0"
            >
              {region}
            </Button>
          ))}
        </div>

        {/* Advanced Filters */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="text-primary hover:text-primary"
          >
            <Filter className="h-4 w-4 mr-2" />
            Advanced Filters
            {hasActiveFilters && (
              <span className="ml-1 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                {[searchTerm, regionFilter, sortBy !== 'name'].filter(Boolean).length}
              </span>
            )}
          </Button>
          
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear All
            </Button>
          )}
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="card-modern p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Sort By</label>
                <Select
                  value={sortBy}
                  onValueChange={(value) => setSortBy(value as 'name' | 'leads' | 'region' | 'price')}
                >
                  <option value="name">Project Name</option>
                  <option value="leads">Available Leads</option>
                  <option value="region">Region</option>
                  <option value="price">Price per Lead</option>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Region</label>
                <Select
                  value={regionFilter}
                  onValueChange={(value) => setRegionFilter(value)}
                >
                  <option value="">All Regions</option>
                  {regions.map(region => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center gap-2">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filteredAndSortedProjects.length}</span> projects
          with <span className="font-semibold text-green-600">{totalAvailableLeads.toLocaleString()}</span> total leads
        </p>
        {hasActiveFilters && (
          <Badge variant="secondary" className="text-xs">
            Filtered
          </Badge>
        )}
      </div>

      {/* Projects Grid */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredAndSortedProjects.map(project => (
          <ImprovedProjectCard 
            key={project.id} 
            project={project} 
            onPurchaseSuccess={handlePurchaseSuccess}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredAndSortedProjects.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No projects found</h3>
          <p className="text-muted-foreground mb-4">
            {hasActiveFilters 
              ? 'Try adjusting your search criteria or filters.'
              : 'Check back later for new premium projects with available leads.'
            }
          </p>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      )}

      {/* Premium Features Info */}
      <div className="card-modern p-6">
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-foreground mb-2">Why Choose Our Leads?</h3>
          <p className="text-muted-foreground">Premium quality leads that convert</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <h4 className="font-semibold text-foreground mb-2">Verified Quality</h4>
            <p className="text-sm text-muted-foreground">
              All leads are verified and fresh from our marketing campaigns
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Zap className="h-6 w-6 text-blue-600" />
            </div>
            <h4 className="font-semibold text-foreground mb-2">Instant Access</h4>
            <p className="text-sm text-muted-foreground">
              Leads appear in your CRM immediately after successful payment
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
            <h4 className="font-semibold text-foreground mb-2">Atomic Transactions</h4>
            <p className="text-sm text-muted-foreground">
              Secure purchase process with guaranteed lead assignment
            </p>
          </div>
        </div>
      </div>

      {/* Development Notice */}
      <div className="card-modern p-4 bg-blue-50 border-blue-200">
        <div className="flex items-center gap-2 text-blue-800">
          <Clock className="h-4 w-4" />
          <span className="text-sm font-medium">
            🚀 Enhanced Purchase System: Improved concurrency handling, atomic transactions, and real-time availability checks
          </span>
        </div>
      </div>
    </div>
  );
};

export default ImprovedShop;
