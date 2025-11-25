import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { ImprovedProjectCard } from '../../components/projects/ImprovedProjectCard';
import { WalletDisplay } from '../../components/wallet/WalletDisplay';
import { LeadCart } from '../../components/cart/LeadCart';
import { supabase } from "../../lib/supabaseClient"
import { useAuthStore } from '../../store/auth';
import { Project } from '../../types';
import { EmptyState } from '../../components/common/EmptyState';
import { BottomSheet } from '../../components/common/BottomSheet';
import { SkeletonList } from '../../components/common/SkeletonCard';
import { 
  Search, 
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
  AlertCircle,
  Loader2,
  MessageSquare,
  Plus,
  Send,
  CheckCircle,
  Filter
} from 'lucide-react';

export const ImprovedShop: React.FC = () => {
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'leads' | 'region' | 'price'>('leads');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [showRequestSection, setShowRequestSection] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [requestFormData, setRequestFormData] = useState({
    projectName: '',
    leadsAmount: '',
    budget: ''
  });
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  useEffect(() => {
    loadShopProjects();
  }, []);

  // Refresh projects when returning from checkout (check for flag in sessionStorage)
  useEffect(() => {
    const shouldRefresh = sessionStorage.getItem('refreshShopAfterCheckout');
    if (shouldRefresh === 'true') {
      console.log('🔄 Refreshing shop after checkout completion...');
      sessionStorage.removeItem('refreshShopAfterCheckout');
      loadShopProjects();
      setLastRefresh(new Date());
    }
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
          cover_image
        `)
        .gt('available_leads', 0) // Only show projects with available leads
        .order('available_leads', { ascending: false }); // Order by available leads descending

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
        // Note: region column contains the developer name (e.g., "Palm Hills Developments", "Mountain View")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const base: Project[] = (projectsData as any[]).map((p: Record<string, unknown>) => {
          const name = extractName(p.name);
          const region = extractName(p.region);
          // Use region as developer name since region column stores developer name
          const developer = region || 'Unknown';
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

  const handlePurchaseSuccess = async () => {
    console.log('🔄 Refreshing shop projects after successful purchase...');
    // Refresh projects to update available leads count
    await loadShopProjects();
    setLastRefresh(new Date());
    console.log('✅ Shop projects refreshed');
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

  if (loading && projects.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50/30 via-blue-50/20 to-white">
        <div className="container mx-auto px-4 py-6 md:px-6 md:py-8 max-w-7xl">
          <SkeletonList count={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/30 via-blue-50/20 to-white">
      <div className="container mx-auto px-4 py-6 md:px-6 md:py-8 space-y-6 max-w-7xl">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 bg-clip-text text-transparent mb-2">
                Leads Shop
              </h1>
              <p className="text-gray-600 text-base md:text-lg">
                Purchase high-quality leads from premium real estate projects
              </p>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-blue-600 font-medium">
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
                className="rounded-xl border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <LeadCart />
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 shadow-sm"
            >
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-medium flex-1">{error}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setError(null)}
                className="rounded-lg hover:bg-red-100"
              >
                Dismiss
              </Button>
            </motion.div>
          )}

          {/* Wallet Display */}
          <div className="mt-6">
            <WalletDisplay />
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="space-y-4"
        >
          {/* Search Bar with Filter Button - Mobile */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 md:h-14 text-base rounded-2xl border-gray-200 bg-white/80 backdrop-blur-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
            {/* Filter Button - Mobile Only */}
            <Button
              variant={hasActiveFilters ? 'default' : 'outline'}
              onClick={() => setShowFilters(true)}
              className="md:hidden h-12 w-12 min-w-[48px] min-h-[48px] rounded-2xl"
              aria-label="Filters"
            >
              <Filter className="h-5 w-5" />
            </Button>
          </div>

          {/* Quick Filters - Desktop Only */}
          <div className="hidden md:flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Button
              variant={!regionFilter ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRegionFilter('')}
              className={`whitespace-nowrap shrink-0 rounded-xl ${
                !regionFilter 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30' 
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              All Regions
            </Button>
            {regions.slice(0, 6).map(region => (
              <Button
                key={region}
                variant={regionFilter === region ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRegionFilter(region)}
                className={`whitespace-nowrap shrink-0 rounded-xl ${
                  regionFilter === region
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                {region}
              </Button>
            ))}
          </div>

          {/* Clear Filters Button - Desktop Only */}
          {hasActiveFilters && (
            <div className="hidden md:flex justify-end">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters}
                className="text-gray-600 hover:text-gray-900 rounded-xl"
              >
                Clear All
              </Button>
            </div>
          )}
        </motion.div>

        {/* Mobile Filters Bottom Sheet */}
        <BottomSheet
          open={showFilters}
          onClose={() => setShowFilters(false)}
          title="Filters"
          footer={
            <div className="space-y-3">
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="mobile"
                  onClick={() => {
                    clearFilters();
                    setShowFilters(false);
                  }}
                  className="w-full"
                >
                  Clear All Filters
                </Button>
              )}
              <Button
                size="mobile"
                onClick={() => setShowFilters(false)}
                className="w-full"
              >
                Apply Filters
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
              <Select
                value={regionFilter || 'all'}
                onValueChange={(value) => setRegionFilter(value === 'all' ? '' : value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {regions.map(region => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <Select
                value={sortBy}
                onValueChange={(value) => setSortBy(value as typeof sortBy)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="leads">Most Leads</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="region">Region</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </BottomSheet>

        {/* Results Summary */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-2"
        >
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-900">{filteredAndSortedProjects.length}</span> projects
            with <span className="font-semibold text-blue-600">{totalAvailableLeads.toLocaleString()}</span> total leads
          </p>
          {hasActiveFilters && (
            <Badge className="bg-blue-100 text-blue-700 border-blue-200 rounded-full px-3 py-1 text-xs font-medium">
              Filtered
            </Badge>
          )}
        </motion.div>

        {/* Projects Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
        >
          {filteredAndSortedProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.05 }}
            >
              <ImprovedProjectCard 
                project={project} 
                onPurchaseSuccess={handlePurchaseSuccess}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Empty State */}
        {filteredAndSortedProjects.length === 0 && !loading && (
          <EmptyState
            title="No projects found"
            description={hasActiveFilters 
              ? "Try adjusting your search criteria or filters"
              : "Check back later for new premium projects with available leads"}
            ctaText={hasActiveFilters ? "Clear Filters" : undefined}
            onCtaClick={hasActiveFilters ? () => {
              clearFilters();
              setShowFilters(false);
            } : undefined}
          />
        )}

        {/* Request Leads Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-6 md:p-8 border border-blue-200 shadow-sm"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent mb-2">
                Request Leads for Specific Projects
              </h3>
              <p className="text-gray-600 text-sm md:text-base">
                Fill out the form below to request leads for projects you need
              </p>
            </div>
            <Button
              onClick={() => setShowRequestSection(!showRequestSection)}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/30"
            >
              <Plus className="h-4 w-4 mr-2" />
              {showRequestSection ? 'Hide Form' : 'Request Leads'}
            </Button>
          </div>

          {showRequestSection && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              {requestSuccess ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-xl bg-green-50 border border-green-200 p-6 text-center"
                >
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                  <h4 className="text-lg font-semibold text-green-800 mb-2">Request Submitted Successfully!</h4>
                  <p className="text-green-700 text-sm mb-4">
                    Your lead request has been submitted. Our team will review it and get back to you soon.
                  </p>
                  <Button
                    onClick={() => {
                      setRequestSuccess(false);
                      setRequestFormData({ projectName: '', leadsAmount: '', budget: '' });
                      setRequestError(null);
                    }}
                    variant="outline"
                    className="rounded-xl border-green-300 hover:bg-green-100"
                  >
                    Submit Another Request
                  </Button>
                </motion.div>
              ) : (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    
                    if (!user) {
                      setRequestError('Please log in to submit a request');
                      return;
                    }

                    if (!requestFormData.projectName.trim()) {
                      setRequestError('Please enter the project name');
                      return;
                    }

                    if (!requestFormData.leadsAmount || Number(requestFormData.leadsAmount) < 30) {
                      setRequestError('Please enter a valid leads amount (minimum 30 leads)');
                      return;
                    }

                    if (!requestFormData.budget || Number(requestFormData.budget) < 1) {
                      setRequestError('Please enter a valid budget amount');
                      return;
                    }

                    setIsSubmittingRequest(true);
                    setRequestError(null);

                    try {
                      // Insert lead request into database
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      const { error: insertError } = await (supabase as any)
                        .from('transactions')
                        .insert({
                          transaction_type: 'commerce',
                          commerce_type: 'request',
                          profile_id: user.id,
                          project_id: null, // Allow null since user is typing project name manually
                          quantity: Number(requestFormData.leadsAmount),
                          amount: Number(requestFormData.budget),
                          currency: 'EGP',
                          status: 'pending',
                          notes: `Budget: EGP ${requestFormData.budget}, Leads Amount: ${requestFormData.leadsAmount}`,
                          metadata: { project_name: requestFormData.projectName.trim() }
                        });

                      if (insertError) {
                        console.error('Error inserting lead request:', insertError);
                        throw new Error(insertError.message || 'Failed to submit request. Please try again.');
                      }

                      setRequestSuccess(true);
                      setRequestFormData({ projectName: '', leadsAmount: '', budget: '' });
                    } catch (err: unknown) {
                      console.error('Error submitting lead request:', err);
                      setRequestError((err instanceof Error ? err.message : String(err)) || 'Failed to submit request');
                    } finally {
                      setIsSubmittingRequest(false);
                    }
                  }}
                  className="bg-white rounded-xl p-6 space-y-4 border border-gray-200"
                >
                  {/* Project Name */}
                  <div>
                    <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-2">
                      Project Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="projectName"
                      type="text"
                      placeholder="Enter the project name you need leads for"
                      value={requestFormData.projectName}
                      onChange={(e) => setRequestFormData({ ...requestFormData, projectName: e.target.value })}
                      className="rounded-xl border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 h-12"
                      required
                    />
                  </div>

                  {/* Leads Amount */}
                  <div>
                    <label htmlFor="leadsAmount" className="block text-sm font-medium text-gray-700 mb-2">
                      Leads Amount <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="leadsAmount"
                      type="number"
                      min="30"
                      placeholder="How many leads do you need?"
                      value={requestFormData.leadsAmount}
                      onChange={(e) => setRequestFormData({ ...requestFormData, leadsAmount: e.target.value })}
                      className="rounded-xl border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 h-12"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Minimum: 30 leads</p>
                  </div>

                  {/* Budget */}
                  <div>
                    <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-2">
                      Budget (EGP) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="budget"
                        type="number"
                        min="1"
                        step="0.01"
                        placeholder="Enter your budget for these leads"
                        value={requestFormData.budget}
                        onChange={(e) => setRequestFormData({ ...requestFormData, budget: e.target.value })}
                        className="pl-12 rounded-xl border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 h-12"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Your total budget for this lead request</p>
                  </div>

                  {/* Error Message */}
                  {requestError && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700">
                      <AlertCircle className="h-5 w-5 flex-shrink-0" />
                      <span className="text-sm font-medium">{requestError}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      type="submit"
                      disabled={isSubmittingRequest || !user}
                      className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/30 h-12"
                    >
                      {isSubmittingRequest ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Submit Request
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowRequestSection(false);
                        setRequestFormData({ projectName: '', leadsAmount: '', budget: '' });
                        setRequestError(null);
                      }}
                      className="rounded-xl border-gray-200 hover:bg-gray-50 h-12"
                    >
                      Cancel
                    </Button>
                  </div>

                  {!user && (
                    <p className="text-sm text-gray-500 text-center">
                      Please <a href="/auth/login" className="text-blue-600 hover:underline">log in</a> to submit a request
                    </p>
                  )}
                </form>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Premium Features Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="rounded-2xl bg-white p-6 md:p-8 border border-gray-100 shadow-sm"
        >
          <div className="text-center mb-6">
            <h3 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
              Why Choose Our Leads?
            </h3>
            <p className="text-gray-600">Premium quality leads that convert</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Verified Quality</h4>
              <p className="text-sm text-gray-600">
                All leads are verified and fresh from our marketing campaigns
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Zap className="h-7 w-7 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Instant Access</h4>
              <p className="text-sm text-gray-600">
                Leads appear in your CRM immediately after successful payment
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <DollarSign className="h-7 w-7 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Atomic Transactions</h4>
              <p className="text-sm text-gray-600">
                Secure purchase process with guaranteed lead assignment
              </p>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default ImprovedShop;
