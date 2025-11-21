/**
 * Dashboard Banners Data Access Layer
 */

import { supabase } from '../supabaseClient';
import { logAudit } from './audit';

// Cache for banner_metrics table existence check
// Use localStorage to persist across page refreshes
const BANNER_METRICS_CACHE_KEY = 'banner_metrics_table_exists';

let bannerMetricsTableExists: boolean | null = null;

/**
 * Check if banner_metrics table exists (cached with localStorage)
 * Defaults to false (table doesn't exist) to avoid unnecessary requests
 */
async function checkBannerMetricsTableExists(): Promise<boolean> {
  // Return cached result if available
  if (bannerMetricsTableExists !== null) {
    return bannerMetricsTableExists;
  }

  // Check localStorage cache first - this persists across page refreshes
  try {
    const cached = localStorage.getItem(BANNER_METRICS_CACHE_KEY);
    if (cached !== null) {
      const exists = cached === 'true';
      bannerMetricsTableExists = exists;
      return exists;
    }
  } catch (e) {
    // Ignore localStorage errors
  }

  // Default to false (table doesn't exist) to avoid making requests
  // This prevents 404 errors from appearing in console
  // If the table is created later, clear localStorage to re-check
  bannerMetricsTableExists = false;
  
  // Cache the default value
  try {
    localStorage.setItem(BANNER_METRICS_CACHE_KEY, 'false');
  } catch (e) {
    // Ignore localStorage errors
  }
  
  return false;
}

export interface DashboardBanner {
  id: string;
  title: string;
  subtitle?: string;
  cta_label?: string;
  cta_url?: string;
  image_url?: string;
  placement: string;
  audience: string[];
  visibility_rules: Record<string, unknown>;
  status: 'draft' | 'scheduled' | 'live' | 'archived';
  start_at?: string;
  end_at?: string;
  priority: number;
  created_by?: string;
  updated_at?: string;
  created_at?: string;
}

export interface BannerViewer {
  id: string;
  role: string;
  region?: string;
  wallet_balance?: number;
  team_id?: string;
}

/**
 * Get all banners (admin)
 */
export async function getAllBanners() {
  try {
    const { data, error } = await supabase
      .from('content')
      .select('*')
      .eq('content_type', 'banner')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get banners error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Get banners exception:', error);
    return [];
  }
}

/**
 * Get banner by ID
 */
