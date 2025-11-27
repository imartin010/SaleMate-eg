import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';

export interface ScheduledReport {
  id: string;
  user_id: string;
  report_type: 'daily' | 'weekly' | 'monthly';
  email_recipients: string[];
  is_active: boolean;
  last_sent_at: string | null;
  next_send_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateScheduledReportInput {
  report_type: 'daily' | 'weekly' | 'monthly';
  email_recipients: string[];
  is_active?: boolean;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://wkxbhvckmgrmdkdkhnqo.supabase.co';

export function useScheduledReports() {
  const [reports, setReports] = useState<ScheduledReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('crm_scheduled_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setReports(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch scheduled reports');
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const createScheduledReport = useCallback(async (input: CreateScheduledReportInput) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Calculate next_send_at
      const { data: nextSendAt, error: calcError } = await supabase.rpc('calculate_next_send_at', {
        report_type: input.report_type,
        current_time: new Date().toISOString(),
      });

      if (calcError) throw calcError;
      
      // RPC returns the value directly, not wrapped in data
      const nextSendAtValue = nextSendAt as string;

      const { data, error: insertError } = await supabase
        .from('crm_scheduled_reports')
        .insert({
          user_id: user.id,
          report_type: input.report_type,
          email_recipients: input.email_recipients,
          is_active: input.is_active ?? true,
          next_send_at: nextSendAtValue,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      await fetchReports();
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create scheduled report');
    }
  }, [fetchReports]);

  const updateScheduledReport = useCallback(async (
    id: string,
    updates: Partial<CreateScheduledReportInput & { is_active?: boolean }>
  ) => {
    try {
      const updateData: Record<string, unknown> = { ...updates };

      // Recalculate next_send_at if report_type changed
      if (updates.report_type) {
        const { data: nextSendAt, error: calcError } = await supabase.rpc('calculate_next_send_at', {
          report_type: updates.report_type,
          current_time: new Date().toISOString(),
        });

        if (calcError) throw calcError;
        // RPC returns the value directly
        updateData.next_send_at = nextSendAt as string;
      }

      const { data, error: updateError } = await supabase
        .from('crm_scheduled_reports')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      await fetchReports();
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update scheduled report');
    }
  }, [fetchReports]);

  const deleteScheduledReport = useCallback(async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('crm_scheduled_reports')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      await fetchReports();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete scheduled report');
    }
  }, [fetchReports]);

  const sendTestReport = useCallback(async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/send-crm-reports?reportId=${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send test report');
      }

      const result = await response.json();
      await fetchReports();
      return result;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to send test report');
    }
  }, [fetchReports]);

  return {
    reports,
    loading,
    error,
    refetch: fetchReports,
    createScheduledReport,
    updateScheduledReport,
    deleteScheduledReport,
    sendTestReport,
  };
}

