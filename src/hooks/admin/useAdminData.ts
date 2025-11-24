import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { UserRole } from '../../types';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface AdminProject {
  id: string;
  name: string;
  region: string;
  available_leads: number;
  price_per_lead: number;
  description?: string;
}

export interface AdminStats {
  totalUsers: number;
  totalProjects: number;
  totalLeads: number;
  pendingRequests: number;
}

export interface PurchaseRequest {
  id: string;
  user_id: string;
  project_id: string;
  quantity: number;
  total_amount: number;
  status: string;
  created_at: string;
  user_name?: string;
  project_name?: string;
}

export function useAdminData() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalProjects: 0,
    totalLeads: 0,
    pendingRequests: 0,
  });
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel for better performance
      const [usersResult, projectsResult, leadsResult, requestsResult] = await Promise.all([
        supabase.from('profiles').select('id, name, email, role, created_at').order('created_at', { ascending: false }),
        supabase.from('projects').select('id, name, region, available_leads, price_per_lead, description').order('name'),
        supabase.from('leads').select('id', { count: 'exact', head: true }),
        supabase
          .from('transactions')
          .select('id, profile_id, project_id, quantity, amount, status, created_at, profiles!transactions_profile_id_fkey(name), projects!transactions_project_id_fkey(name)')
          .eq('transaction_type', 'commerce')
          .in('commerce_type', ['purchase', 'allocation'])
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .then((res: any) => ({ ...res, data: res.data?.map((r: any) => ({ ...r, user_id: r.profile_id, total_amount: r.amount })) }))
          .catch(() => ({ data: [], error: null }))
      ]);

      if (usersResult.error) {
        console.error('Error fetching users:', usersResult.error);
        throw new Error(`Failed to fetch users: ${usersResult.error.message}`);
      }
      if (projectsResult.error) {
        console.error('Error fetching projects:', projectsResult.error);
        throw new Error(`Failed to fetch projects: ${projectsResult.error.message}`);
      }
      if (leadsResult.error) {
        console.error('Error fetching leads:', leadsResult.error);
        throw new Error(`Failed to fetch leads: ${leadsResult.error.message}`);
      }
      // Don't throw error for requests - it's optional
      if (requestsResult && 'error' in requestsResult && requestsResult.error) {
        console.warn('Purchase requests table not available:', requestsResult.error);
      }

      const fetchedUsers: AdminUser[] = (usersResult.data || []).map((u: any) => ({
        id: u.id,
        name: u.name || 'Unknown',
        email: u.email || '',
        role: u.role as UserRole,
        created_at: u.created_at,
      }));

      const fetchedProjects: AdminProject[] = (projectsResult.data || []).map((p: any) => ({
        id: p.id,
        name: typeof p.name === 'object' && p.name !== null && (p.name as any).name 
          ? (p.name as any).name 
          : p.name,
        region: p.region,
        available_leads: p.available_leads ?? 0,
        price_per_lead: p.price_per_lead ?? 0,
        description: p.description,
      }));

      const fetchedRequests: PurchaseRequest[] = (requestsResult && 'data' in requestsResult && requestsResult.data)
        ? requestsResult.data.map((r: any) => ({
            id: r.id,
            user_id: r.user_id,
            project_id: r.project_id,
            quantity: r.quantity,
            total_amount: r.total_amount,
            status: r.status,
            created_at: r.created_at,
            user_name: r.profiles?.name || 'Unknown',
            project_name: r.projects?.name || 'Unknown',
          }))
        : [];

      setUsers(fetchedUsers);
      setProjects(fetchedProjects);
      setRequests(fetchedRequests);
      setStats({
        totalUsers: fetchedUsers.length,
        totalProjects: fetchedProjects.length,
        totalLeads: leadsResult.count || 0,
        pendingRequests: fetchedRequests.length,
      });

      // Subscribe to real-time updates
      const channel = supabase
        .channel('admin-updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
          fetchAllData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
          fetchAllData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: 'transaction_type=eq.payment' }, () => {
          fetchAllData();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.error('Error fetching admin data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  return {
    users,
    projects,
    stats,
    requests,
    loading,
    error,
    refetch: fetchAllData,
  };
}

