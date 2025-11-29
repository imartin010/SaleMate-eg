import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, MapPin, TrendingUp, Users, ShoppingCart } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ShopWindowSkeleton } from './LoadingSkeletons';
import { useFeatureFlags } from '../../core/config/features';
import { ComingSoonCard } from './ComingSoonSection';

interface Project {
  id: string;
  name: string;
  developer: string;
  region: string;
  available_leads: number;
  price_per_lead: number;
}

/**
 * Shop Window Section
 * Top 3 projects with available leads
 */
const ShopWindowSection: React.FC = React.memo(() => {
  const navigate = useNavigate();
  const { leadsShopEnabled } = useFeatureFlags();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (leadsShopEnabled) {
      loadTopProjects();
    } else {
      setLoading(false);
    }
  }, [leadsShopEnabled]);

  const loadTopProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      // Query projects - try with join first, fallback to simple query if it fails
      let query = supabase
        .from('projects')
        .select('id, name, region, available_leads, price_per_lead')
        .gt('available_leads', 0)
        .order('available_leads', { ascending: false })
        .limit(3);

      const { data, error: queryError } = await query;

      if (queryError) {
        throw new Error(queryError.message);
      }

      // Transform data to match our interface
      // Note: Use region as developer display since developer column may not exist
      const transformedProjects: Project[] = (data || []).map((p: any) => ({
        id: p.id,
        name: p.name || 'Unknown Project',
        developer: p.region || 'Unknown Developer', // Use region as developer display
        region: p.region || 'Unknown Region',
        available_leads: Number(p.available_leads || 0),
        price_per_lead: Number(p.price_per_lead || 0),
      }));

      // Filter out default project
      const filteredProjects = transformedProjects.filter((project) => {
        const projectName = project.name?.toLowerCase().trim() || '';
        return projectName !== 'default project' && 
               projectName !== 'default' &&
               projectName.length > 0;
      });

      setProjects(filteredProjects);
    } catch (err: unknown) {
      console.error('Error loading top projects:', err);
      setError((err instanceof Error ? err.message : String(err)) || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  // Show Coming Soon if shop is disabled
  if (!leadsShopEnabled) {
    return (
      <div className="space-y-4 md:space-y-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Shop</h2>
        <ComingSoonCard
          title="Lead Marketplace"
          description="Browse and purchase verified real estate leads from top projects. Coming soon!"
          launchDate="Month 2"
          icon={<ShoppingCart className="h-6 w-6 text-gray-600" />}
        />
      </div>
    );
  }

  if (loading) {
    return <ShopWindowSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Shop</h2>
          <button
            onClick={() => navigate('/app/shop')}
            className="flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors"
          >
            View All <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="text-center py-8 text-red-500">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Shop</h2>
          <button
            onClick={() => navigate('/app/shop')}
            className="flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors"
          >
            View All <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="text-center py-8 text-gray-500">
          <p>No projects with available leads at the moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Shop</h2>
        <button
          onClick={() => navigate('/app/shop')}
          className="flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors text-sm md:text-base"
        >
          View All <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {projects.map((project) => (
          <div
            key={project.id}
            onClick={() => navigate(`/app/shop?project=${project.id}`)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate(`/app/shop?project=${project.id}`);
              }
            }}
            tabIndex={0}
            role="button"
            aria-label={`View ${project.name} project with ${project.available_leads} available leads`}
            className="rounded-xl md:rounded-2xl bg-white shadow-sm md:shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-5 md:p-6 border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all duration-300 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {/* Project Name */}
            <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
              {project.name}
            </h3>

            {/* Developer & Region */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4 text-blue-500" />
                <span>{project.region}</span>
              </div>
              <p className="text-sm text-gray-500">{project.developer}</p>
            </div>

            {/* Available Leads & Price */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-semibold text-gray-900">
                  {project.available_leads.toLocaleString()} leads
                </span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-bold text-blue-600">
                  {project.price_per_lead?.toLocaleString() || 'N/A'} EGP
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

ShopWindowSection.displayName = 'ShopWindowSection';

export default ShopWindowSection;

