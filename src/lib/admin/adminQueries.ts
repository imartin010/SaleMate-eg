import { supabase } from '../supabaseClient';
import { UserRole } from '../../types';

export async function updateUserRole(userId: string, newRole: UserRole): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId);

  if (error) {
    throw new Error(`Failed to update user role: ${error.message}`);
  }
}

export async function createProject(projectData: {
  name: string;
  region: string;
  available_leads: number;
  price_per_lead: number;
  description?: string;
}): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .insert([projectData]);

  if (error) {
    throw new Error(`Failed to create project: ${error.message}`);
  }
}

export async function updateProject(
  projectId: string,
  updates: Partial<{
    name: string;
    region: string;
    available_leads: number;
    price_per_lead: number;
    description: string;
  }>
): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId);

  if (error) {
    throw new Error(`Failed to update project: ${error.message}`);
  }
}

export async function deleteProject(projectId: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) {
    throw new Error(`Failed to delete project: ${error.message}`);
  }
}

export async function approvePurchaseRequest(requestId: string): Promise<void> {
  const { error } = await supabase
    .from('lead_purchase_requests')
    .update({ status: 'approved' })
    .eq('id', requestId);

  if (error) {
    throw new Error(`Failed to approve request: ${error.message}`);
  }
}

export async function rejectPurchaseRequest(requestId: string): Promise<void> {
  const { error } = await supabase
    .from('lead_purchase_requests')
    .update({ status: 'rejected' })
    .eq('id', requestId);

  if (error) {
    throw new Error(`Failed to reject request: ${error.message}`);
  }
}

export async function deleteUser(userId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId);

  if (error) {
    throw new Error(`Failed to delete user: ${error.message}`);
  }
}

