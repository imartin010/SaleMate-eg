import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card } from '../../components/ui/card';
import { PageTitle } from '../../components/common/PageTitle';
import { supabase } from "../../lib/supabaseClient"
import { BRDataProperty, BRDataPropertyFilters, BRDataPropertySort } from '../../types';
import { formatCurrency, formatNumber } from '../../lib/format';
import { PropertyDetailsModal } from '../../components/inventory/PropertyDetailsModal';
import { EmptyState } from '../../components/common/EmptyState';
import { BottomSheet } from '../../components/common/BottomSheet';
import { SkeletonList } from '../../components/common/SkeletonCard';
import { SafeImage } from '../../components/common/SafeImage';
import { CardContent, CardFooter } from '../../components/ui/card';
import {
  Search,
  Filter,
  Home,
  MapPin,
  Building,
  DollarSign,
  Bed,
  Bath,
  Sparkles,
  Eye,
  ArrowUpDown,
  RefreshCw,
  Info,
  ChevronLeft,
  ChevronRight,
  Construction,
  PieChart,
  Palette,
  Waves,
  Armchair,
  ArrowRight,
  Building2,
} from 'lucide-react';

const ITEMS_PER_PAGE = 20;

const Inventory: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<BRDataProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  
  // Card counts
  const [cardCounts, setCardCounts] = useState({
    compounds: 0,
    areas: 0,
    developers: 0,
  });
  
  // Modal state
  const [selectedProperty, setSelectedProperty] = useState<BRDataProperty | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New card-based view data
  const [developers, setDevelopers] = useState<Array<{ id: string; name: string; logo?: string }>>([]);
  const [projects, setProjects] = useState<Array<{ id: string; name: string; region: string; cover_image?: string; available_units: number }>>([]);
  const [units, setUnits] = useState<BRDataProperty[]>([]);
  
  // Loading states for each section
  const [loadingDevelopers, setLoadingDevelopers] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingUnits, setLoadingUnits] = useState(true);
  
  // Pagination indices for each section (showing 4 items at a time)
  const [developerIndex, setDeveloperIndex] = useState(0);
  const [projectIndex, setProjectIndex] = useState(0);
  const [unitIndex, setUnitIndex] = useState(0);
  
  // Filters and sorting
  const [filters, setFilters] = useState<BRDataPropertyFilters>({});
  const [sort, setSort] = useState<BRDataPropertySort>({ 
    field: 'created_at', 
    direction: 'desc' 
  });

  // Check for compound filter from URL params
  useEffect(() => {
    const compoundParam = searchParams.get('compound');
    if (compoundParam) {
      const decodedCompound = decodeURIComponent(compoundParam);
      console.log('🔍 Applying compound filter from URL:', decodedCompound);
      
      // Set filter and show filters panel
      setFilters(prev => {
        const newFilters = { ...prev, compound: decodedCompound };
        console.log('🔍 New filters state:', newFilters);
        return newFilters;
      });
      setShowFilters(true);
    }
  }, [searchParams]);

  // Filter options (will be populated from data)
  const [filterOptions, setFilterOptions] = useState({
    compounds: [] as string[],
    areas: [] as string[],
    developers: [] as string[],
    propertyTypes: [] as string[],
    finishings: [] as string[],
    saleTypes: [] as string[],
  });

  const loadProperties = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🏠 Loading inventory properties with filters:', filters);
      
      // Build query - cast to any to handle dynamic table
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase as any)
        .from('salemate-inventory')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters.search) {
        query = query.or(`unit_id.ilike.%${filters.search}%,unit_number.ilike.%${filters.search}%,building_number.ilike.%${filters.search}%,compound.ilike.%${filters.search}%,developer.ilike.%${filters.search}%,area.ilike.%${filters.search}%`);
      }
      
      if (filters.compound) {
        console.log('🔍 Applying compound filter:', filters.compound);
        console.log('🔍 Full filters object:', filters);
        // Handle compound filtering for JSON data - convert to text and search
        query = query.filter('compound', 'ilike', `%${filters.compound}%`);
        console.log('🔍 Query with compound filter applied');
      }
      
      if (filters.area) {
        query = query.ilike('area', `%${filters.area}%`);
      }
      
      if (filters.developer) {
        query = query.ilike('developer', `%${filters.developer}%`);
      }
      
      if (filters.property_type) {
        query = query.ilike('property_type', `%${filters.property_type}%`);
      }
      
      if (filters.min_bedrooms !== undefined) {
        query = query.gte('number_of_bedrooms', filters.min_bedrooms);
      }
      
      if (filters.max_bedrooms !== undefined) {
        query = query.lte('number_of_bedrooms', filters.max_bedrooms);
      }
      
      if (filters.min_bathrooms !== undefined) {
        query = query.gte('number_of_bathrooms', filters.min_bathrooms);
      }
      
      if (filters.max_bathrooms !== undefined) {
        query = query.lte('number_of_bathrooms', filters.max_bathrooms);
      }
      
      if (filters.min_price !== undefined) {
        query = query.gte('price_in_egp', filters.min_price);
      }
      
      if (filters.max_price !== undefined) {
        query = query.lte('price_in_egp', filters.max_price);
      }
      
      if (filters.min_area !== undefined) {
        query = query.gte('unit_area', filters.min_area);
      }
      
      if (filters.max_area !== undefined) {
        query = query.lte('unit_area', filters.max_area);
      }
      
      if (filters.finishing) {
        query = query.eq('finishing', filters.finishing);
      }
      
      if (filters.sale_type) {
        query = query.eq('sale_type', filters.sale_type);
      }
      
      if (filters.is_launch !== undefined) {
        query = query.eq('is_launch', filters.is_launch);
      }

      // New filters
      if (filters.min_price_per_meter !== undefined) {
        query = query.gte('price_per_meter', filters.min_price_per_meter);
      }
      
      if (filters.max_price_per_meter !== undefined) {
        query = query.lte('price_per_meter', filters.max_price_per_meter);
      }
      
      if (filters.floor_number !== undefined) {
        query = query.eq('floor_number', filters.floor_number);
      }
      
      if (filters.unit_number) {
        query = query.ilike('unit_number', `%${filters.unit_number}%`);
      }
      
      if (filters.building_number) {
        query = query.ilike('building_number', `%${filters.building_number}%`);
      }
      
      if (filters.ready_by !== undefined) {
        query = query.eq('ready_by', filters.ready_by);
      }

      // Apply sorting - first get all data for custom sorting
      query = query.order(sort.field, { ascending: sort.direction === 'asc' });

      // Get total count with same filters
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let countQuery = (supabase as any)
        .from('salemate-inventory')
        .select('*', { count: 'exact', head: true });

      // Apply same filters to count query
      if (filters.search) {
        countQuery = countQuery.or(`unit_id.ilike.%${filters.search}%,unit_number.ilike.%${filters.search}%,building_number.ilike.%${filters.search}%,compound.ilike.%${filters.search}%,developer.ilike.%${filters.search}%,area.ilike.%${filters.search}%`);
      }
      
      if (filters.compound) {
        countQuery = countQuery.filter('compound', 'ilike', `%${filters.compound}%`);
      }
      
      if (filters.area) {
        countQuery = countQuery.ilike('area', `%${filters.area}%`);
      }
      
      if (filters.developer) {
        countQuery = countQuery.ilike('developer', `%${filters.developer}%`);
      }
      
      if (filters.property_type) {
        countQuery = countQuery.ilike('property_type', `%${filters.property_type}%`);
      }
      
      if (filters.min_bedrooms !== undefined) {
        countQuery = countQuery.gte('number_of_bedrooms', filters.min_bedrooms);
      }
      
      if (filters.max_bedrooms !== undefined) {
        countQuery = countQuery.lte('number_of_bedrooms', filters.max_bedrooms);
      }
      
      if (filters.min_bathrooms !== undefined) {
        countQuery = countQuery.gte('number_of_bathrooms', filters.min_bathrooms);
      }
      
      if (filters.max_bathrooms !== undefined) {
        countQuery = countQuery.lte('number_of_bathrooms', filters.max_bathrooms);
      }
      
      if (filters.min_price !== undefined) {
        countQuery = countQuery.gte('price', filters.min_price);
      }
      
      if (filters.max_price !== undefined) {
        countQuery = countQuery.lte('price', filters.max_price);
      }
      
      if (filters.min_area !== undefined) {
        countQuery = countQuery.gte('area', filters.min_area);
      }
      
      if (filters.max_area !== undefined) {
        countQuery = countQuery.lte('area', filters.max_area);
      }
      
      
      if (filters.unit_number) {
        countQuery = countQuery.ilike('unit_number', `%${filters.unit_number}%`);
      }
      
      if (filters.building_number) {
        countQuery = countQuery.ilike('building_number', `%${filters.building_number}%`);
      }
      
      if (filters.ready_by !== undefined) {
        countQuery = countQuery.eq('ready_by', filters.ready_by);
      }

      const { count } = await countQuery;

      // Get all data for custom sorting (we'll paginate after sorting)
      const { data: allData, error: queryError } = await query;

      if (queryError) {
        throw new Error(`Database error: ${queryError.message}`);
      }

      // Custom sorting: Mountain View and Palm Hills first, then others
      const sortedData = (allData as BRDataProperty[])?.sort((a, b) => {
        const aCompound = a.compound?.name?.toLowerCase() || '';
        const bCompound = b.compound?.name?.toLowerCase() || '';
        
        // Priority compounds
        const priorityCompounds = ['mountain view', 'palm hills'];
        
        const aIsPriority = priorityCompounds.some(compound => aCompound.includes(compound));
        const bIsPriority = priorityCompounds.some(compound => bCompound.includes(compound));
        
        // If one is priority and other isn't, priority comes first
        if (aIsPriority && !bIsPriority) return -1;
        if (!aIsPriority && bIsPriority) return 1;
        
        // If both are priority or both are not priority, sort by Mountain View first, then Palm Hills
        if (aIsPriority && bIsPriority) {
          if (aCompound.includes('mountain view') && !bCompound.includes('mountain view')) return -1;
          if (!aCompound.includes('mountain view') && bCompound.includes('mountain view')) return 1;
          if (aCompound.includes('palm hills') && !bCompound.includes('palm hills')) return -1;
          if (!aCompound.includes('palm hills') && bCompound.includes('palm hills')) return 1;
        }
        
        // For same priority level, maintain original sort order
        return 0;
      }) || [];

      // Apply pagination after custom sorting
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      const paginatedData = sortedData.slice(from, to + 1);

      console.log(`✅ Loaded ${paginatedData.length} properties from database (custom sorted)`);
      setProperties(paginatedData);
      setTotalCount(count || 0);

    } catch (error: unknown) {
      console.error('❌ Error loading properties:', error);
      setError((error instanceof Error ? error.message : String(error)) || 'Failed to load properties');
      setProperties([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, sort]);

  useEffect(() => {
    // Add a small delay to ensure filters are properly set
    const timer = setTimeout(() => {
      console.log('🏠 Inventory Card View v2.0 - Loading data...');
      console.log('✅ Card view is ACTIVE - Table view is DISABLED');
      loadProperties();
      loadFilterOptions();
      loadCardCounts();
      loadDevelopers();
      loadProjects();
      loadUnits();
    }, 50);
    
    return () => clearTimeout(timer);
  }, [loadProperties]);


  const loadFilterOptions = async () => {
    try {
      // Get unique values for filter dropdowns
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('salemate-inventory')
        .select('compound, area, developer, property_type, finishing, sale_type')
        .limit(1000); // Get a good sample for filter options

      if (error) throw error;

      const compounds = new Set<string>();
      const areas = new Set<string>();
      const developers = new Set<string>();
      const propertyTypes = new Set<string>();
      const finishings = new Set<string>();
      const saleTypes = new Set<string>();

      data?.forEach((property: Record<string, unknown>) => {
        // Handle compound
        const compound = property.compound as Record<string, unknown>;
        if (compound?.name && typeof compound.name === 'string') {
          compounds.add(compound.name);
        } else if (typeof property.compound === 'string') {
          try {
            const parsed = JSON.parse(property.compound.replace(/'/g, '"'));
            if (parsed.name) compounds.add(parsed.name);
          } catch {
            // Ignore parsing errors
          }
        }
        
        // Handle area
        const area = property.area as Record<string, unknown>;
        if (area?.name && typeof area.name === 'string') {
          areas.add(area.name);
        } else if (typeof property.area === 'string') {
          try {
            const parsed = JSON.parse(property.area.replace(/'/g, '"'));
            if (parsed.name) areas.add(parsed.name);
          } catch {
            // Ignore parsing errors
          }
        }
        
        // Handle developer
        const developer = property.developer as Record<string, unknown>;
        if (developer?.name && typeof developer.name === 'string') {
          developers.add(developer.name);
        } else if (typeof property.developer === 'string') {
          try {
            const parsed = JSON.parse(property.developer.replace(/'/g, '"'));
            if (parsed.name) developers.add(parsed.name);
          } catch {
            // Ignore parsing errors
          }
        }
        
        // Handle property_type
        const propertyType = property.property_type as Record<string, unknown>;
        if (propertyType?.name && typeof propertyType.name === 'string') {
          propertyTypes.add(propertyType.name);
        } else if (typeof property.property_type === 'string') {
          try {
            const parsed = JSON.parse(property.property_type.replace(/'/g, '"'));
            if (parsed.name) propertyTypes.add(parsed.name);
          } catch {
            // Ignore parsing errors
          }
        }
        
        if (property.finishing && typeof property.finishing === 'string') finishings.add(property.finishing);
        if (property.sale_type && typeof property.sale_type === 'string') saleTypes.add(property.sale_type);
      });

      setFilterOptions({
        compounds: Array.from(compounds).sort(),
        areas: Array.from(areas).sort(),
        developers: Array.from(developers).sort(),
        propertyTypes: Array.from(propertyTypes).sort(),
        finishings: Array.from(finishings).sort(),
        saleTypes: Array.from(saleTypes).sort(),
      });
    } catch (error) {
      console.error('Failed to load filter options:', error);
    }
  };

  const loadCardCounts = async () => {
    try {
      console.log('📊 Loading card counts...');
      
      const uniqueCompounds = new Set<string>();
      const uniqueAreas = new Set<string>();
      const uniqueDevelopers = new Set<string>();
      
      let totalFetched = 0;
      let hasMore = true;
      const batchSize = 1000;
      let currentStart = 0;

      // Fetch all records in batches
      while (hasMore) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: batchData, error: batchError } = await (supabase as any)
          .from('salemate-inventory')
          .select('compound, area, developer')
          .range(currentStart, currentStart + batchSize - 1);

        if (batchError) {
          console.error('Batch error:', batchError);
          break;
        }

        if (!batchData || batchData.length === 0) {
          hasMore = false;
          break;
        }

        totalFetched += batchData.length;

        // Process this batch
        batchData.forEach((property: Record<string, unknown>) => {
          // Handle compound - extract name from Python dict string
          if (property.compound) {
            if (typeof property.compound === 'string') {
              const nameMatch = property.compound.match(/'name':\s*'([^']+)'/);
              if (nameMatch && nameMatch[1]) {
                const compoundName = nameMatch[1].trim();
                if (compoundName) {
                  uniqueCompounds.add(compoundName);
                }
              }
            } else if (property.compound && typeof property.compound === 'object' && 'name' in property.compound && typeof property.compound.name === 'string') {
              uniqueCompounds.add(property.compound.name.trim());
            }
          }
          
          // Handle area - extract name from Python dict string
          if (property.area) {
            if (typeof property.area === 'string') {
              const nameMatch = property.area.match(/'name':\s*'([^']+)'/);
              if (nameMatch && nameMatch[1]) {
                const areaName = nameMatch[1].trim();
                if (areaName) {
                  uniqueAreas.add(areaName);
                }
              }
            } else if (property.area && typeof property.area === 'object' && 'name' in property.area && typeof property.area.name === 'string') {
              uniqueAreas.add(property.area.name.trim());
            }
          }
          
          // Handle developer - extract name from Python dict string
          if (property.developer) {
            if (typeof property.developer === 'string') {
              const nameMatch = property.developer.match(/'name':\s*'([^']+)'/);
              if (nameMatch && nameMatch[1]) {
                const developerName = nameMatch[1].trim();
                if (developerName) {
                  uniqueDevelopers.add(developerName);
                }
              }
            } else if (property.developer && typeof property.developer === 'object' && 'name' in property.developer && typeof property.developer.name === 'string') {
              uniqueDevelopers.add(property.developer.name.trim());
            }
          }
        });

        // Check if we got less than expected (end of data)
        if (batchData.length < batchSize) {
          hasMore = false;
        } else {
          currentStart += batchSize;
        }
      }

      console.log('📊 Card counts loaded:', {
        totalRecordsProcessed: totalFetched,
        compounds: uniqueCompounds.size,
        areas: uniqueAreas.size,
        developers: uniqueDevelopers.size,
      });

      setCardCounts({
        compounds: uniqueCompounds.size,
        areas: uniqueAreas.size,
        developers: uniqueDevelopers.size,
      });
    } catch (error) {
      console.error('Failed to load card counts:', error);
    }
  };

  const loadDevelopers = async () => {
    try {
      setLoadingDevelopers(true);
      
      // Fetch all developers in batches to get accurate count
      let allDeveloperData: Record<string, unknown>[] = [];
      let hasMore = true;
      let currentStart = 0;
      const batchSize = 1000;

      while (hasMore) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: batchData, error: batchError } = await (supabase as any)
          .from('salemate-inventory')
          .select('developer')
          .range(currentStart, currentStart + batchSize - 1);

        if (batchError) {
          console.error('Error loading developers batch:', batchError);
          throw batchError;
        }

        if (batchData && batchData.length > 0) {
          allDeveloperData = allDeveloperData.concat(batchData);
        }

        if (!batchData || batchData.length < batchSize) {
          hasMore = false;
        } else {
          currentStart += batchSize;
        }
      }

      const developerMap = new Map<string, { id: string; name: string }>();
      
      allDeveloperData?.forEach((item: Record<string, unknown>) => {
        const developer = item.developer;
        if (developer) {
          let developerName = '';
          let developerId = '';
          
          if (typeof developer === 'string') {
            try {
              // Try to parse Python dict string
              const nameMatch = developer.match(/'name':\s*'([^']+)'/);
              const idMatch = developer.match(/'id':\s*(\d+)/);
              if (nameMatch && nameMatch[1]) {
                developerName = nameMatch[1].trim();
                developerId = idMatch ? idMatch[1] : developerName;
              }
            } catch {
              // If parsing fails, use the string as-is
              developerName = developer;
              developerId = developer;
            }
          } else if (typeof developer === 'object' && developer !== null && 'name' in developer) {
            developerName = (developer as { name: string }).name;
            developerId = (developer as { id?: string | number }).id?.toString() || developerName;
          }
          
          if (developerName && !developerMap.has(developerName)) {
            developerMap.set(developerName, { id: developerId, name: developerName });
          }
        }
      });

      const uniqueDevelopers = Array.from(developerMap.values());
      console.log(`📊 Loaded ${uniqueDevelopers.length} unique developers`);
      setDevelopers(uniqueDevelopers);
    } catch (error) {
      console.error('Failed to load developers:', error);
      setDevelopers([]);
    } finally {
      setLoadingDevelopers(false);
    }
  };

  const loadProjects = async () => {
    try {
      setLoadingProjects(true);
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, name, region, cover_image')
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      // Filter out default project
      const filteredProjects = (projectsData || []).filter((project) => {
        const projectName = project.name?.toLowerCase().trim() || '';
        return projectName !== 'default project' && 
               projectName !== 'default' &&
               projectName.length > 0;
      });

      // Efficient approach: Fetch a sample of unique compound/developer pairs
      // This is much faster than fetching all 23k+ units
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: sampleData, error: sampleError } = await (supabase as any)
        .from('salemate-inventory')
        .select('compound, developer')
        .limit(10000); // Sample size for faster loading - gets unique combinations

      // Group and count units by compound/developer combination
      const unitCountMap: Record<string, number> = {};
      if (!sampleError && sampleData) {
        sampleData.forEach((unit: Record<string, unknown>) => {
          const compound = extractName(unit.compound).toLowerCase().trim();
          const developer = extractName(unit.developer).toLowerCase().trim();
          const key = `${compound}|||${developer}`;
          unitCountMap[key] = (unitCountMap[key] || 0) + 1;
        });
      }

        // Match projects to unit counts
        const projectsWithUnits = filteredProjects.map((project) => {
          let unitCount = 0;
          const projectName = project.name.toLowerCase().trim();
          const projectRegion = project.region?.toLowerCase().trim() || '';

          // Try to match projects to compounds
          Object.keys(unitCountMap).forEach((key) => {
            const [compoundName, developerName] = key.split('|||');
            
            // Check if developer matches
            const developerMatches = projectRegion && (
              developerName === projectRegion ||
              developerName.includes(projectRegion) ||
              projectRegion.includes(developerName)
            );
            
            if (!developerMatches) return;
            
            // Check if project name matches compound (improved matching)
            let matches = false;
            
            // Normalize both names for comparison (remove extra spaces, dashes, etc.)
            const normalizeName = (name: string) => name.replace(/[-\s]+/g, ' ').trim().toLowerCase();
            const normalizedProject = normalizeName(projectName);
            const normalizedCompound = normalizeName(compoundName);
            
            // 1. Exact match (after normalization)
            if (normalizedCompound === normalizedProject) {
              matches = true;
            }
            // 2. Contains match (either direction) - check normalized versions
            else if (normalizedCompound.includes(normalizedProject) || normalizedProject.includes(normalizedCompound)) {
              matches = true;
            }
            // 3. Word-based matching (more flexible)
            else {
              // Split by spaces, dashes, and other separators
              const projectWords = normalizedProject.split(/[\s-]+/).filter(w => w.length >= 2);
              const compoundWords = normalizedCompound.split(/[\s-]+/).filter(w => w.length >= 2);
              
              // Remove only very common words (not location-specific words like "park", "beach", etc.)
              const stopWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'let', 'put', 'say', 'she', 'too', 'use'];
              
              const projectSignificant = projectWords.filter(w => !stopWords.includes(w.toLowerCase()));
              const compoundSignificant = compoundWords.filter(w => !stopWords.includes(w.toLowerCase()));
              
              // Check if at least 2 significant words match (to avoid false positives)
              if (projectSignificant.length > 0 && compoundSignificant.length > 0) {
                const matchingWords = projectSignificant.filter(word => 
                  compoundSignificant.some(cWord => cWord.includes(word) || word.includes(cWord))
                );
                // If at least 2 words match, or if all significant words match, consider it a match
                matches = matchingWords.length >= Math.min(2, projectSignificant.length) || 
                         matchingWords.length === projectSignificant.length;
              }
            }
            
            if (matches) {
              unitCount += unitCountMap[key];
            }
            // Removed fallback to developer-only counting as it was inaccurate
          });

          return {
            id: project.id,
            name: project.name,
            region: project.region,
            cover_image: project.cover_image,
            available_units: unitCount,
          };
        });

      setProjects(projectsWithUnits);
    } catch (error) {
      console.error('Failed to load projects:', error);
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  };

  const loadUnits = async () => {
    try {
      setLoadingUnits(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('salemate-inventory')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setUnits((data as BRDataProperty[]) || []);
    } catch (error) {
      console.error('Failed to load units:', error);
      setUnits([]);
    } finally {
      setLoadingUnits(false);
    }
  };

  const clearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };


  const hasActiveFilters = Object.keys(filters).some(key => 
    filters[key as keyof BRDataPropertyFilters] !== undefined && 
    filters[key as keyof BRDataPropertyFilters] !== ''
  );

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleViewProperty = (property: BRDataProperty) => {
    setSelectedProperty(property);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProperty(null);
  };

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

  // Card-based view components
  const renderDeveloperCards = () => {
    const visibleDevelopers = developers.slice(developerIndex, developerIndex + 4);
    const hasMore = developers.length > developerIndex + 4;
    const canGoBack = developerIndex > 0;

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Developers</h2>
        <div className="flex items-center gap-4 overflow-x-auto pb-4">
          {canGoBack && (
            <Card 
              className="min-w-[80px] flex-shrink-0 cursor-pointer hover:shadow-lg transition-shadow flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-dashed border-blue-300"
              onClick={() => setDeveloperIndex(prev => Math.max(0, prev - 4))}
            >
              <div className="p-4 flex flex-col items-center gap-2">
                <ChevronLeft className="h-6 w-6 text-blue-600" />
                        </div>
            </Card>
          )}
          {visibleDevelopers.map((developer) => (
            <Card key={developer.id} className="shop-project-card min-w-[280px] flex-shrink-0 overflow-hidden group hover:shadow-lg transition-all duration-200 bg-white rounded-lg border-0" style={{ padding: 0 }}>
              {/* Hero Photo Section */}
              <div className="relative h-52 w-full overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center group-hover:scale-[1.02] transition-transform duration-300">
                  <div className="h-24 w-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-4xl font-bold">
                    {developer.name.charAt(0).toUpperCase()}
                    </div>
                      </div>
                {/* Subtle Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                {/* Developer Badge */}
                <div className="absolute top-2 left-2">
                  <div className="bg-white/90 backdrop-blur-sm text-gray-700 px-1.5 py-0.5 rounded text-[10px] font-medium shadow-sm border border-gray-200/50">
                    <Building className="h-2.5 w-2.5 inline mr-1 align-middle" />
                    <span className="align-middle">Developer</span>
                        </div>
                    </div>
                  </div>
              {/* Developer Details */}
              <CardContent className="px-3 pt-2 pb-1.5 space-y-1.5">
                <div>
                  <div className="text-base font-semibold text-gray-900 line-clamp-1">{developer.name}</div>
                  <p className="text-xs text-gray-500 line-clamp-1">Real Estate Developer</p>
                </div>
              </CardContent>
            </Card>
          ))}
          {/* Always show "View All" card */}
          <Card 
            className="shop-project-card min-w-[280px] flex-shrink-0 overflow-hidden group hover:shadow-lg transition-all duration-200 bg-white rounded-lg border-0 cursor-pointer"
            style={{ padding: 0 }}
            onClick={() => navigate('/app/inventory/developers')}
          >
            {/* Hero Photo Section */}
            <div className="relative h-52 w-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600">
              <div className="w-full h-full flex items-center justify-center">
                <ArrowRight className="h-16 w-16 text-white group-hover:scale-110 transition-transform duration-300" />
                  </div>
              {/* Subtle Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              {/* View More Badge */}
              <div className="absolute top-2 left-2">
                <div className="bg-white/90 backdrop-blur-sm text-gray-700 px-1.5 py-0.5 rounded text-[10px] font-medium shadow-sm border border-gray-200/50">
                  <Building className="h-2.5 w-2.5 inline mr-1 align-middle" />
                  <span className="align-middle">View All</span>
                      </div>
                      </div>
                  </div>
            {/* Card Details */}
            <CardContent className="px-3 pt-2 pb-1.5 space-y-1.5">
              <div>
                <div className="text-base font-semibold text-gray-900 line-clamp-1">View All Developers</div>
                <p className="text-xs text-gray-500 line-clamp-1">Browse all developers</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderProjectCards = () => {
    const visibleProjects = projects.slice(projectIndex, projectIndex + 4);
    const hasMore = projects.length > projectIndex + 4;
    const canGoBack = projectIndex > 0;

    const getHeroImage = (projectName: string) => {
      const images = [
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=250&fit=crop',
        'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=250&fit=crop',
        'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&h=250&fit=crop',
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=250&fit=crop',
      ];
      const index = projectName.charCodeAt(0) % images.length;
      return images[index];
    };

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
        <div className="flex items-center gap-4 overflow-x-auto pb-4">
          {canGoBack && (
            <Card 
              className="min-w-[80px] flex-shrink-0 cursor-pointer hover:shadow-lg transition-shadow flex items-center justify-center bg-gradient-to-br from-teal-50 to-blue-50 border-2 border-dashed border-teal-300"
              onClick={() => setProjectIndex(prev => Math.max(0, prev - 4))}
            >
              <div className="p-4 flex flex-col items-center gap-2">
                <ChevronLeft className="h-6 w-6 text-teal-600" />
              </div>
            </Card>
          )}
          {visibleProjects.map((project) => (
            <Card key={project.id} className="shop-project-card min-w-[280px] flex-shrink-0 overflow-hidden group hover:shadow-lg transition-all duration-200 bg-white rounded-lg border-0" style={{ padding: 0 }}>
              {/* Hero Photo Section */}
              <div className="relative h-52 w-full overflow-hidden">
                <SafeImage
                  src={project.cover_image || undefined}
                  alt={project.name}
                  fallbackSrc={getHeroImage(project.name)}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  placeholder={
                    <div className="w-full h-full bg-gradient-to-br from-teal-50 to-blue-100 flex items-center justify-center">
                      <Building2 className="h-16 w-16 text-teal-300" />
                    </div>
                  }
                />
                {/* Subtle Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                {/* Developer Badge */}
                <div className="absolute top-2 left-2">
                  <div className="bg-white/90 backdrop-blur-sm text-gray-700 px-1.5 py-0.5 rounded text-[10px] font-medium shadow-sm border border-gray-200/50">
                    <Building2 className="h-2.5 w-2.5 inline mr-1 align-middle" />
                    <span className="align-middle">{project.region}</span>
                  </div>
                </div>
              </div>
              {/* Project Details */}
              <CardContent className="px-3 pt-2 pb-1.5 space-y-1.5">
                <div>
                  <div className="text-base font-semibold text-gray-900 line-clamp-1">{project.name}</div>
                  <p className="text-xs text-gray-500 line-clamp-1">Premium Real Estate Project</p>
                </div>
                {/* Location */}
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <MapPin className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                  <span className="truncate">{project.region}</span>
                </div>
                {/* Stats */}
                <div className="text-center p-3 bg-blue-50/50 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1 font-medium">Available Units</div>
                  <div className="text-2xl font-semibold text-blue-700">
                    {project.available_units.toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {/* Always show "View All" card */}
          <Card 
            className="shop-project-card min-w-[280px] flex-shrink-0 overflow-hidden group hover:shadow-lg transition-all duration-200 bg-white rounded-lg border-0 cursor-pointer"
            style={{ padding: 0 }}
            onClick={() => navigate('/app/inventory/projects')}
          >
            {/* Hero Photo Section */}
            <div className="relative h-52 w-full overflow-hidden bg-gradient-to-br from-teal-50 to-blue-100">
              <div className="w-full h-full flex items-center justify-center">
                <ArrowRight className="h-16 w-16 text-teal-600 group-hover:scale-110 transition-transform duration-300" />
              </div>
              {/* Subtle Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              {/* View More Badge */}
              <div className="absolute top-2 left-2">
                <div className="bg-white/90 backdrop-blur-sm text-gray-700 px-1.5 py-0.5 rounded text-[10px] font-medium shadow-sm border border-gray-200/50">
                  <Building2 className="h-2.5 w-2.5 inline mr-1 align-middle" />
                  <span className="align-middle">View All</span>
                </div>
              </div>
            </div>
            {/* Card Details */}
            <CardContent className="px-3 pt-2 pb-1.5 space-y-1.5">
              <div>
                <div className="text-base font-semibold text-gray-900 line-clamp-1">View All Projects</div>
                <p className="text-xs text-gray-500 line-clamp-1">Browse all projects from all developers</p>
              </div>
              {/* Stats */}
              <div className="text-center p-3 bg-teal-50/50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1 font-medium">Total Projects</div>
                <div className="text-2xl font-semibold text-teal-700">
                  {projects.length}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderUnitCards = () => {
    const visibleUnits = units.slice(unitIndex, unitIndex + 4);
    const hasMore = units.length > unitIndex + 4;
    const canGoBack = unitIndex > 0;

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

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Available Units</h2>
        <div className="flex items-center gap-4 overflow-x-auto pb-4">
          {canGoBack && (
            <Card 
              className="min-w-[80px] flex-shrink-0 cursor-pointer hover:shadow-lg transition-shadow flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-50 border-2 border-dashed border-green-300"
              onClick={() => setUnitIndex(prev => Math.max(0, prev - 4))}
            >
              <div className="p-4 flex flex-col items-center gap-2">
                <ChevronLeft className="h-6 w-6 text-green-600" />
              </div>
            </Card>
          )}
          {visibleUnits.map((unit) => (
            <Card 
              key={unit.id} 
              className="shop-project-card min-w-[320px] flex-shrink-0 overflow-hidden group hover:shadow-lg transition-all duration-200 bg-white rounded-lg border-0 cursor-pointer" 
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
          {hasMore && (
            <Card 
              className="min-w-[120px] flex-shrink-0 cursor-pointer hover:shadow-lg transition-shadow flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-50 border-2 border-dashed border-green-300"
              onClick={() => setUnitIndex(prev => Math.min(prev + 4, units.length - 4))}
            >
              <div className="p-6 flex flex-col items-center gap-2">
                <ArrowRight className="h-8 w-8 text-green-600" />
                <span className="text-sm font-medium text-green-600">View More</span>
      </div>
            </Card>
          )}
    </div>
      </div>
    );
  };
  
  // Legacy loading skeleton - keep for reference but hidden
  if (false && loading) {
    return (
      <div className="space-y-8">
        {/* Header Skeleton */}
        <div className="space-y-4">
          <div className="h-10 bg-gray-200 rounded animate-pulse w-1/3"></div>
          <div className="h-5 bg-gray-200 rounded animate-pulse w-1/2"></div>
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card-modern p-4">
              <div className="h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* Properties Table Skeleton */}
        <div className="card-modern overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Compound</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Developer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Area</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bed/Bath</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Details</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[...Array(10)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-gray-200 rounded animate-pulse"></div>
                        <div className="ml-3">
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-12"></div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-10"></div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-12"></div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-gradient">Property Inventory</h1>
          <p className="text-lg text-muted-foreground">
            Browse and manage real estate properties
          </p>
        </div>

        <div className="text-center py-12">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Info className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Failed to load inventory
          </h3>
          <p className="text-muted-foreground mb-4">
            {error}
          </p>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/30 via-blue-50/20 to-white">
      <div className="container mx-auto px-4 py-4 md:px-6 md:py-8 space-y-4 md:space-y-6 max-w-7xl">
      {/* Header Section */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-teal-600 via-teal-700 to-teal-800 bg-clip-text text-transparent mb-2">
            Property Inventory
          </h1>
          <p className="text-gray-600 text-base md:text-lg">
            Browse and manage real estate properties from Our Data Science Department
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="card-modern p-4 text-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 mx-auto mb-2">
              <Home className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">{formatNumber(totalCount)}</div>
            <div className="text-sm text-muted-foreground">Total Properties</div>
          </Card>
          
          <Card className="card-modern p-4 text-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 mx-auto mb-2">
              <Building className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">{formatNumber(cardCounts.compounds)}</div>
            <div className="text-sm text-muted-foreground">Compounds</div>
          </Card>
          
          <Card className="card-modern p-4 text-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 mx-auto mb-2">
              <MapPin className="h-5 w-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">{formatNumber(cardCounts.areas)}</div>
            <div className="text-sm text-muted-foreground">Areas</div>
          </Card>
          
          <Card className="card-modern p-4 text-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-100 mx-auto mb-2">
              <DollarSign className="h-5 w-5 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">{formatNumber(cardCounts.developers)}</div>
            <div className="text-sm text-muted-foreground">Developers</div>
          </Card>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="space-y-2">
          {/* URL Filter Indicator */}
          {searchParams.get('compound') && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Viewing properties from: <strong>{decodeURIComponent(searchParams.get('compound') || '')}</strong>
                </span>
                <button 
                  onClick={() => {
                    setFilters(prev => ({ ...prev, compound: undefined }));
                    window.history.replaceState({}, '', '/inventory');
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm underline ml-auto"
                >
                  Clear filter
                </button>
              </div>
            </div>
          )}
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by unit ID, unit number, building number, compound, developer, or area..."
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-10 h-12 text-base"
            />
          </div>
        </div>

        {/* Filter Controls */}
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
                {Object.keys(filters).filter(key => 
                  filters[key as keyof BRDataPropertyFilters] !== undefined && 
                  filters[key as keyof BRDataPropertyFilters] !== ''
                ).length}
              </span>
            )}
          </Button>
          
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                Clear All
              </Button>
            )}
            
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <select
                value={`${sort.field}-${sort.direction}`}
                onChange={(e) => {
                  const [field, direction] = e.target.value.split('-') as [BRDataPropertySort['field'], BRDataPropertySort['direction']];
                  setSort({ field, direction });
                }}
                className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
              >
                <option value="created_at-desc">Newest First</option>
                <option value="created_at-asc">Oldest First</option>
                <option value="price_in_egp-desc">Price: High to Low</option>
                <option value="price_in_egp-asc">Price: Low to High</option>
                <option value="unit_area-desc">Area: Large to Small</option>
                <option value="unit_area-asc">Area: Small to Large</option>
                <option value="price_per_meter-desc">Price/m²: High to Low</option>
                <option value="price_per_meter-asc">Price/m²: Low to High</option>
                <option value="number_of_bedrooms-desc">Most Bedrooms</option>
                <option value="number_of_bedrooms-asc">Least Bedrooms</option>
                <option value="floor_number-desc">Highest Floor</option>
                <option value="floor_number-asc">Lowest Floor</option>
                <option value="unit_id-asc">Unit ID: A-Z</option>
                <option value="unit_id-desc">Unit ID: Z-A</option>
              </select>
            </div>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <Card className="card-modern p-6 space-y-6">
            {/* Location & Developer Filters */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Location & Developer</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Compound</label>
                  <select
                    value={filters.compound || ''}
                    onChange={(e) => setFilters({ ...filters, compound: e.target.value || undefined })}
                    className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Compounds</option>
                    {filterOptions.compounds.map(compound => (
                      <option key={compound} value={compound}>
                        {compound}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Area</label>
                  <select
                    value={filters.area || ''}
                    onChange={(e) => setFilters({ ...filters, area: e.target.value || undefined })}
                    className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Areas</option>
                    {filterOptions.areas.map(area => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Developer</label>
                  <select
                    value={filters.developer || ''}
                    onChange={(e) => setFilters({ ...filters, developer: e.target.value || undefined })}
                    className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Developers</option>
                    {filterOptions.developers.map(developer => (
                      <option key={developer} value={developer}>
                        {developer}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Property Details Filters */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Property Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Property Type</label>
                  <select
                    value={filters.property_type || ''}
                    onChange={(e) => setFilters({ ...filters, property_type: e.target.value || undefined })}
                    className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Types</option>
                    {filterOptions.propertyTypes.map(type => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Finishing Status</label>
                  <select
                    value={filters.finishing || ''}
                    onChange={(e) => setFilters({ ...filters, finishing: e.target.value || undefined })}
                    className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Statuses</option>
                    {filterOptions.finishings.map(finishing => (
                      <option key={finishing} value={finishing}>
                        {finishing}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Sale Type</label>
                  <select
                    value={filters.sale_type || ''}
                    onChange={(e) => setFilters({ ...filters, sale_type: e.target.value || undefined })}
                    className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Sale Types</option>
                    {filterOptions.saleTypes.map(saleType => (
                      <option key={saleType} value={saleType}>
                        {saleType}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Ready By (Year)</label>
                  <input
                    type="number"
                    min="2024"
                    max="2035"
                    value={filters.ready_by || ''}
                    onChange={(e) => setFilters({ 
                      ...filters, 
                      ready_by: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                    className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 2025"
                  />
                </div>
              </div>
            </div>

            {/* Size & Specifications Filters */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Size & Specifications</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Min Bedrooms</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={filters.min_bedrooms || ''}
                    onChange={(e) => setFilters({ 
                      ...filters, 
                      min_bedrooms: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                    className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="Any"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Max Bedrooms</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={filters.max_bedrooms || ''}
                    onChange={(e) => setFilters({ 
                      ...filters, 
                      max_bedrooms: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                    className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="Any"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Min Area (m²)</label>
                  <input
                    type="number"
                    min="0"
                    value={filters.min_area || ''}
                    onChange={(e) => setFilters({ 
                      ...filters, 
                      min_area: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                    className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 100"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Max Area (m²)</label>
                  <input
                    type="number"
                    min="0"
                    value={filters.max_area || ''}
                    onChange={(e) => setFilters({ 
                      ...filters, 
                      max_area: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                    className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 500"
                  />
                </div>
              </div>
            </div>

            {/* Price Filters */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Price Range</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Min Price (EGP)</label>
                  <input
                    type="number"
                    min="0"
                    step="100000"
                    value={filters.min_price || ''}
                    onChange={(e) => setFilters({ 
                      ...filters, 
                      min_price: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                    className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 1000000"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Max Price (EGP)</label>
                  <input
                    type="number"
                    min="0"
                    step="100000"
                    value={filters.max_price || ''}
                    onChange={(e) => setFilters({ 
                      ...filters, 
                      max_price: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                    className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 50000000"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Min Price/m² (EGP)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={filters.min_price_per_meter || ''}
                    onChange={(e) => setFilters({ 
                      ...filters, 
                      min_price_per_meter: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                    className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 10000"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Max Price/m² (EGP)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={filters.max_price_per_meter || ''}
                    onChange={(e) => setFilters({ 
                      ...filters, 
                      max_price_per_meter: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                    className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 100000"
                  />
                </div>
              </div>
            </div>

            {/* Additional Filters */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Additional Filters</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Floor Number</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={filters.floor_number || ''}
                    onChange={(e) => setFilters({ 
                      ...filters, 
                      floor_number: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                    className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 5"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Unit Number</label>
                  <input
                    type="text"
                    value={filters.unit_number || ''}
                    onChange={(e) => setFilters({ 
                      ...filters, 
                      unit_number: e.target.value || undefined 
                    })}
                    className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. A1-05"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Building Number</label>
                  <input
                    type="text"
                    value={filters.building_number || ''}
                    onChange={(e) => setFilters({ 
                      ...filters, 
                      building_number: e.target.value || undefined 
                    })}
                    className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. B1"
                  />
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{formatNumber(properties.length)}</span> of{' '}
          <span className="font-semibold text-foreground">{formatNumber(totalCount)}</span> properties
        </p>
        {hasActiveFilters && (
          <Badge variant="secondary" className="text-xs">
            Filtered
          </Badge>
        )}
      </div>

      {/* Desktop Recommendation Banner - Mobile Only */}
      <div className="md:hidden bg-amber-50 border-l-4 border-amber-400 p-4 rounded-lg">
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800 font-medium">
            Desktop view is recommended in inventory for better experience
          </p>
        </div>
      </div>

      {/* Card-based View - Updated to card layout - Force rebuild */}
      <div className="space-y-8">
        {/* Developers Section */}
        {loadingDevelopers ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Developers</h2>
            <div className="flex items-center gap-4 overflow-x-auto pb-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="min-w-[280px] flex-shrink-0">
                  <div className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-gray-200 animate-pulse"></div>
                      <div className="flex-1">
                        <div className="h-5 bg-gray-200 rounded animate-pulse mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : developers.length > 0 ? (
          renderDeveloperCards()
        ) : (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Developers</h2>
            <Card className="p-8 text-center">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No developers found</p>
            </Card>
          </div>
        )}

        {/* Projects Section */}
        {loadingProjects ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
            <div className="flex items-center gap-4 overflow-x-auto pb-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="min-w-[280px] flex-shrink-0 overflow-hidden">
                  <div className="h-48 bg-gray-200 animate-pulse"></div>
                  <div className="p-6">
                    <div className="h-5 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : projects.length > 0 ? (
          renderProjectCards()
        ) : (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
            <Card className="p-8 text-center">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No projects found</p>
            </Card>
          </div>
        )}

        {/* Units Section */}
        {loadingUnits ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Available Units</h2>
            <div className="flex items-center gap-4 overflow-x-auto pb-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="min-w-[320px] flex-shrink-0">
                  <div className="h-48 bg-gray-200 animate-pulse"></div>
                  <div className="p-6">
                    <div className="h-5 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : units.length > 0 ? (
          renderUnitCards()
        ) : (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Available Units</h2>
            <Card className="p-8 text-center">
              <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No units found</p>
            </Card>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  className="w-10 h-10 p-0"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Empty State */}
      {properties.length === 0 && !loading && (
        <EmptyState
          title={hasActiveFilters ? 'No properties found' : 'No properties available'}
          description={hasActiveFilters 
            ? 'Try adjusting your search criteria or filters'
            : 'There are currently no properties in the inventory'}
          ctaText={hasActiveFilters ? 'Clear Filters' : undefined}
          onCtaClick={hasActiveFilters ? clearFilters : undefined}
        />
      )}

      {/* Mobile Filters Bottom Sheet */}
      <BottomSheet
        open={showFilters}
        onClose={() => setShowFilters(false)}
        title="Advanced Filters"
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
        <div className="space-y-6">
          {/* Mobile filter content - simplified version of desktop filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Compound</label>
            <select
              value={filters.compound || ''}
              onChange={(e) => setFilters({ ...filters, compound: e.target.value || undefined })}
              className="w-full p-3 border-2 border-gray-300 rounded-xl bg-white text-base focus:ring-2 focus:ring-blue-500 min-h-[48px]"
            >
              <option value="">All Compounds</option>
              {filterOptions.compounds.map(compound => (
                <option key={compound} value={compound}>
                  {compound}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Area</label>
            <select
              value={filters.area || ''}
              onChange={(e) => setFilters({ ...filters, area: e.target.value || undefined })}
              className="w-full p-3 border-2 border-gray-300 rounded-xl bg-white text-base focus:ring-2 focus:ring-blue-500 min-h-[48px]"
            >
              <option value="">All Areas</option>
              {filterOptions.areas.map(area => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Developer</label>
            <select
              value={filters.developer || ''}
              onChange={(e) => setFilters({ ...filters, developer: e.target.value || undefined })}
              className="w-full p-3 border-2 border-gray-300 rounded-xl bg-white text-base focus:ring-2 focus:ring-blue-500 min-h-[48px]"
            >
              <option value="">All Developers</option>
              {filterOptions.developers.map(developer => (
                <option key={developer} value={developer}>
                  {developer}
                </option>
              ))}
            </select>
          </div>
        </div>
      </BottomSheet>

      {/* Property Details Modal */}
      <PropertyDetailsModal
        property={selectedProperty}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
      </div>
    </div>
  );
};

export default Inventory;

