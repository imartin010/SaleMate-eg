import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/card';
import { PageTitle } from '../../components/common/PageTitle';
import { supabase } from '../../lib/supabaseClient';
import { Building, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/button';

interface Developer {
  id: string;
  name: string;
  logo?: string;
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

const AllDevelopers: React.FC = () => {
  const navigate = useNavigate();
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const letterRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    loadAllDevelopers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAllDevelopers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all developers from inventory - fetch all records
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

      const data = allDeveloperData;

      if (!data || data.length === 0) {
        throw new Error('No developers data returned');
      }

      console.log(`📊 Loaded ${data.length} inventory records to extract developers`);

      const developerMap = new Map<string, { id: string; name: string }>();
      
      data?.forEach((item: Record<string, unknown>) => {
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

      // Sort developers alphabetically by name
      const sortedDevelopers = Array.from(developerMap.values()).sort((a, b) => 
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true })
      );

      console.log(`✅ Loaded ${sortedDevelopers.length} unique developers`);

      setDevelopers(sortedDevelopers);
    } catch (err) {
      console.error('Failed to load developers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load developers');
    } finally {
      setLoading(false);
    }
  };

  // Get first letter of developer name (normalized)
  const getFirstLetter = (name: string): string => {
    const firstChar = name.trim().charAt(0).toUpperCase();
    return /[A-Z]/.test(firstChar) ? firstChar : '#';
  };

  // Group developers by first letter
  const groupedDevelopers = developers.reduce((acc, developer) => {
    const letter = getFirstLetter(developer.name);
    if (!acc[letter]) {
      acc[letter] = [];
    }
    acc[letter].push(developer);
    return acc;
  }, {} as Record<string, Developer[]>);

  // Get all available letters
  const availableLetters = Object.keys(groupedDevelopers).sort();

  // Scroll to letter section
  const scrollToLetter = (letter: string) => {
    const element = letterRefs.current[letter];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/app/inventory')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Inventory
          </Button>
          <PageTitle title="All Developers" icon={Building} color="blue" />
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
            onClick={() => navigate('/app/inventory')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Inventory
          </Button>
          <PageTitle title="All Developers" icon={Building} color="blue" />
        </div>
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
          <Button
            onClick={loadAllDevelopers}
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
          onClick={() => navigate('/app/inventory')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Inventory
        </Button>
        <PageTitle title="All Developers" icon={Building} color="blue" />
        <p className="text-gray-600 mt-2">
          Browse all developers ({developers.length} developers)
        </p>
      </div>

      {developers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No developers available</p>
        </div>
      ) : (
        <div className="relative">
          {/* Letter Navigation - Mobile (Horizontal Scroll) */}
          <div className="lg:hidden mb-4 overflow-x-auto pb-2 -mx-4 px-4">
            <div className="flex gap-2 min-w-max">
              {availableLetters.map((letter) => (
                <button
                  key={letter}
                  onClick={() => scrollToLetter(letter)}
                  className="px-3 py-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors active:scale-95 whitespace-nowrap border border-blue-200"
                >
                  {letter}
                </button>
              ))}
            </div>
          </div>

          {/* Letter Navigation Sidebar - Fixed on the right (Desktop) */}
          <div className="fixed right-4 top-1/2 -translate-y-1/2 h-fit hidden lg:flex flex-col gap-1 bg-white/95 backdrop-blur-sm rounded-lg p-2 border border-gray-200 shadow-lg z-30 max-h-[80vh] overflow-y-auto">
            {availableLetters.map((letter) => (
              <button
                key={letter}
                onClick={() => scrollToLetter(letter)}
                className="w-8 h-8 flex items-center justify-center text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors active:scale-95"
                title={`Jump to ${letter}`}
              >
                {letter}
              </button>
            ))}
          </div>

          {/* Developers Grid */}
          <div className="lg:pr-16">
            {availableLetters.map((letter) => (
              <div key={letter} ref={(el) => { letterRefs.current[letter] = el; }} className="mb-8 scroll-mt-4">
                {/* Letter Header */}
                <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm py-3 mb-4 border-b-2 border-blue-200">
                  <h2 className="text-2xl font-bold text-blue-700">{letter}</h2>
                  <p className="text-sm text-gray-500">{groupedDevelopers[letter].length} developer{groupedDevelopers[letter].length !== 1 ? 's' : ''}</p>
                </div>
                
                {/* Developers for this letter */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {groupedDevelopers[letter].map((developer) => (
                    <Card
                      key={developer.id}
                      className="shop-project-card overflow-hidden group hover:shadow-lg transition-all duration-200 bg-white rounded-lg border-0 cursor-pointer"
                      style={{ padding: 0 }}
                      onClick={() => navigate(`/app/inventory/developers/${encodeURIComponent(developer.name)}`)}
                    >
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
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AllDevelopers;

