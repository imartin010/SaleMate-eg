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

      // Load all units and group by compound/developer
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: allUnitsData, error: unitsError } = await (supabase as any)
        .from('salemate-inventory')
        .select('compound, developer');

      // Create lookup maps for efficient matching
      const compoundDeveloperMap: Record<string, number> = {}; // compound|||developer -> count
      const developerMap: Record<string, number> = {}; // developer -> total count

      if (!unitsError && allUnitsData) {
        allUnitsData.forEach((unit: Record<string, unknown>) => {
          try {
            const compound = extractName(unit.compound).toLowerCase().trim();
            const developer = extractName(unit.developer).toLowerCase().trim();
            
            if (compound && developer) {
              const key = `${compound}|||${developer}`;
              compoundDeveloperMap[key] = (compoundDeveloperMap[key] || 0) + 1;
              developerMap[developer] = (developerMap[developer] || 0) + 1;
            }
          } catch (e) {
            // Skip invalid units
            console.warn('Skipping invalid unit:', e);
          }
        });
      }

      console.log(`📊 Loaded ${Object.keys(compoundDeveloperMap).length} unique compound/developer combinations`);
      console.log(`📊 Total units: ${allUnitsData?.length || 0}`);
      console.log(`📊 Sample compounds:`, Object.keys(compoundDeveloperMap).slice(0, 5));
      console.log(`📊 Sample developers:`, Object.keys(developerMap).slice(0, 5));

      // Match projects to unit counts with improved logic
      const projectsWithUnits = filteredProjects.map((project) => {
        let unitCount = 0;
        const projectName = project.name.toLowerCase().trim();
        const projectRegion = project.region?.toLowerCase().trim() || '';

        if (!projectRegion) {
          console.warn(`Project "${project.name}" has no region`);
          return {
            id: project.id,
            name: project.name,
            region: project.region,
            cover_image: project.cover_image,
            available_units: 0,
          };
        }

        // Strategy: Match by developer AND name (flexible matching)
        const nameMatches: string[] = [];
        Object.keys(compoundDeveloperMap).forEach((key) => {
          const [compoundName, developerName] = key.split('|||');
          
          // First check if developer matches
          const developerMatches = developerName === projectRegion ||
                                  developerName.includes(projectRegion) ||
                                  projectRegion.includes(developerName);
          
          if (!developerMatches) return;
          
          // Check if project name matches compound (multiple strategies)
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
            nameMatches.push(key);
            unitCount += compoundDeveloperMap[key];
          }
        });

        // Fallback: If no name matches but developer matches, 
        // count units from that developer as a fallback
        if (unitCount === 0 && projectRegion) {
          // Use developer match as fallback - show all units from that developer
          Object.keys(developerMap).forEach((devName) => {
            if (devName === projectRegion || 
                devName.includes(projectRegion) || 
                projectRegion.includes(devName)) {
              unitCount += developerMap[devName];
            }
          });
        }

        if (unitCount === 0) {
          console.warn(`⚠️ Project "${project.name}" (${projectRegion}): 0 units - checking developer matches...`);
          const matchingDevs = Object.keys(developerMap).filter(devName => 
            devName === projectRegion || 
            devName.includes(projectRegion) || 
            projectRegion.includes(devName)
          );
          console.warn(`   Found ${matchingDevs.length} matching developers:`, matchingDevs);
        } else {
          console.log(`✅ Project "${project.name}" (${projectRegion}): ${unitCount} units (${nameMatches.length} name matches)`);
        }

        return {
          id: project.id,
          name: project.name,
          region: project.region,
          cover_image: project.cover_image,
          available_units: unitCount,
        };
      });

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
                      className="shop-project-card overflow-hidden group hover:shadow-lg transition-all duration-200 bg-white rounded-lg border-0"
                      style={{ padding: 0 }}
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

