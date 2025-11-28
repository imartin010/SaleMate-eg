import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/card';
import { PageTitle } from '../../components/common/PageTitle';
import { supabase } from '../../lib/supabaseClient';
import { SafeImage } from '../../components/common/SafeImage';
import { Home, MapPin, ArrowLeft, Bed, Bath, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

interface Unit {
  id: number;
  unit_id?: string;
  unit_number?: string;
  building_number?: string;
  compound?: string | { name?: string };
  developer?: string | { name?: string };
  area?: string | { name?: string };
  price_in_egp?: number;
  price_per_meter?: number;
  unit_area?: number;
  number_of_bedrooms?: number;
  number_of_bathrooms?: number;
  currency?: string;
  image?: string;
  is_launch?: boolean;
  finishing?: string;
  sale_type?: string;
  floor_number?: number;
}

const extractName = (val: unknown): string => {
  if (!val) return 'Unknown';
  if (typeof val === 'string') {
    const m1 = val.match(/"name"\s*:\s*"([^"]+)"/);
    if (m1?.[1]) return m1[1];
    const m2 = val.match(/'name'\s*:\s*'([^']+)'/);
    if (m2?.[1]) return m2[1];
    return val;
  }
  if (typeof val === 'object') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const o: any = val;
    return o.name ?? o.region ?? o.area ?? 'Unknown';
  }
  return String(val);
};

type SortOption = 'price_asc' | 'price_desc' | 'size_asc' | 'size_desc' | 'bedrooms_asc' | 'bedrooms_desc' | 'name_asc' | 'name_desc';

