import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/card';
import { PageTitle } from '../../components/common/PageTitle';
import { supabase } from '../../lib/supabaseClient';
import { SafeImage } from '../../components/common/SafeImage';
import { Building2, MapPin, ArrowLeft, Building } from 'lucide-react';
import { Button } from '../../components/ui/button';

interface Project {
  id: string;
  name: string;
  region: string;
  cover_image?: string;
  available_units: number;
}

const extractName = (val: unknown): string => {
  if (!val) return 'Unknown';
  
  // Handle object case (Supabase might return parsed JSON)
  if (typeof val === 'object' && val !== null) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const o: any = val;
    if ('name' in o && o.name) {
      return String(o.name);
    }
    if ('region' in o && o.region) {
      return String(o.region);
    }
    if ('area' in o && o.area) {
      return String(o.area);
    }
    // If it's an object but no name field, try to stringify and parse
    try {
      const str = JSON.stringify(val);
      const parsed = JSON.parse(str.replace(/'/g, '"'));
      if (parsed && typeof parsed === 'object' && 'name' in parsed) {
        return String(parsed.name);
      }
    } catch {
      // Ignore
    }
    return 'Unknown';
  }
  
  // Handle string case
  if (typeof val === 'string') {
    // Try to parse as JSON first (handles both single and double quotes)
    try {
      // Replace single quotes with double quotes for JSON parsing
      const jsonStr = val.replace(/'/g, '"');
      const parsed = JSON.parse(jsonStr);
      if (parsed && typeof parsed === 'object' && 'name' in parsed) {
        return String(parsed.name);
      }
    } catch {
      // If JSON parsing fails, try regex matching
    }
    
    // Fallback to regex matching for malformed JSON strings
    // Try double quotes first
    const m1 = val.match(/"name"\s*:\s*"([^"]+)"/);
    if (m1?.[1]) return m1[1];
    
    // Try single quotes
    const m2 = val.match(/'name'\s*:\s*'([^']+)'/);
    if (m2?.[1]) return m2[1];
    
    // If no match, return the string as-is (might be a plain string)
    return val;
  }
  
  return String(val);
};

// Normalize function for name comparison - handles similar characters and Roman numerals
const normalizeName = (name: string) => {
  let normalized = name.replace(/[-\s]+/g, ' ').trim().toLowerCase();
  // Normalize similar-looking characters (I/l, O/0, etc.)
  // Note: This regex matches i, l (lowercase L), 1, or | and replaces with 'i'
  normalized = normalized.replace(/[il1|]/g, 'i'); // I, l, 1, | -> i
  normalized = normalized.replace(/[o0]/g, 'o'); // O, 0 -> o
  normalized = normalized.replace(/[s5]/g, 's'); // S, 5 -> s
  normalized = normalized.replace(/[z2]/g, 'z'); // Z, 2 -> z
  return normalized;
};

