import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card } from '../../components/ui/card';
import { PageTitle } from '../../components/common/PageTitle';
import { supabase } from "../../lib/supabaseClient"
import { BRDataProperty, BRDataPropertyFilters, BRDataPropertySort } from '../../types';
import { formatCurrency, formatNumber } from '../../lib/format';
import { PropertyDetailsModal } from '../../components/inventory/PropertyDetailsModal';
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
} from 'lucide-react';

const ITEMS_PER_PAGE = 20;

const Inventory: React.FC = () => {
  const [searchParams] = useSearchParams();
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
      loadProperties();
      loadFilterOptions();
      loadCardCounts();
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

  const renderPropertyTable = () => (
    <div className="card-modern overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Compound
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Developer
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Area
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unit
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bed/Bath
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Size (m²)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Floor
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price/m²
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ready By
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Full Details
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {properties.map((property) => (
              <tr key={property.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {(() => {
                    const compound = property.compound as Record<string, unknown>;
                    if (compound?.name) return compound.name;
                    if (typeof compound === 'string') {
                      try {
                        const parsed = JSON.parse((compound as string).replace(/'/g, '"'));
                        return parsed.name || '-';
                      } catch {
                        return compound;
                      }
                    }
                    return '-';
                  })()}
                </td>
                
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {(() => {
                    const developer = property.developer as Record<string, unknown>;
                    if (developer?.name) return developer.name;
                    if (typeof developer === 'string') {
                      try {
                        const parsed = JSON.parse((developer as string).replace(/'/g, '"'));
                        return parsed.name || '-';
                      } catch {
                        return developer;
                      }
                    }
                    return '-';
                  })()}
                </td>
                
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {(() => {
                    const area = property.area as Record<string, unknown>;
                    if (area?.name) return area.name;
                    if (typeof area === 'string') {
                      try {
                        const parsed = JSON.parse((area as string).replace(/'/g, '"'));
                        return parsed.name || '-';
                      } catch {
                        return area;
                      }
                    }
                    return '-';
                  })()}
                </td>
                
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      {property.image ? (
                        <img 
                          className="h-10 w-10 rounded object-cover" 
                          src={property.image} 
                          alt={`Unit ${property.unit_number || property.unit_id}`} 
                        />
                      ) : (
                        <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center">
                          <Home className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        {property.unit_number || property.unit_id || 'N/A'}
                      </div>
                      {property.building_number && (
                        <div className="text-sm text-gray-500">
                          Bldg {property.building_number}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex flex-col gap-1">
                    {(() => {
                      let propertyTypeName = null;
                      const propertyType = property.property_type as Record<string, unknown>;
                      if (propertyType?.name) {
                        propertyTypeName = propertyType.name;
                      } else if (typeof propertyType === 'string') {
                        try {
                          const parsed = JSON.parse((propertyType as string).replace(/'/g, '"'));
                          propertyTypeName = parsed.name;
                        } catch {
                          propertyTypeName = propertyType;
                        }
                      }
                      
                      return propertyTypeName && (
                        <Badge variant="secondary" className="text-xs w-fit">
                          {propertyTypeName}
                        </Badge>
                      );
                    })()}
                    {property.finishing && (
                      <Badge 
                        variant="outline" 
                        className={`text-xs w-fit flex items-center gap-1 ${
                          property.finishing.toLowerCase() === 'finished' 
                            ? 'border-green-500 text-green-700 bg-green-50' 
                            : property.finishing.toLowerCase() === 'furnished'
                            ? 'border-purple-500 text-purple-700 bg-purple-50'
                            : property.finishing.toLowerCase() === 'semi finished' || property.finishing.toLowerCase() === 'semi-finished' || property.finishing.toLowerCase() === 'semi_finished'
                            ? 'border-orange-500 text-orange-700 bg-orange-50'
                            : property.finishing.toLowerCase() === 'flexi finished' || property.finishing.toLowerCase() === 'flexi_finished'
                            ? 'border-blue-500 text-blue-700 bg-blue-50'
                            : property.finishing.toLowerCase() === 'not finished' || property.finishing.toLowerCase() === 'not_finished'
                            ? 'border-red-500 text-red-700 bg-red-50'
                            : ''
                        }`}
                      >
                        {property.finishing.toLowerCase() === 'finished' && (
                          <Palette className="h-3 w-3" />
                        )}
                        {property.finishing.toLowerCase() === 'furnished' && (
                          <Armchair className="h-3 w-3" />
                        )}
                        {(property.finishing.toLowerCase() === 'semi finished' || property.finishing.toLowerCase() === 'semi-finished' || property.finishing.toLowerCase() === 'semi_finished') && (
                          <PieChart className="h-3 w-3" />
                        )}
                        {(property.finishing.toLowerCase() === 'flexi finished' || property.finishing.toLowerCase() === 'flexi_finished') && (
                          <Waves className="h-3 w-3" />
                        )}
                        {(property.finishing.toLowerCase() === 'not finished' || property.finishing.toLowerCase() === 'not_finished') && (
                          <Construction className="h-3 w-3" />
                        )}
                        {property.finishing}
                      </Badge>
                    )}
                  </div>
                </td>
                
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center gap-3">
                    {property.number_of_bedrooms !== undefined && (
                      <div className="flex items-center gap-1">
                        <Bed className="h-3 w-3 text-blue-500" />
                        <span>{property.number_of_bedrooms}</span>
                      </div>
                    )}
                    {property.number_of_bathrooms !== undefined && (
                      <div className="flex items-center gap-1">
                        <Bath className="h-3 w-3 text-cyan-500" />
                        <span>{property.number_of_bathrooms}</span>
                      </div>
                    )}
                  </div>
                </td>
                
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {property.unit_area ? formatNumber(property.unit_area) : '-'}
                </td>
                
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {property.floor_number !== undefined ? property.floor_number : '-'}
                </td>
                
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {property.price_in_egp ? 
                      formatCurrency(property.price_in_egp, property.currency || 'EGP') : 
                      'On Request'
                    }
                  </div>
                </td>
                
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {property.price_per_meter ? 
                    formatCurrency(property.price_per_meter, property.currency || 'EGP') : 
                    '-'
                  }
                </td>
                
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {property.ready_by ? 
                    new Date(property.ready_by).toLocaleDateString() : 
                    '-'
                  }
                </td>
                
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex flex-col gap-1">
                    {property.is_launch && (
                      <Badge className="bg-orange-500 text-white text-xs w-fit">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Launch
                      </Badge>
                    )}
                    {property.offers && (
                      <Badge className="bg-green-500 text-white text-xs w-fit">
                        Offer
                      </Badge>
                    )}
                    {property.sale_type && (
                      <Badge variant="outline" className="text-xs w-fit">
                        {property.sale_type}
                      </Badge>
                    )}
                  </div>
                </td>
                
                <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleViewProperty(property)}
                    className="hover:bg-primary/10 hover:text-primary"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (loading) {
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
    <div className="space-y-8">
      {/* Header Section */}
      <div className="space-y-4">
        <PageTitle
          title="Property Inventory"
          subtitle="Browse and manage real estate properties from Our Data Science Department"
          icon={Home}
          color="teal"
        />

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
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{properties.length}</span> of{' '}
          <span className="font-semibold text-foreground">{formatNumber(totalCount)}</span> properties
        </p>
        {hasActiveFilters && (
          <Badge variant="secondary" className="text-xs">
            Filtered
          </Badge>
        )}
      </div>

      {/* Properties Table */}
      {properties.length > 0 && renderPropertyTable()}

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
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Home className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {hasActiveFilters ? 'No properties found' : 'No properties available'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {hasActiveFilters 
              ? 'Try adjusting your search criteria or filters.'
              : 'There are currently no properties in the inventory.'
            }
          </p>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>
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

export default Inventory;
