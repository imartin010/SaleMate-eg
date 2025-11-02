/**
 * System Settings Data Access Layer
 */

import { supabase } from '../supabaseClient';
import { logAudit } from './audit';

export interface SystemSetting {
  key: string;
  value: unknown;
  description?: string;
  updated_by?: string;
  updated_at?: string;
}

/**
 * Get a system setting by key
 */
export async function getSetting(key: string): Promise<unknown | null> {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle();

    if (error) {
      console.error('Get setting error:', error);
      return null;
    }

    return data?.value || null;
  } catch (error) {
    console.error('Get setting exception:', error);
    return null;
  }
}

/**
 * Get all system settings
 */
export async function getAllSettings() {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .order('key');

    if (error) {
      console.error('Get all settings error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Get all settings exception:', error);
    return [];
  }
}

/**
 * Update or create a system setting
 */
export async function setSetting(
  key: string,
  value: unknown,
  description?: string,
  userId?: string
) {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .upsert({
        key,
        value,
        description,
        updated_by: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Set setting error:', error);
      return false;
    }

    // Log audit
    if (userId) {
      await logAudit({
        actor_id: userId,
        action: 'update',
        entity: 'system_settings',
        entity_id: key,
        changes: { value },
      });
    }

    return true;
  } catch (error) {
    console.error('Set setting exception:', error);
    return false;
  }
}

/**
 * Delete a system setting
 */
export async function deleteSetting(key: string, userId?: string) {
  try {
    const { error } = await supabase
      .from('system_settings')
      .delete()
      .eq('key', key);

    if (error) {
      console.error('Delete setting error:', error);
      return false;
    }

    // Log audit
    if (userId) {
      await logAudit({
        actor_id: userId,
        action: 'delete',
        entity: 'system_settings',
        entity_id: key,
      });
    }

    return true;
  } catch (error) {
    console.error('Delete setting exception:', error);
    return false;
  }
}

/**
 * Get multiple settings by keys
 */
export async function getSettings(keys: string[]): Promise<Record<string, unknown>> {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value')
      .in('key', keys);

    if (error) {
      console.error('Get settings error:', error);
      return {};
    }

    return data?.reduce((acc, item) => ({
      ...acc,
      [item.key]: item.value,
    }), {}) || {};
  } catch (error) {
    console.error('Get settings exception:', error);
    return {};
  }
}

