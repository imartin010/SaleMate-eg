import { create } from 'zustand';
import { AuthState, User } from '../types';

// Simple auth store without persist middleware
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  
  login: (user: User) => {
    set({ user, isAuthenticated: true });
    // Manual localStorage persistence
    localStorage.setItem('salemate-auth', JSON.stringify({ user, isAuthenticated: true }));
  },
  
  logout: () => {
    set({ user: null, isAuthenticated: false });
    localStorage.removeItem('salemate-auth');
  },
}));

// Initialize from localStorage on startup
const stored = localStorage.getItem('salemate-auth');
if (stored) {
  try {
    const { user, isAuthenticated } = JSON.parse(stored);
    if (user && isAuthenticated) {
      useAuthStore.setState({ user, isAuthenticated });
    }
  } catch (error) {
    console.warn('Failed to restore auth state:', error);
  }
}

