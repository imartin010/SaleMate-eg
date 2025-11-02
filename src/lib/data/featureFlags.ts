/**
 * Feature Flags Data Access Layer
 */

import { supabase } from '../supabaseClient';
import { logAudit } from './audit';

export interface FeatureFlag {
  key: string;
  description?: string;
  enabled: boolean;
  updated_by?: string;
  updated_at?: string;
}

/**
 * Check if a feature is enabled
 */
export async function isFeatureEnabled(key: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('feature_flags')
      .select('enabled')
      .eq('key', key)
      .maybeSingle();

    if (error) {
      console.error('Check feature flag error:', error);
      return false;
    }

    return data?.enabled || false;
  } catch (error) {
    console.error('Check feature flag exception:', error);
    return false;
  }
}

/**
 * Get all feature flags
 */
export async function getAllFeatureFlags(): Promise<FeatureFlag[]> {
  try {
    const { data, error } = await supabase
      .from('feature_flags')
      .select('*')
      .order('key');

    if (error) {
      console.error('Get feature flags error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Get feature flags exception:', error);
    return [];
  }
}

/**
 * Toggle a feature flag
 */
export async function toggleFeatureFlag(
  key: string,
  enabled: boolean,
  userId?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('feature_flags')
      .update({
        enabled,
        updated_by: userId,
      })
      .eq('key', key);

    if (error) {
      console.error('Toggle feature flag error:', error);
      return false;
    }

    // Log audit
    if (userId) {
      await logAudit({
        actor_id: userId,
        action: 'update',
        entity: 'feature_flags',
        entity_id: key,
        changes: { enabled },
      });
    }

    return true;
  } catch (error) {
    console.error('Toggle feature flag exception:', error);
    return false;
  }
}

/**
 * Create a feature flag
 */
export async function createFeatureFlag(
  key: string,
  description: string,
  enabled: boolean = false,
  userId?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('feature_flags')
      .insert({
        key,
        description,
        enabled,
        updated_by: userId,
      });

    if (error) {
      console.error('Create feature flag error:', error);
      return false;
    }

    // Log audit
    if (userId) {
      await logAudit({
        actor_id: userId,
        action: 'create',
        entity: 'feature_flags',
        entity_id: key,
        changes: { enabled, description },
      });
    }

    return true;
  } catch (error) {
    console.error('Create feature flag exception:', error);
    return false;
  }
}

/**
 * Delete a feature flag
 */
export async function deleteFeatureFlag(key: string, userId?: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('feature_flags')
      .delete()
      .eq('key', key);

    if (error) {
      console.error('Delete feature flag error:', error);
      return false;
    }

    // Log audit
    if (userId) {
      await logAudit({
        actor_id: userId,
        action: 'delete',
        entity: 'feature_flags',
        entity_id: key,
      });
    }

    return true;
  } catch (error) {
    console.error('Delete feature flag exception:', error);
    return false;
  }
}