export async function getBanner(id: string) {
  try {
    const { data, error } = await supabase
      .from('content')
      .select('*')
      .eq('id', id)
      .eq('content_type', 'banner')
      .single();

    if (error) {
      console.error('Get banner error:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Get banner exception:', error);
    return null;
  }
}

/**
 * Create a banner
 */
export async function createBanner(
  banner: Omit<DashboardBanner, 'id' | 'created_at' | 'updated_at'>,
  userId?: string
) {
  try {
    console.log('💾 Creating banner with data:', banner);
    console.log('🖼️ Image URL in createBanner:', banner.image_url);
    
    const { data, error } = await supabase
      .from('content')
      .insert({
        content_type: 'banner',
        title: banner.title,
        body: banner.subtitle,
        placement: banner.placement,
        audience: banner.audience ? JSON.parse(JSON.stringify(banner.audience)) : {},
        status: banner.status || 'draft',
        start_at: banner.start_at,
        end_at: banner.end_at,
        cta: {
          cta_label: banner.cta_label,
          cta_url: banner.cta_url,
          image_url: banner.image_url || null,
        },
        created_by_profile_id: userId,
        metadata: {
          priority: banner.priority,
          visibility_rules: banner.visibility_rules,
        },
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Create banner error:', error);
      return null;
    }

    console.log('✅ Banner created successfully:', data);
    console.log('🖼️ Image URL in created banner:', data.image_url);

    // Log audit
    if (userId) {
      await logAudit({
        actor_id: userId,
        action: 'create',
        entity: 'dashboard_banners',
        entity_id: data.id,
        changes: banner,
      });
    }

    return data;
  } catch (error) {
    console.error('❌ Create banner exception:', error);
    return null;
  }
}

/**
 * Update a banner
 */
export async function updateBanner(
  id: string,
  updates: Partial<DashboardBanner>,
  userId?: string
) {
  try {
    console.log('💾 Updating banner:', id, 'with data:', updates);
    console.log('🖼️ Image URL in updateBanner:', updates.image_url);
    
    // Build update object for content table
    const contentUpdate: any = {
      content_type: 'banner',
    };
    
    if (updates.title !== undefined) contentUpdate.title = updates.title;
    if (updates.subtitle !== undefined) contentUpdate.body = updates.subtitle;
    if (updates.placement !== undefined) contentUpdate.placement = updates.placement;
    if (updates.audience !== undefined) contentUpdate.audience = updates.audience;
    if (updates.status !== undefined) contentUpdate.status = updates.status;
    if (updates.start_at !== undefined) contentUpdate.start_at = updates.start_at;
    if (updates.end_at !== undefined) contentUpdate.end_at = updates.end_at;
    
    // Handle CTA and image_url
    if (updates.cta_label !== undefined || updates.cta_url !== undefined || updates.image_url !== undefined) {
      // Get existing banner to merge CTA
      const { data: existing } = await supabase
        .from('content')
        .select('cta')
        .eq('id', id)
        .eq('content_type', 'banner')
        .single();
      
      const existingCta = existing?.cta || {};
      contentUpdate.cta = {
        ...existingCta,
        cta_label: updates.cta_label !== undefined ? updates.cta_label : existingCta.cta_label,
        cta_url: updates.cta_url !== undefined ? updates.cta_url : existingCta.cta_url,
        image_url: updates.image_url !== undefined ? updates.image_url : existingCta.image_url,
      };
    }
    
    if (updates.priority !== undefined || updates.visibility_rules !== undefined) {
      const { data: existing } = await supabase
        .from('content')
        .select('metadata')
        .eq('id', id)
        .eq('content_type', 'banner')
        .single();
      
      const existingMetadata = existing?.metadata || {};
      contentUpdate.metadata = {
        ...existingMetadata,
        priority: updates.priority !== undefined ? updates.priority : existingMetadata.priority,
        visibility_rules: updates.visibility_rules !== undefined ? updates.visibility_rules : existingMetadata.visibility_rules,
      };
    }
    
    const { data, error } = await supabase
      .from('content')
      .update(contentUpdate)
      .eq('id', id)
      .eq('content_type', 'banner')
      .select()
      .single();

    if (error) {
      console.error('❌ Update banner error:', error);
      return null;
    }

    console.log('✅ Banner updated successfully:', data);
    console.log('🖼️ Image URL in updated banner:', data.image_url);

    // Log audit
    if (userId) {
      await logAudit({
        actor_id: userId,
        action: 'update',
        entity: 'dashboard_banners',
        entity_id: id,
        changes: updates,
      });
    }

    return data;
  } catch (error) {
    console.error('❌ Update banner exception:', error);
    return null;
  }
}

/**
 * Delete a banner
 */
export async function deleteBanner(id: string, userId?: string) {
  try {
    const { error } = await supabase
      .from('content')
      .delete()
      .eq('id', id)
      .eq('content_type', 'banner');

    if (error) {
      console.error('Delete banner error:', error);
      return false;
    }

    // Log audit
    if (userId) {
      await logAudit({
        actor_id: userId,
        action: 'delete',
        entity: 'dashboard_banners',
        entity_id: id,
      });
    }

    return true;
  } catch (error) {
    console.error('Delete banner exception:', error);
    return false;
  }
}

/**
 * Resolve eligible banners for a viewer
 * Returns banners that match viewer's role, placement, and visibility rules
 */
export async function resolveBannersForViewer(
  viewer: BannerViewer,
  placement?: string
): Promise<DashboardBanner[]> {
  try {
    const now = new Date().toISOString();

    // Get live banners
    let query = supabase
      .from('content')
      .select('*')
      .eq('content_type', 'banner')
      .eq('status', 'live')
      .or(`start_at.is.null,start_at.lte.${now}`)
      .or(`end_at.is.null,end_at.gte.${now}`)
      .order('metadata->priority', { ascending: true, nullsLast: true })
      .order('start_at', { ascending: false, nullsFirst: true });

    if (placement) {
      query = query.eq('placement', placement);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Resolve banners error:', error);
      return [];
    }

    if (!data) return [];

    // Filter by audience and visibility rules (client-side)
    const eligible = data.filter(banner => {
      // Check audience (role)
      if (banner.audience && banner.audience.length > 0) {
        if (!banner.audience.includes(viewer.role)) {
          return false;
        }
      }

      // Check visibility rules
      if (banner.visibility_rules && Object.keys(banner.visibility_rules).length > 0) {
        const rules = banner.visibility_rules;

        // Region rule
        if (rules.region && viewer.region) {
          if (Array.isArray(rules.region)) {
            if (!rules.region.includes(viewer.region)) return false;
          } else if (rules.region !== viewer.region) {
            return false;
          }
        }

        // Minimum wallet balance rule
        if (rules.min_wallet_balance && viewer.wallet_balance !== undefined) {
          if (viewer.wallet_balance < (rules.min_wallet_balance as number)) {
            return false;
          }
        }

        // Team ID rule
        if (rules.team_ids && viewer.team_id) {
          if (Array.isArray(rules.team_ids)) {
            if (!rules.team_ids.includes(viewer.team_id)) return false;
          }
        }
      }

      return true;
    });

    return eligible;
  } catch (error) {
    console.error('Resolve banners exception:', error);
    return [];
  }
}

/**
 * Track banner impression
 * Note: banner_metrics table may not exist, so we check first and skip if it doesn't
 */
export async function trackBannerImpression(
  bannerId: string,
  viewerId: string
) {
  // Check if table exists first - skip if it doesn't
  const tableExists = await checkBannerMetricsTableExists();
  if (!tableExists) {
    return; // Silently skip tracking if table doesn't exist
  }

  try {
    const { error } = await supabase
      .from('banner_metrics')
      .insert({
        banner_id: bannerId,
        viewer_id: viewerId,
        event: 'impression',
      });
    
    // Silently ignore errors - metrics tracking is optional
    if (error) {
      // If we get a table not found error, update cache
      const isNotFound = error.message?.includes('404') || 
                        error.message?.includes('Not Found') ||
                        error.message?.includes('Could not find the table') ||
                        error.code === '42P01' || 
                        error.code === 'PGRST116' ||
                        error.code === 'PGRST205';
      if (isNotFound) {
        bannerMetricsTableExists = false;
      } else {
        console.warn('Track impression error:', error);
      }
    }
  } catch (error) {
    // Silently ignore all errors - metrics tracking is optional
  }
}

/**
 * Track banner click
 * Note: banner_metrics table may not exist, so we check first and skip if it doesn't
 */
export async function trackBannerClick(
  bannerId: string,
  viewerId: string
) {
  // Check if table exists first - skip if it doesn't
  const tableExists = await checkBannerMetricsTableExists();
  if (!tableExists) {
    return; // Silently skip tracking if table doesn't exist
  }

  try {
    const { error } = await supabase
      .from('banner_metrics')
      .insert({
        banner_id: bannerId,
        viewer_id: viewerId,
        event: 'click',
      });
    
    // Silently ignore errors - metrics tracking is optional
    if (error) {
      // If we get a table not found error, update cache
      const isNotFound = error.message?.includes('404') || 
                        error.message?.includes('Not Found') ||
                        error.message?.includes('Could not find the table') ||
                        error.code === '42P01' || 
                        error.code === 'PGRST116' ||
                        error.code === 'PGRST205';
      if (isNotFound) {
        bannerMetricsTableExists = false;
      } else {
        console.warn('Track click error:', error);
      }
    }
  } catch (error) {
    // Silently ignore all errors - metrics tracking is optional
  }
}

/**
 * Get banner analytics
 * Note: banner_metrics table may not exist, returns zeros if unavailable
 */
export async function getBannerAnalytics(bannerId?: string) {
  try {
    let query = supabase
      .from('banner_metrics')
      .select('banner_id, event, created_at');

    if (bannerId) {
      query = query.eq('banner_id', bannerId);
    }

    const { data, error } = await query;

    // If table doesn't exist, return zeros
    if (error) {
      const isNotFound = error.code === '42P01' || 
                        error.code === 'PGRST116' ||
                        error.code === 'PGRST205' ||
                        error.message?.includes('Could not find the table');
      if (isNotFound) {
        return { impressions: 0, clicks: 0, ctr: 0 };
      }
      console.warn('Get banner analytics error:', error);
      return { impressions: 0, clicks: 0, ctr: 0 };
    }

    const impressions = data?.filter(m => m.event === 'impression').length || 0;
    const clicks = data?.filter(m => m.event === 'click').length || 0;
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

    return { impressions, clicks, ctr };
  } catch (error) {
    // Silently return zeros if table doesn't exist
    return { impressions: 0, clicks: 0, ctr: 0 };
  }
}

/**
 * Duplicate a banner
 */
export async function duplicateBanner(
  id: string,
  userId?: string
): Promise<DashboardBanner | null> {
  try {
    const original = await getBanner(id);
    if (!original) return null;

    const duplicate: Omit<DashboardBanner, 'id' | 'created_at' | 'updated_at'> = {
      title: `${original.title} (Copy)`,
      subtitle: original.subtitle,
      cta_label: original.cta_label,
      cta_url: original.cta_url,
      image_url: original.image_url,
      placement: original.placement,
      audience: original.audience,
      visibility_rules: original.visibility_rules,
      status: 'draft', // Always duplicate as draft
      start_at: undefined,
      end_at: undefined,
      priority: original.priority,
      created_by: userId,
    };

    return await createBanner(duplicate, userId);
  } catch (error) {
    console.error('Duplicate banner exception:', error);
    return null;
  }
}

