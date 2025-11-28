import { create } from 'zustand';
import { Project } from '../types';
import { supabase } from "../lib/supabaseClient"

interface ProjectState {
  projects: Project[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  
  fetchProjects: (forceRefresh?: boolean) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
}

// Cache duration: 10 minutes (projects change less frequently)
const CACHE_DURATION = 10 * 60 * 1000;

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  loading: false,
  error: null,
  lastFetched: null,
  
  fetchProjects: async (forceRefresh: boolean = false) => {
    const state = get();
    const now = Date.now();
    
    // Check if we have recent data and don't need to refresh
    if (!forceRefresh && 
        state.lastFetched && 
        (now - state.lastFetched) < CACHE_DURATION && 
        state.projects.length > 0) {
      console.log('🏗️ Using cached projects data');
      return;
    }
    
    set({ loading: true, error: null });
    try {
      console.log('🏗️ Fetching projects from Supabase...');
      
      const { data: projectsData, error } = await supabase
        .from('projects')
        .select('id, name, developer, region, available_leads, price_per_lead, description, created_at')
        .order('name')
        .limit(500); // Increased limit for better UX

      if (error) {
        throw new Error(`Failed to fetch projects: ${error.message}`);
      }

              // Transform Supabase data to match Project type
        const transformedProjects: Project[] = projectsData?.map(project => ({
          id: project.id,
          name: project.name,
          developer: project.developer,
          region: project.region,
          availableLeads: project.available_leads || 0,
          pricePerLead: project.price_per_lead,
          description: project.description || undefined,
          createdAt: project.created_at || undefined
        })) || [];

      // Filter out default project
      const filteredProjects = transformedProjects.filter((project) => {
        const projectName = project.name?.toLowerCase().trim() || '';
        return projectName !== 'default project' && 
               projectName !== 'default' &&
               projectName.length > 0;
      });

      console.log(`✅ Fetched ${filteredProjects.length} projects from Supabase (filtered)`);
      set({ 
        projects: filteredProjects, 
        loading: false, 
        lastFetched: now 
      });
      
    } catch (error) {
      console.error('Error fetching projects:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to fetch projects', loading: false });
    }
  },
  
  updateProject: async (id: string, updates: Partial<Project>) => {
    try {
      set({ error: null });
      
      // Transform frontend data to Supabase format
      const supabaseUpdates: Record<string, unknown> = {};
      if (updates.name !== undefined) supabaseUpdates.name = updates.name;
      if (updates.developer !== undefined) supabaseUpdates.developer = updates.developer;
      if (updates.region !== undefined) supabaseUpdates.region = updates.region;
      if (updates.availableLeads !== undefined) supabaseUpdates.available_leads = updates.availableLeads;
      if (updates.pricePerLead !== undefined) supabaseUpdates.price_per_lead = updates.pricePerLead;
      if (updates.description !== undefined) supabaseUpdates.description = updates.description;

      const { error } = await supabase
        .from('projects')
        .update(supabaseUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update project: ${error.message}`);
      }

      // Update local state
      const projects = get().projects.map(p => 
        p.id === id ? {
          ...p,
          ...updates
        } : p
      );
      set({ projects });
      
    } catch (error) {
      console.error('Error updating project:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to update project' });
    }
  },
  
  addProject: async (projectData: Omit<Project, 'id' | 'createdAt'>) => {
    try {
      set({ error: null });
      
      // Transform frontend data to Supabase format
      const supabaseProject = {
        name: projectData.name,
        developer: projectData.developer,
        region: projectData.region,
        available_leads: projectData.availableLeads,
        price_per_lead: projectData.pricePerLead || 100, // Default CPL
        description: projectData.description || null,
      };

      const { data: newProject, error } = await supabase
        .from('projects')
        .insert(supabaseProject)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to add project: ${error.message}`);
      }

      // Transform back to frontend format and add to local state
      const transformedProject: Project = {
        id: newProject.id,
        name: newProject.name,
        developer: newProject.developer,
        region: newProject.region,
        availableLeads: newProject.available_leads || 0,
        pricePerLead: newProject.price_per_lead,
        description: newProject.description || '',
        createdAt: newProject.created_at || undefined
      };

      const projects = [...get().projects, transformedProject];
      set({ projects });
      
    } catch (error) {
      console.error('Error adding project:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to add project' });
    }
  },
  
  deleteProject: async (id: string) => {
    try {
      set({ error: null });
      
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete project: ${error.message}`);
      }

      // Remove from local state
      const projects = get().projects.filter(p => p.id !== id);
      set({ projects });
      
    } catch (error) {
      console.error('Error deleting project:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to delete project' });
    }
  },
}));
