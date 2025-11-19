/**
 * Auth Service Tests
 * 
 * @module features/auth/services/auth.service.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from './auth.service';

// Mock Supabase
vi.mock('@/core/api/client', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      resend: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(),
      single: vi.fn(),
    })),
  },
}));

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signUp', () => {
    it('should sign up a new user', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const { supabase } = await import('@/core/api/client');
      
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null,
      });

      const result = await AuthService.signUp(
        'test@example.com',
        'password123',
        'Test User',
        '+201234567890'
      );

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: { name: 'Test User', phone: '+201234567890' },
        },
      });

      expect(result.user).toEqual(mockUser);
    });

    it('should throw error on sign up failure', async () => {
      const { supabase } = await import('@/core/api/client');
      
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: new Error('Email already exists'),
      });

      await expect(
        AuthService.signUp('test@example.com', 'password123', 'Test User')
      ).rejects.toThrow('Email already exists');
    });
  });

  describe('signIn', () => {
    it('should sign in a user', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const { supabase } = await import('@/core/api/client');
      
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: mockUser, session: { access_token: 'token' } as any },
        error: null,
      });

      const result = await AuthService.signIn('test@example.com', 'password123');

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.user).toEqual(mockUser);
    });

    it('should throw error on invalid credentials', async () => {
      const { supabase } = await import('@/core/api/client');
      
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: new Error('Invalid login credentials'),
      });

      await expect(
        AuthService.signIn('test@example.com', 'wrong-password')
      ).rejects.toThrow('Invalid login credentials');
    });
  });

  describe('signOut', () => {
    it('should sign out user', async () => {
      const { supabase } = await import('@/core/api/client');
      
      vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });

      await AuthService.signOut();

      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
  });

  describe('getCurrentUser', () => {
    it('should get current authenticated user', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const { supabase } = await import('@/core/api/client');
      
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const user = await AuthService.getCurrentUser();

      expect(user).toEqual(mockUser);
    });

    it('should throw error if no user', async () => {
      const { supabase } = await import('@/core/api/client');
      
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: new Error('No user found'),
      });

      await expect(AuthService.getCurrentUser()).rejects.toThrow('No user found');
    });
  });

  describe('resetPassword', () => {
    it('should send password reset email', async () => {
      const { supabase } = await import('@/core/api/client');
      
      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
        data: {},
        error: null,
      });

      await AuthService.resetPassword('test@example.com');

      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('test@example.com');
    });
  });
});

