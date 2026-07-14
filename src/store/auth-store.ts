// ============================================================
// BuildAI Studio — Auth Store
// Supabase Authentication Integration
// ============================================================

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  resetPassword: (email: string, redirectTo: string) => Promise<boolean>;
  updatePassword: (password: string) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        set({ error: error.message, isLoading: false, isAuthenticated: false });
        return false;
      }
      const user = data.user;
      if (user) {
        set({
          user: {
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          },
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return true;
      }
      set({ isLoading: false, isAuthenticated: false });
      return false;
    } catch (e: any) {
      set({ error: e.message || 'An unexpected error occurred during sign in.', isLoading: false });
      return false;
    }
  },

  signUp: async (email: string, password: string, name: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });
      if (error) {
        set({ error: error.message, isLoading: false });
        return false;
      }
      const user = data.user;
      if (user) {
        set({
          user: {
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.name || name || 'User',
          },
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return true;
      }
      set({ isLoading: false });
      return false;
    } catch (e: any) {
      set({ error: e.message || 'An unexpected error occurred during sign up.', isLoading: false });
      return false;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Error during sign out:', e);
    } finally {
      set({ user: null, isAuthenticated: false, error: null, isLoading: false });
    }
  },

  checkSession: async () => {
    set({ isLoading: true });
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session?.user) {
        const user = session.user;
        set({
          user: {
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          },
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch (e) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  resetPassword: async (email: string, redirectTo: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) {
        set({ error: error.message, isLoading: false });
        return false;
      }
      set({ isLoading: false, error: null });
      return true;
    } catch (e: any) {
      set({ error: e.message || 'An unexpected error occurred.', isLoading: false });
      return false;
    }
  },

  updatePassword: async (password: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        set({ error: error.message, isLoading: false });
        return false;
      }
      set({ isLoading: false, error: null });
      return true;
    } catch (e: any) {
      set({ error: e.message || 'An unexpected error occurred.', isLoading: false });
      return false;
    }
  },
}));
