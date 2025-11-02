/**
 * Audit Log Data Access Layer
 * Centralized audit logging and queries
 */

import { supabase } from '../supabaseClient';

export interface AuditLogEntry {
  id?: string;
  actor_id: string;
  action: string;
  entity: string;
  entity_id: string;
  changes?: Record<string, unknown>;
  context?: Record<string, unknown>;
  created_at?: string;
}

/**
 * Log an action to audit trail
 */
export async function logAudit(log: Omit<AuditLogEntry, 'id' | 'created_at'>) {
  try {
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        actor_id: log.actor_id,
        action: log.action,
        entity: log.entity,
        entity_id: log.entity_id,
        changes: log.changes,
        context: log.context,
      });

    if (error) {
      console.error('Audit log error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Audit log exception:', error);
    return false;
  }
}

/**
 * Get audit logs with filters
 */
export async function getAuditLogs(filters?: {
  actor_id?: string;
  action?: string;
  entity?: string;
  from_date?: string;
  to_date?: string;
  limit?: number;
}) {
  try {
    let query = supabase
      .from('audit_logs')
      .select(`
        *,
        actor:profiles!audit_logs_actor_id_fkey(id, name, email, role)
      `)
      .order('created_at', { ascending: false });

    if (filters?.actor_id) {
      query = query.eq('actor_id', filters.actor_id);
    }

    if (filters?.action) {
      query = query.eq('action', filters.action);
    }

    if (filters?.entity) {
      query = query.eq('entity', filters.entity);
    }

    if (filters?.from_date) {
      query = query.gte('created_at', filters.from_date);
    }

    if (filters?.to_date) {
      query = query.lte('created_at', filters.to_date);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Get audit logs error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Get audit logs exception:', error);
    return [];
  }
}

/**
 * Export audit logs to CSV
 */
export function exportAuditLogsToCSV(logs: AuditLogEntry[]): string {
  const headers = ['Date', 'Actor', 'Action', 'Entity', 'Entity ID', 'Changes'];
  const rows = logs.map(log => [
    new Date(log.created_at!).toLocaleString(),
    (log as any).actor?.name || log.actor_id,
    log.action,
    log.entity,
    log.entity_id,
    JSON.stringify(log.changes || {}),
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  return csv;
}

