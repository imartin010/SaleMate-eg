import { create } from 'zustand';
import { Order, PurchaseRequest, OrderStatus } from '@/shared/types';
import { supabase } from "@/core/api/client"
import { processPayment, calculateTotalAmount } from '../lib/payments';

interface OrderState {
  orders: Order[];
  loading: boolean;
  error: string | null;
  
  fetchOrders: (userId?: string) => Promise<void>;
  createOrder: (request: PurchaseRequest, userId: string) => Promise<{ success: boolean; orderId?: string; error?: string }>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  loading: false,
  error: null,
  
  fetchOrders: async (userId?: string) => {
    set({ loading: true, error: null });
    try {
      console.log('📦 Fetching orders from Supabase...');
      
      let query = supabase
        .from('orders')
        .select(`
          *,
          projects (
            id,
            name,
            developer,
            region
          )
        `)
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data: ordersData, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch orders: ${error.message}`);
      }

      // Transform Supabase data to match Order type
      const transformedOrders: Order[] = ordersData?.map(order => ({
        id: order.id,
        userId: order.user_id,
        projectId: order.project_id,
        quantity: order.quantity,
        paymentMethod: order.payment_method,
        status: (order.status || 'pending') as OrderStatus,
        totalAmount: order.total_amount,
        createdAt: order.created_at || new Date().toISOString()
      })) || [];

      console.log(`✅ Fetched ${transformedOrders.length} orders from Supabase`);
      set({ orders: transformedOrders, loading: false });
      
    } catch (error) {
      console.error('Error fetching orders:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to fetch orders', loading: false });
    }
  },
  
  createOrder: async (request: PurchaseRequest, userId: string) => {
    set({ loading: true, error: null });
    
    try {
      console.log('🛒 Creating order in Supabase...');
      
      // Check project availability
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('available_leads')
        .eq('id', request.projectId)
        .single();

      if (projectError || !project) {
        throw new Error('Project not found');
      }

      if ((project.available_leads || 0) < request.quantity) {
        set({ loading: false, error: 'Insufficient leads available' });
        return { success: false, error: 'Insufficient leads available' };
      }
      
      // Create order in Supabase
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: userId,
          project_id: request.projectId,
          quantity: request.quantity,
          payment_method: request.paymentMethod,
          status: 'pending',
          total_amount: calculateTotalAmount(request.quantity)
        })
        .select()
        .single();

      if (orderError) {
        throw new Error(`Failed to create order: ${orderError.message}`);
      }

      // Process payment (mock implementation)
      const paymentResult = await processPayment(
        request.paymentMethod,
        calculateTotalAmount(request.quantity),
        { orderId: newOrder.id, projectId: request.projectId }
      );
      
      if (!paymentResult.success) {
        // Update order status to failed
        await supabase
          .from('orders')
          .update({ status: 'failed' })
          .eq('id', newOrder.id);

        set({ 
          orders: [...get().orders, {
            id: newOrder.id,
            userId: newOrder.user_id,
            projectId: newOrder.project_id,
            quantity: newOrder.quantity,
            paymentMethod: newOrder.payment_method,
            status: 'failed',
            totalAmount: newOrder.total_amount,
            createdAt: newOrder.created_at || new Date().toISOString()
          }], 
          loading: false, 
          error: paymentResult.error 
        });
        return { success: false, error: paymentResult.error };
      }
      
      // Payment successful - update order status
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'confirmed' })
        .eq('id', newOrder.id);

      if (updateError) {
        console.error('Failed to update order status:', updateError);
      }

      // Update project available leads
      const { error: projectUpdateError } = await supabase
        .from('projects')
        .update({ available_leads: (project.available_leads || 0) - request.quantity })
        .eq('id', request.projectId);

      if (projectUpdateError) {
        console.error('Failed to update project leads:', projectUpdateError);
      }

      // Assign leads to user using the backend function
      try {
        const { error: assignError } = await supabase.rpc('assign_leads_to_user', {
          user_id: userId,
          project_id: request.projectId,
          quantity: request.quantity
        });

        if (assignError) {
          console.error('Failed to assign leads:', assignError);
        }
      } catch (assignErr) {
        console.error('Lead assignment error:', assignErr);
      }

      // Refresh orders to get the updated data
      await get().fetchOrders(userId);
      
      set({ loading: false });
      return { success: true, orderId: newOrder.id };
      
    } catch (error) {
      console.error('Error creating order:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to create order', loading: false });
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create order' };
    }
  },
  
  updateOrderStatus: async (orderId: string, status: Order['status']) => {
    try {
      set({ error: null });
      
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) {
        throw new Error(`Failed to update order status: ${error.message}`);
      }

      // Update local state
      const orders = get().orders.map(o => 
        o.id === orderId ? { ...o, status } : o
      );
      set({ orders });
      
    } catch (error) {
      console.error('Error updating order status:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to update order status' });
    }
  },
}));
