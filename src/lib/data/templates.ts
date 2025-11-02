/**
 * Email and SMS Templates Data Access Layer
 */

import { supabase } from '../supabaseClient';
import { logAudit } from './audit';

export interface EmailTemplate {
  id: string;
  key: string;
  name: string;
  subject: string;
  html: string;
  variables: string[];
  status: 'active' | 'archived';
  updated_at?: string;
  created_at?: string;
}

export interface SMSTemplate {
  id: string;
  key: string;
  name: string;
  body: string;
  variables: string[];
  status: 'active' | 'archived';
  updated_at?: string;
  created_at?: string;
}

// ==================== EMAIL TEMPLATES ====================

/**
 * Get all email templates
 */
export async function getAllEmailTemplates() {
  try {
    const { data, error } = await supabase
      .from('templates_email')
      .select('*')
      .order('key');

    if (error) {
      console.error('Get email templates error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Get email templates exception:', error);
    return [];
  }
}

/**
 * Get email template by key
 */
export async function getEmailTemplate(key: string) {
  try {
    const { data, error } = await supabase
      .from('templates_email')
      .select('*')
      .eq('key', key)
      .maybeSingle();

    if (error) {
      console.error('Get email template error:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Get email template exception:', error);
    return null;
  }
}

/**
 * Create email template
 */
export async function createEmailTemplate(
  template: Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'>,
  userId?: string
) {
  try {
    const { data, error } = await supabase
      .from('templates_email')
      .insert(template)
      .select()
      .single();

    if (error) {
      console.error('Create email template error:', error);
      return null;
    }

    // Log audit
    if (userId) {
      await logAudit({
        actor_id: userId,
        action: 'create',
        entity: 'templates_email',
        entity_id: data.id,
        changes: template,
      });
    }

    return data;
  } catch (error) {
    console.error('Create email template exception:', error);
    return null;
  }
}

/**
 * Update email template
 */
export async function updateEmailTemplate(
  id: string,
  updates: Partial<EmailTemplate>,
  userId?: string
) {
  try {
    const { data, error } = await supabase
      .from('templates_email')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update email template error:', error);
      return null;
    }

    // Log audit
    if (userId) {
      await logAudit({
        actor_id: userId,
        action: 'update',
        entity: 'templates_email',
        entity_id: id,
        changes: updates,
      });
    }

    return data;
  } catch (error) {
    console.error('Update email template exception:', error);
    return null;
  }
}

/**
 * Delete email template
 */
export async function deleteEmailTemplate(id: string, userId?: string) {
  try {
    const { error } = await supabase
      .from('templates_email')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete email template error:', error);
      return false;
    }

    // Log audit
    if (userId) {
      await logAudit({
        actor_id: userId,
        action: 'delete',
        entity: 'templates_email',
        entity_id: id,
      });
    }

    return true;
  } catch (error) {
    console.error('Delete email template exception:', error);
    return false;
  }
}

// ==================== SMS TEMPLATES ====================

/**
 * Get all SMS templates
 */
export async function getAllSMSTemplates() {
  try {
    const { data, error } = await supabase
      .from('templates_sms')
      .select('*')
      .order('key');

    if (error) {
      console.error('Get SMS templates error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Get SMS templates exception:', error);
    return [];
  }
}

/**
 * Get SMS template by key
 */
export async function getSMSTemplate(key: string) {
  try {
    const { data, error } = await supabase
      .from('templates_sms')
      .select('*')
      .eq('key', key)
      .maybeSingle();

    if (error) {
      console.error('Get SMS template error:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Get SMS template exception:', error);
    return null;
  }
}

/**
 * Create SMS template
 */
export async function createSMSTemplate(
  template: Omit<SMSTemplate, 'id' | 'created_at' | 'updated_at'>,
  userId?: string
) {
  try {
    const { data, error } = await supabase
      .from('templates_sms')
      .insert(template)
      .select()
      .single();

    if (error) {
      console.error('Create SMS template error:', error);
      return null;
    }

    // Log audit
    if (userId) {
      await logAudit({
        actor_id: userId,
        action: 'create',
        entity: 'templates_sms',
        entity_id: data.id,
        changes: template,
      });
    }

    return data;
  } catch (error) {
    console.error('Create SMS template exception:', error);
    return null;
  }
}

/**
 * Update SMS template
 */
export async function updateSMSTemplate(
  id: string,
  updates: Partial<SMSTemplate>,
  userId?: string
) {
  try {
    const { data, error } = await supabase
      .from('templates_sms')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update SMS template error:', error);
      return null;
    }

    // Log audit
    if (userId) {
      await logAudit({
        actor_id: userId,
        action: 'update',
        entity: 'templates_sms',
        entity_id: id,
        changes: updates,
      });
    }

    return data;
  } catch (error) {
    console.error('Update SMS template exception:', error);
    return null;
  }
}

/**
 * Delete SMS template
 */
export async function deleteSMSTemplate(id: string, userId?: string) {
  try {
    const { error } = await supabase
      .from('templates_sms')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete SMS template error:', error);
      return false;
    }

    // Log audit
    if (userId) {
      await logAudit({
        actor_id: userId,
        action: 'delete',
        entity: 'templates_sms',
        entity_id: id,
      });
    }

    return true;
  } catch (error) {
    console.error('Delete SMS template exception:', error);
    return false;
  }
}

// ==================== TEMPLATE RENDERING ====================

/**
 * Replace variables in template
 */
export function renderTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let rendered = template;
  
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    rendered = rendered.replace(regex, value);
  });

  return rendered;
}

/**
 * Extract variables from template
 */
export function extractVariables(template: string): string[] {
  const regex = /{{(\w+)}}/g;
  const matches = template.matchAll(regex);
  const variables = new Set<string>();

  for (const match of matches) {
    variables.add(match[1]);
  }

  return Array.from(variables);
}

