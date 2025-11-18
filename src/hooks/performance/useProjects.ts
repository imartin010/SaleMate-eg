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
      // Fetch ALL records using pagination (Supabase has 1000 row default limit)
      let allData: any[] = [];
      let from = 0;
      const pageSize = 1000;
      let hasMore = true;
      
      console.log('🔄 Starting to fetch all inventory records...');
      
      while (hasMore) {
        const { data, error } = await supabase
          .from('salemate-inventory')
          .select('id, compound, developer, area')
          .not('compound', 'is', null)
          .order('compound')
          .range(from, from + pageSize - 1);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          allData = [...allData, ...data];
          from += pageSize;
          console.log(`  ↳ Fetched ${allData.length} records so far...`);
          
          // If we got less than pageSize, we've reached the end
          if (data.length < pageSize) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }
      
      console.log(`📊 Total fetched: ${allData.length} records from salemate-inventory`);
      
      // Parse JSON fields and deduplicate by compound
      const projectsMap = new Map<string, Project>();
      
      allData.forEach((item: any) => {
        try {
          // Helper function to parse Python-style dict strings
          const parsePythonDict = (str: string): any => {
            if (!str || str === 'null') return null;
            
            try {
              // Simple approach: replace single quotes with double quotes
              const jsonStr = str.replace(/'/g, '"');
              return JSON.parse(jsonStr);
            } catch {
              // If that fails, the record is malformed - return null
              return null;
            }
          };
          
          const compoundObj = typeof item.compound === 'string' 
            ? parsePythonDict(item.compound)
            : item.compound;
          
          const developerObj = typeof item.developer === 'string'
            ? parsePythonDict(item.developer)
            : item.developer;
            
          const areaObj = typeof item.area === 'string'
            ? parsePythonDict(item.area)
            : item.area;
          
          // Skip if we couldn't parse the data
          if (!compoundObj || !developerObj) {
            return;
          }
          
          // Use IDs for deduplication (more reliable than names)
          const compoundId = compoundObj.id || 0;
          const developerId = developerObj.id || 0;
          const key = `${compoundId}-${developerId}`;
          
          if (!projectsMap.has(key)) {
            projectsMap.set(key, {
              id: item.id,
              compound: compoundObj.name || 'Unknown',
              developer: developerObj.name || 'Unknown',
              area: areaObj?.name || 'Unknown',
            });
          }
        } catch (e) {
          // Silently skip malformed records (they're rare and we have the count right)
          // Only log in dev mode
          if (import.meta.env.DEV) {
            console.warn('Skipped record with parsing error:', item.id);
          }
        }
      });
      
      const uniqueProjects = Array.from(projectsMap.values()).sort((a, b) => 
        a.compound.localeCompare(b.compound)
      );
      
      console.log(`✅ ${uniqueProjects.length} unique projects after deduplication`);
      
      return uniqueProjects;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

