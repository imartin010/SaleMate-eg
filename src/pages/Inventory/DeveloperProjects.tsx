import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

const DeveloperProjects: React.FC = () => {
  const navigate = useNavigate();
  const { developerName } = useParams<{ developerName: string }>();
  const decodedDeveloperName = developerName ? decodeURIComponent(developerName) : '';
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    if (decodedDeveloperName) {
      loadDeveloperProjects();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decodedDeveloperName]);

  const loadDeveloperProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!decodedDeveloperName) {
        throw new Error('Developer name is required');
      }

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

      // Filter projects by developer (region matches developer name)
      const developerNameLower = decodedDeveloperName.toLowerCase().trim();
      const filteredProjects = (projectsData || []).filter((project) => {
        const projectName = project.name?.toLowerCase().trim() || '';
        const projectRegion = project.region?.toLowerCase().trim() || '';
        
        // Filter out default projects
        if (projectName === 'default project' || projectName === 'default' || projectName.length === 0) {
          return false;
        }
        
        // Match by region (developer name)
        return projectRegion === developerNameLower ||
               projectRegion.includes(developerNameLower) ||
               developerNameLower.includes(projectRegion);
      });

      // Count units by compound name only - match project name to compound name
      // Load ALL units using pagination to ensure accurate counts
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let allUnitsData: Record<string, unknown>[] = [];
      let hasMore = true;
      let page = 0;
      const pageSize = 10000;
      
      while (hasMore) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: pageData, error: unitsError } = await (supabase as any)
          .from('salemate-inventory')
          .select('compound')
          .range(page * pageSize, (page + 1) * pageSize - 1);
        
        if (unitsError) {
          console.error('Error loading units:', unitsError);
          break;
        }
        
        if (pageData && pageData.length > 0) {
          allUnitsData = allUnitsData.concat(pageData);
          hasMore = pageData.length === pageSize;
          page++;
        } else {
          hasMore = false;
        }
      }
      
      console.log(`📊 Loaded ${allUnitsData.length} total units for counting`);

      // Group and count units by compound name
      const compoundCountMap: Record<string, number> = {};
      if (allUnitsData && allUnitsData.length > 0) {
        allUnitsData.forEach((unit: Record<string, unknown>) => {
          try {
            const compound = extractName(unit.compound).toLowerCase().trim();
            if (compound) {
              compoundCountMap[compound] = (compoundCountMap[compound] || 0) + 1;
            }
          } catch (e) {
            // Skip invalid units
            console.warn('Skipping invalid unit:', e);
          }
        });
      }

      // Match projects to unit counts by compound name only
      const projectsWithUnits = filteredProjects.map((project) => {
        let unitCount = 0;
        const projectName = project.name.toLowerCase().trim();

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
        const normalizedProject = normalizeName(projectName);

        // Match project name to compound names - VERY LENIENT matching
        // Extract all significant words from project name (3+ characters, not stop words)
        const stopWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'let', 'put', 'say', 'she', 'too', 'use'];
        const projectWords = normalizedProject.split(/[\s-]+/)
          .filter(w => w.length >= 3)
          .filter(w => !stopWords.includes(w.toLowerCase()));
        
        // Get first significant word for fallback matching
        const firstProjectWord = projectWords.length > 0 ? projectWords[0] : normalizedProject.split(/[\s-]+/).find(w => w.length >= 2);
        
        const matchedCompounds: string[] = [];
        Object.keys(compoundCountMap).forEach((compoundName) => {
          const normalizedCompound = normalizeName(compoundName);
          
          let matches = false;
          
          // 1. Exact match (after normalization)
          if (normalizedCompound === normalizedProject) {
            matches = true;
          }
          // 2. Contains match (either direction)
          else if (normalizedCompound.includes(normalizedProject) || normalizedProject.includes(normalizedCompound)) {
            matches = true;
          }
          // 3. VERY LENIENT: If ANY significant word from project appears in compound, match it
          else if (projectWords.length > 0) {
            matches = projectWords.some(word => normalizedCompound.includes(word));
          }
          // 4. Fallback: If first significant word matches, count it (handles "Bamboo" matching "Bamboo III")
          else if (firstProjectWord && normalizedCompound.includes(firstProjectWord)) {
            matches = true;
          }
          // 5. Reverse check: Check if any word from compound appears in project
          else if (normalizedCompound.length >= 3) {
            const compoundWords = normalizedCompound.split(/[\s-]+/)
              .filter(w => w.length >= 3)
              .filter(w => !stopWords.includes(w.toLowerCase()));
            matches = compoundWords.some(word => normalizedProject.includes(word));
          }
          
          if (matches) {
            unitCount += compoundCountMap[compoundName];
            matchedCompounds.push(compoundName);
          }
        });

        // Debug logging
        if (unitCount === 0) {
          console.warn(`⚠️ Project "${project.name}": 0 units - No matching compounds found`);
          console.warn(`   Project name (normalized): "${normalizedProject}"`);
          console.warn(`   Sample compounds:`, Object.keys(compoundCountMap).slice(0, 10));
        } else {
          console.log(`✅ Project "${project.name}": ${unitCount} units`);
          console.log(`   Matched compounds:`, matchedCompounds);
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
      console.error('Failed to load developer projects:', err);
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
            onClick={() => navigate('/app/inventory/developers')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Developers
          </Button>
          <PageTitle title={`Projects by ${decodedDeveloperName}`} icon={Building} color="blue" />
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
            onClick={() => navigate('/app/inventory/developers')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Developers
          </Button>
          <PageTitle title={`Projects by ${decodedDeveloperName}`} icon={Building} color="blue" />
        </div>
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
          <Button
            onClick={loadDeveloperProjects}
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
          onClick={() => navigate('/app/inventory/developers')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Developers
        </Button>
        <PageTitle title={`Projects by ${decodedDeveloperName}`} icon={Building} color="blue" />
        <p className="text-gray-600 mt-2">
          Browse all projects from {decodedDeveloperName} ({projects.length} project{projects.length !== 1 ? 's' : ''})
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No projects available for this developer</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {projects.map((project) => (
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
                    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-purple-100 flex items-center justify-center">
                      <Building2 className="h-16 w-16 text-blue-300" />
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
      )}
    </div>
  );
};

export default DeveloperProjects;