const AllProjects: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const letterRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Error boundary for component-level errors
  if (error && !loading) {
    console.error('AllProjects error:', error);
  }

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

  // Get first letter of project name (normalized)
  const getFirstLetter = (name: string): string => {
    const firstChar = name.trim().charAt(0).toUpperCase();
    return /[A-Z]/.test(firstChar) ? firstChar : '#';
  };

  // Group projects by first letter
  const groupedProjects = projects.reduce((acc, project) => {
    const letter = getFirstLetter(project.name);
    if (!acc[letter]) {
      acc[letter] = [];
    }
    acc[letter].push(project);
    return acc;
  }, {} as Record<string, Project[]>);

  // Get all available letters
  const availableLetters = Object.keys(groupedProjects).sort();

  // Scroll to letter section
  const scrollToLetter = (letter: string) => {
    const element = letterRefs.current[letter];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    loadAllProjects();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAllProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, name, region, cover_image')
        .order('created_at', { ascending: false });

      if (projectsError) {
        console.error('Error loading projects:', projectsError);
        throw projectsError;
      }

      if (!projectsData) {
        throw new Error('No projects data returned');
      }

      // Filter out default project
      const filteredProjects = (projectsData || []).filter((project) => {
        const projectName = project.name?.toLowerCase().trim() || '';
        return projectName !== 'default project' && 
               projectName !== 'default' &&
               projectName.length > 0;
      });

      // Count units by compound name AND developer - match project name to compound name AND developer
      // Load ALL units using pagination (Supabase has a default limit of 1000, so we must paginate)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let allUnitsData: Record<string, unknown>[] = [];
      let hasMore = true;
      let page = 0;
      const pageSize = 1000; // Supabase default limit
      
      while (hasMore) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: pageData, error: unitsError } = await (supabase as any)
          .from('salemate-inventory')
          .select('compound, developer')
          .range(page * pageSize, (page + 1) * pageSize - 1);
        
        if (unitsError) {
          console.error('Error loading units:', unitsError);
          break;
        }
        
        if (pageData && pageData.length > 0) {
          allUnitsData = allUnitsData.concat(pageData);
          hasMore = pageData.length === pageSize;
          page++;
          console.log(`📊 Loaded page ${page}: ${pageData.length} units (total: ${allUnitsData.length})`);
        } else {
          hasMore = false;
        }
      }
      
      console.log(`📊 Loaded ${allUnitsData.length} total units for counting`);
      
      // Quick check: Count how many have "bamboo" in compound
      const bambooUnits = allUnitsData.filter(unit => {
        const compound = extractName(unit.compound).toLowerCase();
        return compound.includes('bamboo');
      });
      console.log(`📊 Found ${bambooUnits.length} units with "bamboo" in compound name`);
      if (bambooUnits.length > 0) {
        const sample = extractName(bambooUnits[0].compound);
        console.log(`📊 Sample bamboo compound: "${sample}"`);
      }

      // Group and count units by compound name AND developer (to ensure we only match units from the same developer)
      // Use a structure: compound -> developer -> count, but also track units without developer
      const compoundDeveloperCountMap: Record<string, Record<string, number>> = {};
      const compoundCountMap: Record<string, number> = {}; // Fallback: count by compound only
      
      if (allUnitsData && allUnitsData.length > 0) {
        let bambooSampleCount = 0;
        allUnitsData.forEach((unit: Record<string, unknown>) => {
          try {
            // Debug: Log first few Bamboo units to see the actual data format
            const rawCompound = unit.compound;
            const extractedCompound = extractName(unit.compound);
            if (extractedCompound.toLowerCase().includes('bamboo') && bambooSampleCount < 3) {
              console.log(`🔍 DEBUG: Bamboo unit sample ${bambooSampleCount + 1}:`);
              console.log(`   Raw compound type: ${typeof rawCompound}`);
              console.log(`   Raw compound value:`, rawCompound);
              console.log(`   Raw compound stringified:`, JSON.stringify(rawCompound));
              console.log(`   Extracted compound: "${extractedCompound}"`);
              const normalized = normalizeName(extractedCompound);
              console.log(`   Normalized: "${normalized}"`);
              bambooSampleCount++;
            }
            
            const compound = extractedCompound.toLowerCase().trim();
            if (!compound || compound === '-' || compound === 'unknown') return;
            
            // Count by compound (for backwards compatibility)
            compoundCountMap[compound] = (compoundCountMap[compound] || 0) + 1;
            
            // Also track by developer if available
            const developer = extractName(unit.developer).toLowerCase().trim();
            if (developer && developer !== '-' && developer !== 'unknown') {
              if (!compoundDeveloperCountMap[compound]) {
                compoundDeveloperCountMap[compound] = {};
              }
              compoundDeveloperCountMap[compound][developer] = (compoundDeveloperCountMap[compound][developer] || 0) + 1;
            }
          } catch (e) {
            // Skip invalid units
            console.warn('Skipping invalid unit:', e);
          }
        });
      }

      console.log(`📊 Loaded ${Object.keys(compoundDeveloperCountMap).length} unique compounds with developer data`);
      console.log(`📊 Loaded ${Object.keys(compoundCountMap).length} unique compounds total`);
      console.log(`📊 Total units loaded: ${allUnitsData?.length || 0}`);
      
      // Verify extraction is working
      if (allUnitsData && allUnitsData.length > 0) {
        const sampleUnit = allUnitsData[0] as Record<string, unknown>;
        const sampleCompound = extractName(sampleUnit.compound);
        const sampleDeveloper = extractName(sampleUnit.developer);
        console.log(`📊 Sample unit - Compound: "${sampleCompound}", Developer: "${sampleDeveloper}"`);
      }
      
      // Direct verification: Check if "bamboo lll" is in the map
      const bambooLllLower = 'bamboo lll';
      const bambooLllCount = compoundCountMap[bambooLllLower];
      if (bambooLllCount) {
        console.log(`✅ VERIFIED: "${bambooLllLower}" found in map with ${bambooLllCount} units`);
        const normalized = normalizeName(bambooLllLower);
        console.log(`   Normalized value: "${normalized}"`);
        if (compoundDeveloperCountMap[bambooLllLower]) {
          console.log(`   Developers:`, Object.keys(compoundDeveloperCountMap[bambooLllLower]));
        }
      } else {
        console.warn(`❌ "${bambooLllLower}" NOT FOUND in compoundCountMap`);
        // Check all variations
        const variations = ['bamboo lll', 'Bamboo lll', 'bamboo III', 'Bamboo III'];
        variations.forEach(v => {
          const lower = v.toLowerCase();
          if (compoundCountMap[lower]) {
            console.warn(`   Found variation "${lower}": ${compoundCountMap[lower]} units`);
          }
        });
      }
      
      // Debug: Check for Bamboo compounds
      const bambooCompounds = Object.keys(compoundCountMap).filter(c => 
        c.toLowerCase().includes('bamboo')
      );
      if (bambooCompounds.length > 0) {
        console.log(`📊 Found ${bambooCompounds.length} compounds with "bamboo":`, bambooCompounds);
        bambooCompounds.forEach(c => {
          const normalized = normalizeName(c);
          console.log(`   - "${c}": ${compoundCountMap[c]} units (normalized: "${normalized}")`);
          if (compoundDeveloperCountMap[c]) {
            console.log(`     Developers:`, Object.keys(compoundDeveloperCountMap[c]));
          }
        });
      } else {
        console.warn(`⚠️ No bamboo compounds found in compoundCountMap!`);
        console.warn(`   Total compounds in map: ${Object.keys(compoundCountMap).length}`);
        console.warn(`   Sample compounds:`, Object.keys(compoundCountMap).slice(0, 20));
      }

      // Match projects to unit counts - use EXACT same logic as ProjectUnits.tsx
      // Query all units once and filter for each project (same approach as ProjectUnits.tsx)
      const projectsWithUnits = await Promise.all(filteredProjects.map(async (project) => {
        const projectName = project.name.toLowerCase().trim();
        const normalizedProject = normalizeName(projectName);
        
        // Extract significant words (same as ProjectUnits.tsx)
        const stopWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'let', 'put', 'say', 'she', 'too', 'use'];
        const projectWordsForMatching = normalizedProject.split(/[\s-]+/)
          .filter(w => w.length >= 3)
          .filter(w => !stopWords.includes(w.toLowerCase()));
        const firstProjectWordForMatching = projectWordsForMatching.length > 0 ? projectWordsForMatching[0] : normalizedProject.split(/[\s-]+/).find(w => w.length >= 2);
        
        // Get project developer (same as ProjectUnits.tsx)
        // Extract developer name from region (which might be a JSON object or string)
        let developerName: string | null = null;
        if (project.region) {
          const extracted = extractName(project.region);
          if (extracted && extracted !== 'Unknown' && extracted !== '-') {
            developerName = extracted.toLowerCase().trim();
          }
        }
        
        // Filter units using EXACT same logic as ProjectUnits.tsx
        const isClubParkAliva = project.name.toLowerCase().includes('club park') && project.name.toLowerCase().includes('aliva');
        const matchedUnits = allUnitsData.filter((unit: Record<string, unknown>) => {
          const compoundName = extractName(unit.compound).toLowerCase().trim();
          if (!compoundName || compoundName === '-' || compoundName === 'unknown') return false;

          const normalizedCompound = normalizeName(compoundName);
          
          // Debug for Club Park - Aliva
          if (isClubParkAliva && (compoundName.includes('club') || compoundName.includes('park') || compoundName.includes('aliva'))) {
            console.log(`   Checking unit: compound="${compoundName}", normalized="${normalizedCompound}" vs project="${normalizedProject}"`);
          }
          
          // First check if compound matches (EXACT same logic as ProjectUnits.tsx)
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
          // 4. Fallback: If first significant word matches, count it
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
          // EXACT same logic as ProjectUnits.tsx
          if (developerName) {
            const unitDeveloper = extractName(unit.developer).toLowerCase().trim();
            const normalizedProjectDeveloper = developerName; // Already lowercased and trimmed
            
            // Skip if developer extraction failed (returned '-' or empty)
            if (!unitDeveloper || unitDeveloper === '-' || unitDeveloper === 'unknown') {
              // If compound matches exactly or strongly, include it even without developer match
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
                if (isExactMatch || isStrongMatch) {
                  return true; // Exact/strong compound match - include even if developer doesn't match
                }
                return false; // Skip units from different developers for lenient matches
              }
            }
          } else {
            // No developer specified - only allow exact or strong matches
            if (!isExactMatch && !isStrongMatch) {
              return false; // Skip lenient word matches when developer is unknown
            }
          }
          
          return true;
        });
        
        const unitCount = matchedUnits.length;
        
        // Debug logging
        if (project.name.toLowerCase().includes('bamboo') || project.name.toLowerCase().includes('club park')) {
          console.log(`✅ Project "${project.name}": ${unitCount} units (using direct filtering - same as ProjectUnits.tsx)`);
          console.log(`   Project name (normalized): "${normalizedProject}"`);
          console.log(`   Project developer: "${developerName || 'none'}"`);
          console.log(`   Project words for matching:`, projectWordsForMatching);
          console.log(`   First project word: "${firstProjectWordForMatching}"`);
          if (matchedUnits.length > 0) {
            const sampleCompound = extractName(matchedUnits[0].compound);
            const sampleDeveloper = extractName(matchedUnits[0].developer);
            const sampleNormalized = normalizeName(extractName(matchedUnits[0].compound).toLowerCase().trim());
            console.log(`   Sample unit - Compound: "${sampleCompound}" (normalized: "${sampleNormalized}"), Developer: "${sampleDeveloper}"`);
          } else {
            // Check what compounds we have that might match
            const clubParkUnits = allUnitsData.filter((unit: Record<string, unknown>) => {
              const compound = extractName(unit.compound).toLowerCase();
              return compound.includes('club') || compound.includes('park') || compound.includes('aliva');
            });
            if (clubParkUnits.length > 0) {
              console.log(`   ⚠️ Found ${clubParkUnits.length} units with "club", "park", or "aliva" in compound`);
              const sampleCompound = extractName(clubParkUnits[0].compound);
              const sampleNormalized = normalizeName(sampleCompound.toLowerCase().trim());
              console.log(`   Sample: "${sampleCompound}" (normalized: "${sampleNormalized}") vs project "${normalizedProject}"`);
            }
          }
        }

        return {
          id: project.id,
          name: project.name,
          region: project.region,
          cover_image: project.cover_image || undefined,
          available_units: unitCount,
        };
      }));

      // Sort projects alphabetically by name
      const sortedProjects = projectsWithUnits.sort((a, b) => 
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true })
      );

      setProjects(sortedProjects);
    } catch (err) {
      console.error('Failed to load projects:', err);
      setError(err instanceof Error ? err.message : 'Failed to load projects');
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
            onClick={() => navigate('/app/inventory')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Inventory
          </Button>
          <PageTitle title="All Projects" icon={Building} color="teal" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="shop-project-card overflow-hidden bg-white rounded-lg border-0 animate-pulse">
              <div className="h-52 w-full bg-gray-200" />
              <CardContent className="px-3 pt-2 pb-1.5 space-y-1.5">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-16 bg-gray-200 rounded" />
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
          <PageTitle title="All Projects" icon={Building} color="teal" />
        </div>
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
          <Button
            onClick={loadAllProjects}
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
        <PageTitle title="All Projects" icon={Building} color="teal" />
        <p className="text-gray-600 mt-2">
          Browse all projects from all developers ({projects.length} projects)
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No projects available</p>
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

          {/* Projects Grid */}
          <div className="lg:pr-16">
            {availableLetters.map((letter) => (
              <div key={letter} ref={(el) => { letterRefs.current[letter] = el; }} className="mb-8 scroll-mt-4">
                {/* Letter Header */}
                <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm py-3 mb-4 border-b-2 border-blue-200">
                  <h2 className="text-2xl font-bold text-blue-700">{letter}</h2>
                  <p className="text-sm text-gray-500">{groupedProjects[letter].length} project{groupedProjects[letter].length !== 1 ? 's' : ''}</p>
                </div>
                
                {/* Projects for this letter */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {groupedProjects[letter].map((project) => (
                    <Card
                      key={project.id}
                      className="shop-project-card overflow-hidden group hover:shadow-lg transition-all duration-200 bg-white rounded-lg border-0 cursor-pointer"
                      style={{ padding: 0 }}
                      onClick={() => navigate(`/app/inventory/projects/${encodeURIComponent(project.name)}`)}
                    >
                      {/* Hero Photo Section */}
                      <div className="relative h-52 w-full overflow-hidden">
                        <SafeImage
                          src={project.cover_image || getHeroImage(project.name)}
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
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AllProjects;

