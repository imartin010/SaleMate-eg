import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/auth';

export interface FeedbackHistoryEntry {
  id: string;
  lead_id: string;
  user_id: string;
  feedback_text: string;
  created_at: string;
  updated_at?: string | null;
  user?: {
    name: string;
    email: string;
  } | null;
}

export interface Lead {
  id: string;
  client_name: string;
  client_phone: string;
  client_email?: string | null;
  client_phone2?: string | null;
  client_phone3?: string | null;
  client_job_title?: string | null;
  company_name?: string | null;
  budget?: number | null;
  project_id: string;
  source: string;
  stage: LeadStage;
  feedback?: string | null;
  created_at: string;
  updated_at?: string;
  sold_at?: string | null;
  assigned_at?: string | null;
  buyer_user_id?: string | null;
  assigned_to_id?: string | null;
  owner_id?: string | null;
  upload_user_id?: string | null;
  project?: {
    id: string;
    name: string;
    region: string;
  } | null;
  owner?: {
    id: string;
    name: string;
  } | null;
  assigned_to?: {
    id: string;
    name: string;
  } | null;
  feedback_history?: FeedbackHistoryEntry[];
}

export type LeadStage =
  | 'New Lead'
  | 'Potential'
  | 'Hot Case'
  | 'Meeting Done'
  | 'No Answer'
  | 'Call Back'
  | 'Whatsapp'
  | 'Non Potential'
  | 'Wrong Number'
  | 'Closed Deal'
  | 'Switched Off'
  | 'Low Budget';

export interface CreateLeadInput {
  client_name: string;
  client_phone: string;
  client_email?: string;
  project_id: string;
  source: string;
  stage?: LeadStage;
  feedback?: string;
}

export interface UpdateLeadInput {
  client_name?: string;
  client_phone?: string;
  client_email?: string;
  client_phone2?: string;
  client_phone3?: string;
  client_job_title?: string;
  company_name?: string;
  budget?: number;
  project_id?: string;
  source?: string;
  stage?: LeadStage;
  feedback?: string;
}

