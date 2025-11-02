/**
 * Dashboard Banners Data Access Layer
 */

import { supabase } from '../supabaseClient';
import { logAudit } from './audit';

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
      .from('dashboard_banners')
      .select('*')
      .order('priority', { ascending: true })
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
      .from('dashboard_banners')
      .select('*')
      .eq('id', id)
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
    const { data, error } = await supabase
      .from('dashboard_banners')
      .insert({
        ...banner,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Create banner error:', error);
      return null;
    }

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
    console.error('Create banner exception:', error);
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
    const { data, error } = await supabase
      .from('dashboard_banners')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update banner error:', error);
      return null;
    }

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
    console.error('Update banner exception:', error);
    return null;
  }
}

/**
 * Delete a banner
 */
export async function deleteBanner(id: string, userId?: string) {
  try {
    const { error } = await supabase
      .from('dashboard_banners')
      .delete()
      .eq('id', id);

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
      .from('dashboard_banners')
      .select('*')
      .eq('status', 'live')
      .or(`start_at.is.null,start_at.lte.${now}`)
      .or(`end_at.is.null,end_at.gte.${now}`)
      .order('priority', { ascending: true })
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
 */
export async function trackBannerImpression(
  bannerId: string,
  viewerId: string
) {
  try {
    await supabase
      .from('banner_metrics')
      .insert({
        banner_id: bannerId,
        viewer_id: viewerId,
        event: 'impression',
      });
  } catch (error) {
    console.error('Track impression error:', error);
  }
}

/**
 * Track banner click
 */
export async function trackBannerClick(
  bannerId: string,
  viewerId: string
) {
  try {
    await supabase
      .from('banner_metrics')
      .insert({
        banner_id: bannerId,
        viewer_id: viewerId,
        event: 'click',
      });
  } catch (error) {
    console.error('Track click error:', error);
  }
}

/**
 * Get banner analytics
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

    if (error) {
      console.error('Get banner analytics error:', error);
      return { impressions: 0, clicks: 0, ctr: 0 };
    }

    const impressions = data?.filter(m => m.event === 'impression').length || 0;
    const clicks = data?.filter(m => m.event === 'click').length || 0;
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

    return { impressions, clicks, ctr };
  } catch (error) {
    console.error('Get banner analytics exception:', error);
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

