/**
 * CMS Pages Data Access Layer
 */

import { supabase } from '../supabaseClient';
import { logAudit } from './audit';

export interface CMSPage {
  id: string;
  slug: string;
  title: string;
  status: 'draft' | 'published';
  content_json: Record<string, unknown>;
  meta: Record<string, unknown>;
  published_at?: string;
  created_by?: string;
  updated_at?: string;
  created_at?: string;
}

/**
 * Get all CMS pages
 */
export async function getAllCMSPages() {
  try {
    const { data, error } = await supabase
      .from('cms_pages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get CMS pages error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Get CMS pages exception:', error);
    return [];
  }
}

/**
 * Get CMS page by ID
 */
export async function getCMSPage(id: string) {
  try {
    const { data, error } = await supabase
      .from('cms_pages')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Get CMS page error:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Get CMS page exception:', error);
    return null;
  }
}

/**
 * Get CMS page by slug
 */
export async function getCMSPageBySlug(slug: string) {
  try {
    const { data, error } = await supabase
      .from('cms_pages')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();

    if (error) {
      console.error('Get CMS page by slug error:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Get CMS page by slug exception:', error);
    return null;
  }
}

/**
 * Create CMS page
 */
export async function createCMSPage(
  page: Omit<CMSPage, 'id' | 'created_at' | 'updated_at'>,
  userId?: string
) {
  try {
    const { data, error } = await supabase
      .from('cms_pages')
      .insert({
        ...page,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Create CMS page error:', error);
      return null;
    }

    // Log audit
    if (userId) {
      await logAudit({
        actor_id: userId,
        action: 'create',
        entity: 'cms_pages',
        entity_id: data.id,
        changes: { slug: page.slug, title: page.title },
      });
    }

    return data;
  } catch (error) {
    console.error('Create CMS page exception:', error);
    return null;
  }
}

/**
 * Update CMS page
 */
export async function updateCMSPage(
  id: string,
  updates: Partial<CMSPage>,
  userId?: string
) {
  try {
    const { data, error } = await supabase
      .from('cms_pages')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update CMS page error:', error);
      return null;
    }

    // Log audit
    if (userId) {
      await logAudit({
        actor_id: userId,
        action: 'update',
        entity: 'cms_pages',
        entity_id: id,
        changes: updates,
      });
    }

    return data;
  } catch (error) {
    console.error('Update CMS page exception:', error);
    return null;
  }
}

/**
 * Delete CMS page
 */
export async function deleteCMSPage(id: string, userId?: string) {
  try {
    const { error } = await supabase
      .from('cms_pages')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete CMS page error:', error);
      return false;
    }

    // Log audit
    if (userId) {
      await logAudit({
        actor_id: userId,
        action: 'delete',
        entity: 'cms_pages',
        entity_id: id,
      });
    }

    return true;
  } catch (error) {
    console.error('Delete CMS page exception:', error);
    return false;
  }
}

/**
 * Publish CMS page
 */
export async function publishCMSPage(id: string, userId?: string) {
  try {
    const updates: Partial<CMSPage> = {
      status: 'published',
      published_at: new Date().toISOString(),
    };

    return await updateCMSPage(id, updates, userId);
  } catch (error) {
    console.error('Publish CMS page exception:', error);
    return null;
  }
}

/**
 * Unpublish CMS page
 */
export async function unpublishCMSPage(id: string, userId?: string) {
  try {
    const updates: Partial<CMSPage> = {
      status: 'draft',
    };

    return await updateCMSPage(id, updates, userId);
  } catch (error) {
    console.error('Unpublish CMS page exception:', error);
    return null;
  }
}

// ==================== MEDIA LIBRARY ====================

export interface CMSMedia {
  id: string;
  bucket: string;
  path: string;
  alt?: string;
  width?: number;
  height?: number;
  size_bytes?: number;
  mime_type?: string;
  meta?: Record<string, unknown>;
  created_by?: string;
  created_at?: string;
}

/**
 * Get all media files
 */
export async function getAllMedia(limit?: number) {
  try {
    let query = supabase
      .from('cms_media')
      .select('*')
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Get media error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Get media exception:', error);
    return [];
  }
}

/**
 * Delete media file
 */
export async function deleteMedia(id: string, userId?: string) {
  try {
    const { error } = await supabase
      .from('cms_media')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete media error:', error);
      return false;
    }

    // Log audit
    if (userId) {
      await logAudit({
        actor_id: userId,
        action: 'delete',
        entity: 'cms_media',
        entity_id: id,
      });
    }

    return true;
  } catch (error) {
    console.error('Delete media exception:', error);
    return false;
  }
}

