import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/card';
import { PageTitle } from '../../components/common/PageTitle';
import { supabase } from '../../lib/supabaseClient';
import { BRDataProperty } from '../../types';
import { formatCurrency, formatNumber } from '../../lib/format';
import { PropertyDetailsModal } from '../../components/inventory/PropertyDetailsModal';
import { SafeImage } from '../../components/common/SafeImage';
import { Button } from '../../components/ui/button';
import {
  Home,
  MapPin,
  Bed,
  Bath,
  Sparkles,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Building2,
  Building,
} from 'lucide-react';
import { SkeletonList } from '../../components/common/SkeletonCard';
import { EmptyState } from '../../components/common/EmptyState';

const ITEMS_PER_PAGE = 12;

// Helper function to extract name from compound/area/developer
const extractName = (value: unknown): string => {
  if (!value) return '-';
  if (typeof value === 'object' && value !== null && 'name' in value) {
    return (value as { name: string }).name || '-';
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value.replace(/'/g, '"'));
      return parsed.name || value;
    } catch {
      return value;
    }
  }
  return '-';
};

const ProjectUnits: React.FC = () => {
  const navigate = useNavigate();
  const { projectName } = useParams<{ projectName: string }>();
  const decodedProjectName = projectName ? decodeURIComponent(projectName) : '';
  
  const [units, setUnits] = useState<BRDataProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProperty, setSelectedProperty] = useState<BRDataProperty | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectInfo, setProjectInfo] = useState<{ name: string; region?: string; cover_image?: string } | null>(null);
  const [projectDeveloper, setProjectDeveloper] = useState<string | null>(null);

  const getHeroImage = (unitName: string) => {
    const images = [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=250&fit=crop',
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=250&fit=crop',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&h=250&fit=crop',
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=250&fit=crop',
    ];
    const index = (unitName || '').charCodeAt(0) % images.length;
    return images[index];
  };

  useEffect(() => {
    if (!decodedProjectName) {
      setError('Project name is required');
      setLoading(false);
      return;
    }

    const loadProjectInfo = async () => {
      try {
        const { data, error: projectError } = await supabase
          .from('projects')
          .select('id, name, region, cover_image')
          .ilike('name', decodedProjectName)
          .limit(1)
          .single();

        if (!projectError && data) {
          setProjectInfo({
            name: data.name,
            region: data.region,
            cover_image: data.cover_image || undefined,
          });
          // Store developer name (region) for matching units
          setProjectDeveloper(data.region || null);
        }
      } catch (err) {
        console.error('Failed to load project info:', err);
      }
    };

    const loadUnits = async () => {
      try {
        setLoading(true);
        setError(null);

        // Normalize function for name comparison - handles similar characters and Roman numerals
        const normalizeName = (name: string) => {
          let normalized = name.replace(/[-\s]+/g, ' ').trim().toLowerCase();
          // Normalize similar-looking characters (I/l, O/0, etc.)
          normalized = normalized.replace(/[il1|]/g, 'i'); // I, l, 1, | -> i
          normalized = normalized.replace(/[o0]/g, 'o'); // O, 0 -> o
          normalized = normalized.replace(/[s5]/g, 's'); // S, 5 -> s
          normalized = normalized.replace(/[z2]/g, 'z'); // Z, 2 -> z
          return normalized;
        };

        // Use the same matching logic as loadProjects for consistency
        const projectName = decodedProjectName.toLowerCase().trim();
        const normalizedProject = normalizeName(projectName);

        // Extract significant words from project name for initial query
        const projectWords = normalizedProject.split(/[\s-]+/)
          .filter(w => w.length >= 3);
        const firstProjectWord = projectWords.length > 0 ? projectWords[0] : normalizedProject.split(/[\s-]+/).find(w => w.length >= 2) || '';

        // Load units - try to query for matching compounds first, then fall back to all units
        // This is more efficient than loading all 50k units
        let allUnitsData: BRDataProperty[] = [];
        let unitsError: Error | null = null;

        // First, try to query for units that might match (compound contains project words)
        if (firstProjectWord && firstProjectWord.length >= 3) {
          try {
            // Query for units where compound might contain the project name
            // We use ilike with wildcards to find potential matches
            const searchTerms = [
              `%${firstProjectWord}%`,
              `%${normalizedProject}%`,
              `%${decodedProjectName.toLowerCase()}%`
            ];
            
            // Try each search term and combine results
            const queries = searchTerms.map(term => 
              (supabase as any)
                .from('salemate-inventory')
                .select('*')
                .ilike('compound', term)
                .limit(10000)
            );
            
            const results = await Promise.all(queries);
            const allResults: BRDataProperty[] = [];
            const seenIds = new Set();
            
            results.forEach(({ data, error }) => {
              if (error) {
                console.warn('Query error:', error);
                unitsError = error;
              } else if (data) {
                data.forEach((unit: BRDataProperty) => {
                  if (!seenIds.has(unit.id)) {
                    seenIds.add(unit.id);
                    allResults.push(unit);
                  }
                });
              }
            });
            
            allUnitsData = allResults;
            console.log(`📊 Loaded ${allUnitsData.length} units from targeted query`);
          } catch (err) {
            console.warn('Targeted query failed, falling back to full query:', err);
            unitsError = err as Error;
          }
        }

        // If targeted query didn't return enough results or failed, load all units
        if (allUnitsData.length === 0 || unitsError) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (supabase as any)
              .from('salemate-inventory')
              .select('*')
              .limit(50000); // High limit to ensure we get all units
            
            if (error) throw error;
            allUnitsData = (data || []) as BRDataProperty[];
            unitsError = null;
          } catch (err) {
            unitsError = err as Error;
          }
        }

        if (unitsError) throw unitsError;

        console.log(`📊 Total units loaded from database: ${allUnitsData?.length || 0}`);
        console.log(`📊 Project name: "${decodedProjectName}", normalized: "${normalizedProject}"`);

        // Extract all significant words from project name (3+ characters, not stop words)
        const stopWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'let', 'put', 'say', 'she', 'too', 'use'];
        const projectWordsForMatching = normalizedProject.split(/[\s-]+/)
          .filter(w => w.length >= 3)
          .filter(w => !stopWords.includes(w.toLowerCase()));
        
        // Get first significant word for fallback matching (reuse the one from earlier or compute)
        const firstProjectWordForMatching = projectWordsForMatching.length > 0 ? projectWordsForMatching[0] : normalizedProject.split(/[\s-]+/).find(w => w.length >= 2);

        // Get project developer for matching (load it if not already loaded)
        // Try multiple variations of the project name to handle case/character differences
        let developerName: string | null = projectDeveloper;
        if (!developerName) {
          // Try exact match first
          let { data: projectData } = await supabase
            .from('projects')
            .select('region')
            .ilike('name', decodedProjectName)
            .limit(1)
            .single();
          
          // If not found, try with normalized name variations
          if (!projectData) {
            const normalizedName = normalizeName(decodedProjectName);
            // Try to find project by checking all projects and normalizing
            const { data: allProjects } = await supabase
              .from('projects')
              .select('name, region')
              .limit(1000);
            
            if (allProjects) {
              const matchingProject = allProjects.find(p => {
                const projectName = extractName(p.name).toLowerCase().trim();
                const normalizedProjectName = normalizeName(projectName);
                return normalizedProjectName === normalizedName;
              });
              
              if (matchingProject) {
                developerName = extractName(matchingProject.region) || null;
                console.log(`✅ Found project by normalized name: "${matchingProject.name}" with developer: "${developerName}"`);
              }
            }
          } else {
            developerName = extractName(projectData.region) || null;
          }
        }

        // Filter units using the same matching logic as loadProjects, but also match by developer
        const matchedUnits = (allUnitsData as BRDataProperty[] || []).filter((unit) => {
          const compoundName = extractName(unit.compound).toLowerCase().trim();
          if (!compoundName || compoundName === '-' || compoundName === 'unknown') return false;

          const normalizedCompound = normalizeName(compoundName);
          
          // First check if compound matches
          let compoundMatches = false;
          
          // 1. Exact match (after normalization) - highest priority
          if (normalizedCompound === normalizedProject) {
            compoundMatches = true;
          }
          // 2. Contains match (either direction)
          else if (normalizedCompound.includes(normalizedProject) || normalizedProject.includes(normalizedCompound)) {
            compoundMatches = true;
          }
          // 3. VERY LENIENT: If ANY significant word from project appears in compound, match it
          else if (projectWordsForMatching.length > 0) {
            compoundMatches = projectWordsForMatching.some(word => normalizedCompound.includes(word));
          }
          // 4. Fallback: If first significant word matches, count it (handles "Bamboo" matching "Bamboo III")
          else if (firstProjectWordForMatching && normalizedCompound.includes(firstProjectWordForMatching)) {
            compoundMatches = true;
          }
          // 5. Reverse check: Check if any word from compound appears in project
          else if (normalizedCompound.length >= 3) {
            const compoundWords = normalizedCompound.split(/[\s-]+/)
              .filter(w => w.length >= 3)
              .filter(w => !stopWords.includes(w.toLowerCase()));
            compoundMatches = compoundWords.some(word => normalizedProject.includes(word));
          }
          
          if (!compoundMatches) return false;

          // Check if this is an exact or strong match (after normalization)
          const isExactMatch = normalizedCompound === normalizedProject;
          const isStrongMatch = normalizedCompound.includes(normalizedProject) || normalizedProject.includes(normalizedCompound);

          // CRITICAL: Match by developer - but be lenient for exact/strong compound matches
          // This matches the logic in AllProjects.tsx for consistency
          if (developerName) {
            const unitDeveloper = extractName(unit.developer).toLowerCase().trim();
            const normalizedProjectDeveloper = developerName.toLowerCase().trim();
            
            // Skip if developer extraction failed (returned '-' or empty)
            if (!unitDeveloper || unitDeveloper === '-' || unitDeveloper === 'unknown') {
              // If compound matches exactly or strongly, include it even without developer match
              // This handles edge cases where developer data might be missing
              if (isExactMatch || isStrongMatch) {
                return true; // Exact/strong compound match, include even without developer
              }
              // For lenient word matches, require developer to be present
              return false;
            } else {
              // Normalize developer names for better matching (remove common suffixes, etc.)
              const normalizeDeveloper = (name: string) => {
                return name
                  .replace(/\s+(developments?|development|dev|group|company|corp|inc|llc)\s*$/i, '')
                  .trim()
                  .toLowerCase();
              };
              
              const normalizedUnitDev = normalizeDeveloper(unitDeveloper);
              const normalizedProjDev = normalizeDeveloper(normalizedProjectDeveloper);
              
              // Developer must match (exact, contains, or normalized match)
              const developerMatches = 
                normalizedUnitDev === normalizedProjDev ||
                unitDeveloper === normalizedProjectDeveloper ||
                normalizedUnitDev.includes(normalizedProjDev) ||
                normalizedProjDev.includes(normalizedUnitDev) ||
                unitDeveloper.includes(normalizedProjectDeveloper) ||
                normalizedProjectDeveloper.includes(unitDeveloper);
              
              if (!developerMatches) {
                // If compound matches exactly or strongly, still include it (might be data inconsistency)
                // This matches the behavior in AllProjects.tsx
                if (isExactMatch || isStrongMatch) {
                  return true; // Exact/strong compound match - include even if developer doesn't match
                }
                return false; // Skip units from different developers for lenient matches
              }
            }
          } else {
            // No developer specified - only allow exact or strong matches
            // This prevents false positives when developer is unknown
            if (!isExactMatch && !isStrongMatch) {
              return false; // Skip lenient word matches when developer is unknown
            }
          }
          
          return true;
        });

        console.log(`✅ Loaded ${matchedUnits.length} units for project "${decodedProjectName}" (filtered from ${allUnitsData?.length || 0} total units)`);
        console.log(`   Project developer: "${developerName}"`);
        if (matchedUnits.length > 0) {
          const sampleDeveloper = extractName(matchedUnits[0].developer);
          console.log(`   Sample unit developer: "${sampleDeveloper}"`);
        }
        
        setUnits(matchedUnits);
      } catch (err) {
        console.error('Failed to load units:', err);
        setError(err instanceof Error ? err.message : 'Failed to load units');
      } finally {
        setLoading(false);
      }
    };

    loadProjectInfo();
    loadUnits();
  }, [decodedProjectName]);

  const handleViewProperty = (property: BRDataProperty) => {
    setSelectedProperty(property);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProperty(null);
  };

  const totalPages = Math.ceil(units.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedUnits = units.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <SkeletonList count={12} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState
          title="Error Loading Units"
          description={error}
          action={
            <Button onClick={() => navigate('/app/inventory')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Inventory
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/app/inventory/projects')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>
        
        <PageTitle
          title={projectInfo?.name || decodedProjectName}
          subtitle={`${units.length} Available Units`}
          icon={Building}
          color="blue"
        />
      </div>

      {/* Units Grid */}
      {units.length === 0 ? (
        <EmptyState
          title="No Units Found"
          description={`No units found for project "${decodedProjectName}"`}
          action={
            <Button onClick={() => navigate('/app/inventory/projects')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {paginatedUnits.map((unit) => (
              <Card
                key={unit.id}
                className="shop-project-card overflow-hidden group hover:shadow-lg transition-all duration-200 bg-white rounded-lg border-0 cursor-pointer"
                style={{ padding: 0 }}
                onClick={() => handleViewProperty(unit)}
              >
                {/* Hero Photo Section */}
                <div className="relative h-52 w-full overflow-hidden">
                  <SafeImage
                    src={unit.image || undefined}
                    alt={unit.unit_number || unit.unit_id || 'Unit'}
                    fallbackSrc={getHeroImage(extractName(unit.compound))}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    placeholder={
                      <div className="w-full h-full bg-gradient-to-br from-green-50 to-teal-100 flex items-center justify-center">
                        <Home className="h-16 w-16 text-green-300" />
                      </div>
                    }
                  />
                  {/* Subtle Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  {/* Launch Badge */}
                  {unit.is_launch && (
                    <div className="absolute top-2 right-2">
                      <div className="bg-orange-500 text-white px-2 py-0.5 rounded text-[10px] font-semibold shadow-md border border-orange-600/50">
                        <Sparkles className="h-2.5 w-2.5 inline mr-1 align-middle fill-white" />
                        <span className="align-middle">Launch</span>
                      </div>
                    </div>
                  )}
                  {/* Compound Badge */}
                  <div className="absolute top-2 left-2">
                    <div className="bg-white/90 backdrop-blur-sm text-gray-700 px-1.5 py-0.5 rounded text-[10px] font-medium shadow-sm border border-gray-200/50">
                      <Home className="h-2.5 w-2.5 inline mr-1 align-middle" />
                      <span className="align-middle">{extractName(unit.compound)}</span>
                    </div>
                  </div>
                </div>
                {/* Unit Details */}
                <CardContent className="px-3 pt-2 pb-1.5 space-y-1.5">
                  <div>
                    <div className="text-base font-semibold text-gray-900 line-clamp-1">
                      {unit.unit_number || unit.unit_id || 'Unit'} {unit.building_number && `• Bldg ${unit.building_number}`}
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-1">
                      {extractName(unit.developer)} • {extractName(unit.area)}
                    </p>
                  </div>
                  {/* Location */}
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <MapPin className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                    <span className="truncate">{extractName(unit.area)}</span>
                  </div>
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-left p-2 bg-blue-50/50 rounded-lg">
                      <div className="text-xs text-gray-500 mb-0.5 font-medium">Price</div>
                      <div className="text-lg font-semibold text-blue-600">
                        {unit.price_in_egp ? formatCurrency(unit.price_in_egp, unit.currency || 'EGP').replace(' EGP', '') : 'On Request'}
                      </div>
                    </div>
                    <div className="text-left p-2 bg-green-50/50 rounded-lg">
                      <div className="text-xs text-gray-500 mb-0.5 font-medium">Size</div>
                      <div className="text-lg font-semibold text-green-700">
                        {unit.unit_area ? `${formatNumber(unit.unit_area)} m²` : 'N/A'}
                      </div>
                    </div>
                  </div>
                  {/* Bed/Bath */}
                  {(unit.number_of_bedrooms !== undefined || unit.number_of_bathrooms !== undefined) && (
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      {unit.number_of_bedrooms !== undefined && (
                        <div className="flex items-center gap-1">
                          <Bed className="h-3.5 w-3.5 text-blue-500" />
                          <span>{unit.number_of_bedrooms}</span>
                        </div>
                      )}
                      {unit.number_of_bathrooms !== undefined && (
                        <div className="flex items-center gap-1">
                          <Bath className="h-3.5 w-3.5 text-cyan-500" />
                          <span>{unit.number_of_bathrooms}</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Property Details Modal */}
      <PropertyDetailsModal
        property={selectedProperty}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default ProjectUnits;