export function useLeads() {
  const { user } = useAuthStore();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const updatingLeadsRef = useRef<Set<string>>(new Set()); // Track leads we're currently updating

  const fetchLeads = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Try to fetch leads with project join (only FK that exists)
      // Note: owner_id and assigned_to_id don't have foreign keys, so we can't join profiles
      // Order by created_at first to show most recently added leads first
      let query = supabase
        .from('leads')
        .select(`
          *,
          projects (
            id,
            name,
            region
          )
        `)
        .or(`buyer_user_id.eq.${user.id},assigned_to_id.eq.${user.id},owner_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false }); // Secondary sort for stability

      const { data, error: fetchError } = await query;

      if (fetchError) {
        // If the query fails, try a simpler query without joins
        console.warn('Failed to fetch leads with project join, trying simpler query:', fetchError);
        const { data: simpleData, error: simpleError } = await supabase
          .from('leads')
          .select('*')
          .or(`buyer_user_id.eq.${user.id},assigned_to_id.eq.${user.id},owner_id.eq.${user.id}`)
          .order('created_at', { ascending: false })
          .order('id', { ascending: false }); // Secondary sort for stability

        if (simpleError) throw simpleError;
        
        // Fetch projects separately if join failed
        const projectIds = [...new Set((simpleData || []).map((l: any) => l.project_id).filter(Boolean))];
        let projectsMap: Record<string, { id: string; name: string; region: string }> = {};
        
        if (projectIds.length > 0) {
          const { data: projectsData, error: projectsError } = await supabase
            .from('projects')
            .select('id, name, region')
            .in('id', projectIds);
          
          if (!projectsError && projectsData) {
            projectsMap = projectsData.reduce((acc, p: any) => {
              acc[p.id] = {
                id: p.id,
                name: typeof p.name === 'object' && p.name !== null
                  ? (p.name.name || JSON.stringify(p.name))
                  : (p.name || ''),
                region: typeof p.region === 'object' && p.region !== null
                  ? (p.region.name || JSON.stringify(p.region))
                  : (p.region || ''),
              };
              return acc;
            }, {} as Record<string, { id: string; name: string; region: string }>);
          }
        }
        
        // Transform simple data with manually joined projects
        const transformedData = (simpleData || []).map((lead: any) => ({
          ...lead,
          project: lead.project_id ? (projectsMap[lead.project_id] || null) : null,
          owner: null,
          assigned_to: null,
          feedback_history: [],
        }));

        // Sort leads to show most recently added leads first
        // Priority: created_at (descending), then id (descending) for stability
        const sortedLeads = [...transformedData].sort((a: any, b: any) => {
          const aCreatedAt = new Date(a.created_at).getTime();
          const bCreatedAt = new Date(b.created_at).getTime();
          if (aCreatedAt !== bCreatedAt) {
            return bCreatedAt - aCreatedAt; // Descending - newest first
          }
          // If created_at is the same, sort by id (descending) for stable ordering
          // Compare UUIDs as strings for consistent ordering
          if (a.id < b.id) return 1;
          if (a.id > b.id) return -1;
          return 0;
        });

        setLeads(sortedLeads as Lead[]);
        setLoading(false);
        return;
      }

      // Transform the data to extract nested names
      const transformedData = (data || []).map((lead: any) => {
        // Handle project - Supabase returns it as 'projects' (could be array or object)
        // For one-to-one relationships, it's usually an object, but can be an array
        const originalProject = lead.projects;
        
        // Debug logging for first lead to understand the structure
        if (lead.id && !originalProject && lead.project_id) {
          console.warn(`Lead ${lead.id} has project_id ${lead.project_id} but no project data in join`);
        }
        
        // If it's an array, take the first element (shouldn't happen for one-to-one, but handle it)
        const projectData = Array.isArray(originalProject) 
          ? (originalProject.length > 0 ? originalProject[0] : null)
          : originalProject;
        
        const transformedProject = projectData ? {
          id: projectData.id,
          name: typeof projectData.name === 'object' && projectData.name !== null
            ? (projectData.name.name || JSON.stringify(projectData.name))
            : (projectData.name || ''),
          region: typeof projectData.region === 'object' && projectData.region !== null
            ? (projectData.region.name || JSON.stringify(projectData.region))
            : (projectData.region || ''),
        } : null;

        // Parse feedback_history from JSONB column if it exists
        let parsedHistory: FeedbackHistoryEntry[] = [];
        if (lead.feedback_history && Array.isArray(lead.feedback_history)) {
          parsedHistory = lead.feedback_history.map((entry: any) => ({
            id: entry.id || `temp-${Date.now()}-${Math.random()}`,
            lead_id: lead.id,
            user_id: entry.user_id || '',
            feedback_text: entry.feedback_text || entry.feedback || '',
            created_at: entry.created_at || new Date().toISOString(),
            updated_at: entry.updated_at || null,
            user: null, // Will be populated later
          }));
        }

        return {
          ...lead,
          project: transformedProject,
          owner: null, // Will be fetched separately if needed
          assigned_to: null, // Will be fetched separately if needed
          feedback_history: parsedHistory,
        };
      });

      const leadIds = transformedData.map((lead) => lead.id).filter(Boolean);

      // Collect all user IDs from feedback_history in leads table
      const userIdsFromLeads = new Set<string>();
      transformedData.forEach((lead: any) => {
        if (lead.feedback_history && Array.isArray(lead.feedback_history)) {
          lead.feedback_history.forEach((entry: FeedbackHistoryEntry) => {
            if (entry.user_id) userIdsFromLeads.add(entry.user_id);
          });
        }
      });

      let feedbackHistoryMap: Record<string, FeedbackHistoryEntry[]> = {};
      
      // Initialize map with history from leads table
      transformedData.forEach((lead: any) => {
        if (lead.feedback_history && Array.isArray(lead.feedback_history) && lead.feedback_history.length > 0) {
          feedbackHistoryMap[lead.id] = [...lead.feedback_history];
        }
      });

      // Only fetch feedback history if we have a reasonable number of leads
      // Large arrays in .in() filters can cause 400 errors
      if (leadIds.length > 0 && leadIds.length <= 100) {
        try {
          // Batch the query if there are many leads (Supabase has limits on .in() array size)
          const batchSize = 50;
          const batches: string[][] = [];
          
          for (let i = 0; i < leadIds.length; i += batchSize) {
            batches.push(leadIds.slice(i, i + batchSize));
          }

          // Fetch feedback in batches from both events and feedback_history tables
          const allFeedbackData: any[] = [];
          const profileIdsSet = new Set<string>();

          for (const batch of batches) {
            // Fetch from events table
            const { data: batchFeedbackData, error: batchError } = await supabase
              .from('events')
              .select('id, lead_id, actor_profile_id, body, payload, created_at, updated_at')
              .in('lead_id', batch)
              .eq('event_type', 'activity')
              .eq('activity_type', 'feedback')
              .order('created_at', { ascending: false });

            if (!batchError && batchFeedbackData) {
              allFeedbackData.push(...batchFeedbackData);
              batchFeedbackData.forEach((f: any) => {
                if (f.actor_profile_id) profileIdsSet.add(f.actor_profile_id);
              });
            }

            // Also fetch from feedback_history table
            const { data: batchHistoryData, error: historyError } = await supabase
              .from('feedback_history')
              .select('id, lead_id, user_id, feedback_text, created_at, updated_at')
              .in('lead_id', batch)
              .order('created_at', { ascending: false });

            if (!historyError && batchHistoryData) {
              // Transform feedback_history to match the events format
              const transformedHistory = batchHistoryData.map((f: any) => ({
                id: f.id,
                lead_id: f.lead_id,
                actor_profile_id: f.user_id,
                body: f.feedback_text,
                payload: null,
                created_at: f.created_at,
                updated_at: f.updated_at,
              }));
              allFeedbackData.push(...transformedHistory);
              batchHistoryData.forEach((f: any) => {
                if (f.user_id) profileIdsSet.add(f.user_id);
              });
            }
          }

          // Add user IDs from leads table feedback_history
          Array.from(userIdsFromLeads).forEach(id => profileIdsSet.add(id));

          // Fetch profiles separately
          let profilesMap: Record<string, { id: string; name: string; email: string }> = {};
          
          if (profileIdsSet.size > 0) {
            const profileIds = Array.from(profileIdsSet);
            // Batch profile fetches too if needed
            const profileBatchSize = 100;
            for (let i = 0; i < profileIds.length; i += profileBatchSize) {
              const profileBatch = profileIds.slice(i, i + profileBatchSize);
              const { data: profilesData } = await supabase
                .from('profiles')
                .select('id, name, email')
                .in('id', profileBatch);
              
              if (profilesData) {
                profilesData.forEach((p: any) => {
                  profilesMap[p.id] = { id: p.id, name: p.name || 'Unknown User', email: p.email || '' };
                });
              }
            }
          }
          
          // Update feedback history from leads table with user info
          Object.keys(feedbackHistoryMap).forEach(leadId => {
            feedbackHistoryMap[leadId] = feedbackHistoryMap[leadId].map(entry => ({
              ...entry,
              user: entry.user_id && profilesMap[entry.user_id]
                ? {
                    name: profilesMap[entry.user_id].name,
                    email: profilesMap[entry.user_id].email,
                  }
                : null,
            }));
          });

          // Merge feedback from events/feedback_history tables with what's already in leads table
          allFeedbackData.forEach((activity: any) => {
            const feedbackEntry: FeedbackHistoryEntry = {
              id: activity.id,
              lead_id: activity.lead_id,
              user_id: activity.actor_profile_id ?? '',
              feedback_text: activity.body ?? '',
              created_at: activity.created_at,
              updated_at: activity.updated_at ?? null,
              user: activity.actor_profile_id && profilesMap[activity.actor_profile_id]
                ? {
                    name: profilesMap[activity.actor_profile_id].name,
                    email: profilesMap[activity.actor_profile_id].email,
                  }
                : null,
            };

            if (!feedbackHistoryMap[activity.lead_id]) {
              feedbackHistoryMap[activity.lead_id] = [];
            }
            
            // Check if this entry already exists (avoid duplicates)
            const exists = feedbackHistoryMap[activity.lead_id].some(entry => entry.id === feedbackEntry.id);
            if (!exists) {
              feedbackHistoryMap[activity.lead_id].push(feedbackEntry);
            }
          });

          // Sort each lead's feedback history by created_at descending
          Object.keys(feedbackHistoryMap).forEach(leadId => {
            feedbackHistoryMap[leadId].sort((a, b) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
          });
        } catch (error) {
          console.warn('Error loading feedback history:', error);
          // Continue without feedback history - it's not critical
        }
      } else if (leadIds.length > 100) {
        // Skip feedback history for large result sets to avoid query size limits
        console.log(`Skipping feedback history fetch for ${leadIds.length} leads (too many for efficient query)`);
      }

      const leadsWithFeedback = transformedData.map((lead) => ({
        ...lead,
        feedback_history: feedbackHistoryMap[lead.id] ?? [],
      }));

      // Sort leads to show most recently added leads first
      // Priority: created_at (descending), then id (descending) for stability
      // This ensures that leads with the same created_at always appear in the same order
      const sortedLeads = [...leadsWithFeedback].sort((a, b) => {
        const aCreatedAt = new Date(a.created_at).getTime();
        const bCreatedAt = new Date(b.created_at).getTime();
        if (aCreatedAt !== bCreatedAt) {
          return bCreatedAt - aCreatedAt; // Descending - newest first
        }
        // If created_at is the same, sort by id (descending) for stable ordering
        // Compare UUIDs as strings for consistent ordering
        if (a.id < b.id) return 1;
        if (a.id > b.id) return -1;
        return 0;
      });

      // Store the sorted order in a Map for quick lookup by id
      const orderMap = new Map<string, number>();
      sortedLeads.forEach((lead, index) => {
        orderMap.set(lead.id, index);
      });

      setLeads(sortedLeads as Lead[]);
    } catch (err) {
      console.error('Error fetching leads:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const createLead = useCallback(
    async (input: CreateLeadInput) => {
      if (!user?.id) throw new Error('User not authenticated');

      try {
        const newLead: Partial<Lead> = {
          ...input,
          buyer_user_id: user.id,
          upload_user_id: user.id,
          stage: input.stage || 'New Lead',
          created_at: new Date().toISOString(),
        };

        // Optimistic update
        const tempId = `temp-${Date.now()}`;
        setLeads((prev) => [{ ...newLead, id: tempId } as Lead, ...prev]);

        const { data, error: createError } = await supabase
          .from('leads')
          .insert([newLead])
          .select()
          .single();

        if (createError) throw createError;

        // Replace temp lead with real one
        setLeads((prev) =>
          prev.map((lead) => (lead.id === tempId ? (data as Lead) : lead))
        );

        return data as Lead;
      } catch (err) {
        console.error('Error creating lead:', err);
        // Rollback optimistic update
        fetchLeads();
        throw err;
      }
    },
    [user?.id, fetchLeads]
  );

  const updateLead = useCallback(
    async (id: string, updates: UpdateLeadInput) => {
      try {
        // Mark this lead as being updated to prevent real-time subscription from interfering
        updatingLeadsRef.current.add(id);
        
        // Store the current position and original lead before updating
        let leadIndex = -1;
        let originalLead: Lead | null = null;
        let originalCreatedAt: string = '';
        
        setLeads((prev) => {
          leadIndex = prev.findIndex(lead => lead.id === id);
          if (leadIndex >= 0) {
            originalLead = prev[leadIndex];
            originalCreatedAt = originalLead.created_at;
          }
          // Optimistic update - update in place without changing position
          // Create a new array but maintain exact order
          const newLeads = [...prev];
          if (leadIndex >= 0) {
            newLeads[leadIndex] = { ...newLeads[leadIndex], ...updates };
          }
          return newLeads;
        });

        const { data, error: updateError } = await supabase
          .from('leads')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (updateError) throw updateError;

        // If feedback was updated, refresh feedback history for this lead
        if (updates.feedback !== undefined) {
          try {
            // Fetch the updated lead with feedback_history from JSONB column
            const { data: updatedLeadData } = await supabase
              .from('leads')
              .select('feedback_history')
              .eq('id', id)
              .single();

            // Fetch updated feedback history for this specific lead from separate tables
            const [eventsData, historyData] = await Promise.all([
              supabase
                .from('events')
                .select('id, lead_id, actor_profile_id, body, payload, created_at, updated_at')
                .eq('lead_id', id)
                .eq('event_type', 'activity')
                .eq('activity_type', 'feedback')
                .order('created_at', { ascending: false }),
              supabase
                .from('feedback_history')
                .select('id, lead_id, user_id, feedback_text, created_at, updated_at')
                .eq('lead_id', id)
                .order('created_at', { ascending: false })
            ]);

            // Get profile IDs from all sources
            const profileIds = new Set<string>();
            
            // From leads table feedback_history JSONB column
            if (updatedLeadData?.feedback_history && Array.isArray(updatedLeadData.feedback_history)) {
              updatedLeadData.feedback_history.forEach((entry: any) => {
                if (entry.user_id) profileIds.add(entry.user_id);
              });
            }
            
            // From events table
            if (eventsData.data) {
              eventsData.data.forEach((f: any) => {
                if (f.actor_profile_id) profileIds.add(f.actor_profile_id);
              });
            }
            
            // From feedback_history table
            if (historyData.data) {
              historyData.data.forEach((f: any) => {
                if (f.user_id) profileIds.add(f.user_id);
              });
            }

            // Fetch profiles
            let profilesMap: Record<string, { id: string; name: string; email: string }> = {};
            if (profileIds.size > 0) {
              const { data: profilesData } = await supabase
                .from('profiles')
                .select('id, name, email')
                .in('id', Array.from(profileIds));
              
              if (profilesData) {
                profilesData.forEach((p: any) => {
                  profilesMap[p.id] = { id: p.id, name: p.name || 'Unknown User', email: p.email || '' };
                });
              }
            }

            // Combine and transform feedback history from all sources
            const combinedFeedback: FeedbackHistoryEntry[] = [];
            
            // First, add from leads table feedback_history JSONB column (most up-to-date)
            if (updatedLeadData?.feedback_history && Array.isArray(updatedLeadData.feedback_history)) {
              updatedLeadData.feedback_history.forEach((entry: any) => {
                combinedFeedback.push({
                  id: entry.id || `temp-${Date.now()}-${Math.random()}`,
                  lead_id: id,
                  user_id: entry.user_id || '',
                  feedback_text: entry.feedback_text || entry.feedback || '',
                  created_at: entry.created_at || new Date().toISOString(),
                  updated_at: entry.updated_at || null,
                  user: entry.user_id && profilesMap[entry.user_id]
                    ? {
                        name: profilesMap[entry.user_id].name,
                        email: profilesMap[entry.user_id].email,
                      }
                    : null,
                });
              });
            }
            
            // Add from events table
            if (eventsData.data) {
              eventsData.data.forEach((activity: any) => {
                // Check if already exists (avoid duplicates)
                const exists = combinedFeedback.some(entry => entry.id === activity.id);
                if (!exists) {
                  combinedFeedback.push({
                    id: activity.id,
                    lead_id: activity.lead_id,
                    user_id: activity.actor_profile_id ?? '',
                    feedback_text: activity.body ?? '',
                    created_at: activity.created_at,
                    updated_at: activity.updated_at ?? null,
                    user: activity.actor_profile_id && profilesMap[activity.actor_profile_id]
                      ? {
                          name: profilesMap[activity.actor_profile_id].name,
                          email: profilesMap[activity.actor_profile_id].email,
                        }
                      : null,
                  });
                }
              });
            }

            // Add from feedback_history table
            if (historyData.data) {
              historyData.data.forEach((f: any) => {
                // Check if already exists (avoid duplicates)
                const exists = combinedFeedback.some(entry => entry.id === f.id);
                if (!exists) {
                  combinedFeedback.push({
                    id: f.id,
                    lead_id: f.lead_id,
                    user_id: f.user_id,
                    feedback_text: f.feedback_text,
                    created_at: f.created_at,
                    updated_at: f.updated_at ?? null,
                    user: f.user_id && profilesMap[f.user_id]
                      ? {
                          name: profilesMap[f.user_id].name,
                          email: profilesMap[f.user_id].email,
                        }
                      : null,
                  });
                }
              });
            }

            // Sort by created_at descending and remove duplicates
            const uniqueFeedback = combinedFeedback
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .filter((item, index, self) => 
                index === self.findIndex((t) => t.id === item.id)
              );

            // Update the lead with new feedback history - preserve position
            setLeads((prev) => {
              const currentIndex = prev.findIndex(lead => lead.id === id);
              if (currentIndex < 0) {
                return prev;
              }
              
              // Create a new array with the updated lead at the exact same position
              const newLeads = [...prev];
              newLeads[currentIndex] = {
                ...newLeads[currentIndex],
                ...updates,
                feedback_history: uniqueFeedback,
              };
              
              return newLeads;
            });
          } catch (historyError) {
            console.warn('Error refreshing feedback history:', historyError);
            // Continue even if history refresh fails
          }
        }

        // Update with server response - preserve position by updating in place
        // Don't re-sort, just update the lead at its current position
        setLeads((prev) => {
          // Find the index again (in case array changed)
          const currentIndex = prev.findIndex(lead => lead.id === id);
          if (currentIndex < 0) {
            // Lead not found, return as-is (shouldn't happen)
            return prev;
          }
          
          // Create a new array with the updated lead at the exact same position
          const newLeads = [...prev];
          const updatedLead = data as Lead;
          newLeads[currentIndex] = {
            ...updatedLead,
            created_at: originalCreatedAt || updatedLead.created_at, // Preserve original created_at
          };
          
          return newLeads;
        });

        // Remove from updating set after a short delay to allow real-time updates to be ignored
        setTimeout(() => {
          updatingLeadsRef.current.delete(id);
        }, 2000);

        return data as Lead;
      } catch (err) {
        console.error('Error updating lead:', err);
        // Rollback optimistic update
        fetchLeads();
        throw err;
      }
    },
    [fetchLeads]
  );

  const deleteLead = useCallback(
    async (id: string) => {
      try {
        // Optimistic update
        setLeads((prev) => prev.filter((lead) => lead.id !== id));

        const { error: deleteError } = await supabase
          .from('leads')
          .delete()
          .eq('id', id);

        if (deleteError) throw deleteError;
      } catch (err) {
        console.error('Error deleting lead:', err);
        // Rollback optimistic update
        fetchLeads();
        throw err;
      }
    },
    [fetchLeads]
  );

  useEffect(() => {
    fetchLeads();

    // Set up real-time subscription
    const channel = supabase
      .channel('leads-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
          filter: `buyer_user_id=eq.${user?.id}`,
        },
        (payload) => {
          // For updates, update the lead in place without re-sorting
          if (payload.eventType === 'UPDATE' && payload.new) {
            const leadId = payload.new.id;
            
            // Ignore if we're currently updating this lead (to prevent double updates)
            if (updatingLeadsRef.current.has(leadId)) {
              return;
            }
            
            setLeads((prev) => {
              const existingIndex = prev.findIndex(l => l.id === leadId);
              if (existingIndex >= 0) {
                // Update in place, preserving position and created_at
                const newLeads = [...prev];
                const existingLead = newLeads[existingIndex];
                newLeads[existingIndex] = {
                  ...existingLead,
                  ...payload.new,
                  created_at: existingLead.created_at, // Preserve original created_at
                };
                return newLeads;
              }
              // If lead not found, ignore (might be filtered out)
              return prev;
            });
          } else if (payload.eventType === 'INSERT' && payload.new) {
            // For new leads, add to the beginning (most recent first)
            setLeads((prev) => {
              // Check if lead already exists (might have been optimistically added)
              const exists = prev.some(l => l.id === payload.new.id);
              if (exists) {
                return prev;
              }
              return [payload.new as Lead, ...prev];
            });
          } else if (payload.eventType === 'DELETE' && payload.old) {
            // For deleted leads, remove from the list
            setLeads((prev) => prev.filter(l => l.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLeads, user?.id]);

  return {
    leads,
    loading,
    error,
    fetchLeads,
    createLead,
    updateLead,
    deleteLead,
  };
}