const ProjectUnits: React.FC = () => {
  const navigate = useNavigate();
  const { projectName } = useParams<{ projectName: string }>();
  const [searchParams] = useSearchParams();
  const decodedProjectName = projectName ? decodeURIComponent(projectName) : '';
  const decodedDeveloperName = searchParams.get('developer') ? decodeURIComponent(searchParams.get('developer') || '') : '';
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('name_asc');

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

  const formatCurrency = (amount: number, currency: string = 'EGP'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  };

  useEffect(() => {
    if (decodedProjectName) {
      loadProjectUnits();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decodedProjectName, decodedDeveloperName]);

  useEffect(() => {
    if (units.length > 0) {
      sortUnits();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy]);

  const sortUnits = () => {
    if (units.length === 0) return;
    
    const sorted = [...units];
    switch (sortBy) {
      case 'price_asc':
        sorted.sort((a, b) => (a.price_in_egp || 0) - (b.price_in_egp || 0));
        break;
      case 'price_desc':
        sorted.sort((a, b) => (b.price_in_egp || 0) - (a.price_in_egp || 0));
        break;
      case 'size_asc':
        sorted.sort((a, b) => (a.unit_area || 0) - (b.unit_area || 0));
        break;
      case 'size_desc':
        sorted.sort((a, b) => (b.unit_area || 0) - (a.unit_area || 0));
        break;
      case 'bedrooms_asc':
        sorted.sort((a, b) => (a.number_of_bedrooms || 0) - (b.number_of_bedrooms || 0));
        break;
      case 'bedrooms_desc':
        sorted.sort((a, b) => (b.number_of_bedrooms || 0) - (a.number_of_bedrooms || 0));
        break;
      case 'name_asc':
        sorted.sort((a, b) => {
          const nameA = (a.unit_number || a.unit_id || '').toLowerCase();
          const nameB = (b.unit_number || b.unit_id || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });
        break;
      case 'name_desc':
        sorted.sort((a, b) => {
          const nameA = (a.unit_number || a.unit_id || '').toLowerCase();
          const nameB = (b.unit_number || b.unit_id || '').toLowerCase();
          return nameB.localeCompare(nameA);
        });
        break;
      default:
        break;
    }
    setUnits(sorted);
  };

  const loadProjectUnits = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!decodedProjectName) {
        throw new Error('Project name is required');
      }

      // Load all units from inventory
      let allUnitsData: Record<string, unknown>[] = [];
      let hasMore = true;
      let currentStart = 0;
      const batchSize = 1000;

      while (hasMore) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: batchData, error: batchError } = await (supabase as any)
          .from('salemate-inventory')
          .select('*')
          .range(currentStart, currentStart + batchSize - 1);

        if (batchError) {
          console.error('Error loading units batch:', batchError);
          throw batchError;
        }

        if (batchData && batchData.length > 0) {
          allUnitsData = allUnitsData.concat(batchData);
        }

        if (!batchData || batchData.length < batchSize) {
          hasMore = false;
        } else {
          currentStart += batchSize;
        }
      }

      // Normalize project and developer names for matching
      const normalizeName = (name: string) => name.replace(/[-\s]+/g, ' ').trim().toLowerCase();
      const normalizedProjectName = normalizeName(decodedProjectName);
      const normalizedDeveloperName = decodedDeveloperName ? normalizeName(decodedDeveloperName) : '';

      // Filter units that match the project
      const filteredUnits = allUnitsData.filter((unit: Record<string, unknown>) => {
        const compound = extractName(unit.compound).toLowerCase().trim();
        const developer = extractName(unit.developer).toLowerCase().trim();
        
        // Normalize compound name for comparison
        const normalizedCompound = normalizeName(compound);
        
        // Check if compound matches project name
        let projectMatches = false;
        
        // 1. Exact match (after normalization)
        if (normalizedCompound === normalizedProjectName) {
          projectMatches = true;
        }
        // 2. Contains match (either direction)
        else if (normalizedCompound.includes(normalizedProjectName) || normalizedProjectName.includes(normalizedCompound)) {
          projectMatches = true;
        }
        // 3. Word-based matching
        else {
          const projectWords = normalizedProjectName.split(/[\s-]+/).filter(w => w.length >= 2);
          const compoundWords = normalizedCompound.split(/[\s-]+/).filter(w => w.length >= 2);
          
          const stopWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'let', 'put', 'say', 'she', 'too', 'use'];
          
          const projectSignificant = projectWords.filter(w => !stopWords.includes(w.toLowerCase()));
          const compoundSignificant = compoundWords.filter(w => !stopWords.includes(w.toLowerCase()));
          
          if (projectSignificant.length > 0 && compoundSignificant.length > 0) {
            const matchingWords = projectSignificant.filter(word => 
              compoundSignificant.some(cWord => cWord.includes(word) || word.includes(cWord))
            );
            projectMatches = matchingWords.length >= Math.min(2, projectSignificant.length) || 
                           matchingWords.length === projectSignificant.length;
          }
        }
        
        // If developer name is provided, also check developer match
        if (projectMatches && normalizedDeveloperName) {
          const developerMatches = developer === normalizedDeveloperName ||
                                  developer.includes(normalizedDeveloperName) ||
                                  normalizedDeveloperName.includes(developer);
          return developerMatches;
        }
        
        return projectMatches;
      });

      console.log(`📊 Loaded ${filteredUnits.length} units for project "${decodedProjectName}"`);

      // Convert to Unit interface
      const unitsList: Unit[] = filteredUnits.map((unit: Record<string, unknown>) => ({
        id: unit.id as number,
        unit_id: unit.unit_id as string | undefined,
        unit_number: unit.unit_number as string | undefined,
        building_number: unit.building_number as string | undefined,
        compound: unit.compound,
        developer: unit.developer,
        area: unit.area,
        price_in_egp: unit.price_in_egp as number | undefined,
        price_per_meter: unit.price_per_meter as number | undefined,
        unit_area: unit.unit_area as number | undefined,
        number_of_bedrooms: unit.number_of_bedrooms as number | undefined,
        number_of_bathrooms: unit.number_of_bathrooms as number | undefined,
        currency: unit.currency as string | undefined,
        image: unit.image as string | undefined,
        is_launch: unit.is_launch as boolean | undefined,
        finishing: unit.finishing as string | undefined,
        sale_type: unit.sale_type as string | undefined,
        floor_number: unit.floor_number as number | undefined,
      }));

      setUnits(unitsList);
      
      // Sort the units after loading
      const sorted = [...unitsList];
      switch (sortBy) {
        case 'price_asc':
          sorted.sort((a, b) => (a.price_in_egp || 0) - (b.price_in_egp || 0));
          break;
        case 'price_desc':
          sorted.sort((a, b) => (b.price_in_egp || 0) - (a.price_in_egp || 0));
          break;
        case 'size_asc':
          sorted.sort((a, b) => (a.unit_area || 0) - (b.unit_area || 0));
          break;
        case 'size_desc':
          sorted.sort((a, b) => (b.unit_area || 0) - (a.unit_area || 0));
          break;
        case 'bedrooms_asc':
          sorted.sort((a, b) => (a.number_of_bedrooms || 0) - (b.number_of_bedrooms || 0));
          break;
        case 'bedrooms_desc':
          sorted.sort((a, b) => (b.number_of_bedrooms || 0) - (a.number_of_bedrooms || 0));
          break;
        case 'name_asc':
          sorted.sort((a, b) => {
            const nameA = (a.unit_number || a.unit_id || '').toLowerCase();
            const nameB = (b.unit_number || b.unit_id || '').toLowerCase();
            return nameA.localeCompare(nameB);
          });
          break;
        case 'name_desc':
          sorted.sort((a, b) => {
            const nameA = (a.unit_number || a.unit_id || '').toLowerCase();
            const nameB = (b.unit_number || b.unit_id || '').toLowerCase();
            return nameB.localeCompare(nameA);
          });
          break;
        default:
          break;
      }
      setUnits(sorted);
    } catch (err) {
      console.error('Failed to load project units:', err);
      setError(err instanceof Error ? err.message : 'Failed to load units');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(decodedDeveloperName ? `/app/inventory/developers/${encodeURIComponent(decodedDeveloperName)}` : '/app/inventory')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <PageTitle title={`Units in ${decodedProjectName}`} icon={Home} color="blue" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="shop-project-card overflow-hidden bg-white rounded-lg border-0 animate-pulse">
              <div className="h-52 w-full bg-gray-200" />
              <CardContent className="px-3 pt-2 pb-1.5 space-y-1.5">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(decodedDeveloperName ? `/app/inventory/developers/${encodeURIComponent(decodedDeveloperName)}` : '/app/inventory')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <PageTitle title={`Units in ${decodedProjectName}`} icon={Home} color="blue" />
        </div>
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
          <Button
            onClick={loadProjectUnits}
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(decodedDeveloperName ? `/app/inventory/developers/${encodeURIComponent(decodedDeveloperName)}` : '/app/inventory')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <PageTitle title={`Units in ${decodedProjectName}`} icon={Home} color="blue" />
            <p className="text-gray-600 mt-2">
              {units.length} available unit{units.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                <SelectItem value="price_asc">Price (Low to High)</SelectItem>
                <SelectItem value="price_desc">Price (High to Low)</SelectItem>
                <SelectItem value="size_asc">Size (Small to Large)</SelectItem>
                <SelectItem value="size_desc">Size (Large to Small)</SelectItem>
                <SelectItem value="bedrooms_asc">Bedrooms (1-5+)</SelectItem>
                <SelectItem value="bedrooms_desc">Bedrooms (5+-1)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {units.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No units available for this project</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {units.map((unit) => (
            <Card
              key={unit.id}
              className="shop-project-card overflow-hidden group hover:shadow-lg transition-all duration-200 bg-white rounded-lg border-0"
              style={{ padding: 0 }}
            >
              {/* Hero Photo Section */}
              <div className="relative h-52 w-full overflow-hidden">
                <SafeImage
                  src={unit.image || undefined}
                  alt={unit.unit_number || unit.unit_id || 'Unit'}
                  fallbackSrc={getHeroImage(extractName(unit.compound))}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  placeholder={
                    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-purple-100 flex items-center justify-center">
                      <Home className="h-16 w-16 text-blue-300" />
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
      )}
    </div>
  );
};

export default ProjectUnits;

