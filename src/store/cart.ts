import { create } from 'zustand';

export interface CartItem {
  projectId: string;
  projectName: string;
  developer: string;
  region: string;
  pricePerLead: number;
  availableLeads: number;
  image?: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  totalLeads: number;
  totalPrice: number;
  
  // Actions
  addToCart: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  updateQuantity: (projectId: string, quantity: number) => void;
  removeFromCart: (projectId: string) => void;
  clearCart: () => void;
  getCartItem: (projectId: string) => CartItem | undefined;
  canCheckout: () => boolean;
}

const MINIMUM_LEADS = 30;

export const useCartStore = create<CartState>()((set, get) => ({
      items: [],
      totalLeads: 0,
      totalPrice: 0,

      addToCart: (item) => {
        const state = get();
        const existingItem = state.items.find(i => i.projectId === item.projectId);
        
        let newItems: CartItem[];
        
        if (existingItem) {
          // Update existing item
          const newQuantity = item.quantity || existingItem.quantity + 1;
          newItems = state.items.map(i =>
            i.projectId === item.projectId
              ? { ...i, quantity: Math.min(newQuantity, item.availableLeads) }
              : i
          );
        } else {
          // Add new item
          const quantity = item.quantity || Math.min(30, item.availableLeads);
          newItems = [...state.items, { ...item, quantity }];
        }

        // Calculate totals
        const totalLeads = newItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = newItems.reduce((sum, item) => sum + (item.quantity * item.pricePerLead), 0);

        set({ items: newItems, totalLeads, totalPrice });
      },

      updateQuantity: (projectId, quantity) => {
        const state = get();
        const item = state.items.find(i => i.projectId === projectId);
        
        if (!item) return;
        
        // Ensure quantity doesn't exceed available leads
        const newQuantity = Math.min(Math.max(quantity, 0), item.availableLeads);
        
        if (newQuantity === 0) {
          // Remove item if quantity is 0
          get().removeFromCart(projectId);
          return;
        }

        const newItems = state.items.map(i =>
          i.projectId === projectId ? { ...i, quantity: newQuantity } : i
        );

        const totalLeads = newItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = newItems.reduce((sum, item) => sum + (item.quantity * item.pricePerLead), 0);

        set({ items: newItems, totalLeads, totalPrice });
      },

      removeFromCart: (projectId) => {
        const state = get();
        const newItems = state.items.filter(i => i.projectId !== projectId);
        const totalLeads = newItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = newItems.reduce((sum, item) => sum + (item.quantity * item.pricePerLead), 0);

        set({ items: newItems, totalLeads, totalPrice });
      },

      clearCart: () => {
        set({ items: [], totalLeads: 0, totalPrice: 0 });
      },

      getCartItem: (projectId) => {
        return get().items.find(i => i.projectId === projectId);
      },

      canCheckout: () => {
        return get().totalLeads >= MINIMUM_LEADS;
      },
    })
);

export { MINIMUM_LEADS };

