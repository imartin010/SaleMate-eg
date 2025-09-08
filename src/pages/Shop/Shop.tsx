import React, { useEffect, useState } from 'react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { ProjectCard } from '../../components/projects/ProjectCard';
import { PageTitle } from '../../components/common/PageTitle';
import { Project } from '../../types';
import { 
  Search, 
  Filter, 
  ShoppingCart,
  MapPin,
  Building,
  TrendingUp,
  Star,
  Zap,
  Shield,
  Users,
  DollarSign
} from 'lucide-react';

const Shop: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'leads' | 'region'>('name');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadShopProjects();
  }, []);

  const loadShopProjects = async () => {
    setLoading(true);
    try {
      console.log('🏪 Loading shop projects from backend...');
      
      // Try to load from database with timeout protection
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database timeout')), 8000)
      );

      // Since projects table doesn't exist in the current schema, we'll use sample data
      // In a real implementation, this would query the actual projects table
      const queryPromise = Promise.reject(new Error('Projects table not available'));

      try {
        const { data: projectsData, error: projectsError } = await Promise.race([
          queryPromise, 
          timeoutPromise
        ]) as any;

        if (projectsError) {
          throw new Error(`Database error: ${projectsError.message}`);
        }

        if (projectsData && projectsData.length > 0) {
          console.log(`✅ Loaded ${projectsData.length} projects from database`);
          
          // Transform database data to frontend format
          const formattedProjects: Project[] = projectsData.map((p: any) => ({
            id: p.id,
            name: p.name,
            developer: p.developer,
            region: p.region,
            availableLeads: p.available_leads,
            description: p.description,
            createdAt: p.created_at,
            pricePerLead: p.price_per_lead || 100
          }));

          setProjects(formattedProjects);
          return;
        } else {
          console.log('📝 Database returned empty, likely RLS issue. Using realistic sample data.');
          throw new Error('Database access restricted or empty');
        }

      } catch (dbError: any) {
        console.warn('🔄 Database failed, no projects available:', dbError.message);
        
        // No sample data - show empty state
        setProjects([]);
        console.log('📝 No projects available');
      }
      
    } catch (error) {
      console.error('❌ Error loading shop projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const regions = Array.from(new Set(projects.map(p => p.region))).sort();

  const filteredAndSortedProjects = projects
    .filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           project.developer.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRegion = !regionFilter || project.region === regionFilter;
      return matchesSearch && matchesRegion && project.availableLeads > 0; // Only show projects with leads
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'leads':
          return b.availableLeads - a.availableLeads;
        case 'region':
          return a.region.localeCompare(b.region);
        default:
          return a.name.localeCompare(b.name);
      }
    });

  const clearFilters = () => {
    setSearchTerm('');
    setRegionFilter('');
    setSortBy('name');
  };

  const hasActiveFilters = searchTerm || regionFilter || sortBy !== 'name';
  const totalAvailableLeads = filteredAndSortedProjects.reduce((sum, p) => sum + p.availableLeads, 0);

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Header Skeleton */}
        <div className="space-y-4">
          <div className="h-10 bg-gray-200 rounded animate-pulse w-1/3"></div>
          <div className="h-5 bg-gray-200 rounded animate-pulse w-1/2"></div>
        </div>

        {/* Metrics Cards Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card-modern card-hover p-4 text-center">
              <div className="w-10 h-10 bg-gray-200 rounded-full mx-auto mb-2 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded animate-pulse mb-1"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4 mx-auto"></div>
            </div>
          ))}
        </div>

        {/* Search and Filters Skeleton */}
        <div className="space-y-4">
          <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-200 rounded animate-pulse w-20 shrink-0"></div>
            ))}
          </div>
        </div>

        {/* Projects Grid Skeleton */}
        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card-modern overflow-hidden">
              <div className="h-48 bg-gray-200 animate-pulse"></div>
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
                <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section - Mobile First */}
      <div className="space-y-4">
        <PageTitle
          title="Leads Shop"
          subtitle="Purchase high-quality leads from premium real estate projects"
          icon={ShoppingCart}
          color="green"
        />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Mobile Actions */}
          <div className="flex items-center gap-2 sm:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex-1"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <span className="ml-1 bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-xs">
                  {[searchTerm, regionFilter, sortBy !== 'name'].filter(Boolean).length}
                </span>
              )}
            </Button>
            <Button size="sm" className="shrink-0">
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Desktop Actions */}
          <div className="hidden sm:flex items-center gap-3">
            <Button variant="outline" size="sm">
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            <Button size="sm">
              <ShoppingCart className="h-4 w-4 mr-2" />
              View Cart
            </Button>
          </div>
        </div>

        {/* Shop Metrics Cards - Mobile First Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card-modern card-hover p-4 text-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 mx-auto mb-2">
              <Building className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">{projects.length}</div>
            <div className="text-sm text-muted-foreground">Total Projects</div>
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
      </div>

      {/* Search and Filters - Mobile First */}
      <div className="space-y-4">
        {/* Search Bar - Full Width on Mobile */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects by name, developer, or region..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>

        {/* Quick Filters - Horizontal Scroll on Mobile */}
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

        {/* Advanced Filters Toggle */}
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
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
              Clear All
            </Button>
          )}
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="card-modern p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'leads' | 'region')}
                  className="w-full p-2 border border-gray-300 rounded-md bg-white"
                >
                  <option value="name">Project Name</option>
                  <option value="leads">Available Leads</option>
                  <option value="region">Region</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Region</label>
                <select
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md bg-white"
                >
                  <option value="">All Regions</option>
                  {regions.map(region => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Lead Count</label>
                <select className="w-full p-2 border border-gray-300 rounded-md bg-white">
                  <option value="">Any Amount</option>
                  <option value="50-100">50 - 100</option>
                  <option value="100-250">100 - 250</option>
                  <option value="250+">250+</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center gap-2">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filteredAndSortedProjects.length}</span> projects
        </p>
        {hasActiveFilters && (
          <Badge variant="secondary" className="text-xs">
            Filtered
          </Badge>
        )}
      </div>

      {/* Projects Grid */}
      <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
        {filteredAndSortedProjects.map(project => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>

      {/* Empty State */}
      {filteredAndSortedProjects.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {hasActiveFilters ? 'No projects found' : 'No lead packages available'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {hasActiveFilters 
              ? 'Try adjusting your search criteria or filters.'
              : 'There are currently no lead packages available for purchase. Please check back later or contact support for assistance.'
            }
          </p>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
          {!hasActiveFilters && (
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button variant="outline" onClick={loadShopProjects}>
                Refresh
              </Button>
              <Button variant="outline">
                Contact Support
              </Button>
            </div>
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
            <h4 className="font-semibold text-foreground mb-2">Volume Pricing</h4>
            <p className="text-sm text-muted-foreground">
              50 leads minimum per purchase to ensure volume efficiency
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;
