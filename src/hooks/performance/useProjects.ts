/**
 * Hook to fetch projects from salemate-inventory table
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';

interface Project {
  id: number;
  compound: string;
  developer: string;
  area: string;
}

export function useProjects() {
  return useQuery({
    queryKey: ['projects-for-performance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('salemate-inventory')
        .select('id, compound, developer, area')
        .not('compound', 'is', null)
        .order('compound');
      
      if (error) throw error;
      
      // Parse JSON fields and deduplicate by compound
      const projectsMap = new Map<string, Project>();
      
      data?.forEach((item: any) => {
        try {
          const compound = typeof item.compound === 'string' 
            ? JSON.parse(item.compound).name 
            : item.compound?.name || 'Unknown';
          
          const developer = typeof item.developer === 'string'
            ? JSON.parse(item.developer).name
            : item.developer?.name || 'Unknown';
            
          const area = typeof item.area === 'string'
            ? JSON.parse(item.area).name
            : item.area?.name || 'Unknown';
          
          const key = `${compound}-${developer}`;
          
          if (!projectsMap.has(key)) {
            projectsMap.set(key, {
              id: item.id,
              compound,
              developer,
              area,
            });
          }
        } catch (e) {
          console.error('Error parsing project data:', e);
        }
      });
      
      return Array.from(projectsMap.values()).sort((a, b) => 
        a.compound.localeCompare(b.compound)
      );
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

