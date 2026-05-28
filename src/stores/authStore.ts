import { create } from 'zustand';
import type { User } from '../types/auth';
import { authService } from '../services/supabase/auth';

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    // In dev mode, useDevSeed already set a mock user — don't overwrite it.
    if (__DEV__) {
      set({ isLoading: false });
      return;
    }
    set({ isLoading: true });
    try {
      const user = await authService.getCurrentUser();
      set({ user, isAuthenticated: !!user, isLoading: false });
      authService.onAuthStateChange((u) => set({ user: u, isAuthenticated: !!u }));
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true });
    try {
      await authService.signInWithEmail(email, password);
      const user = await authService.getCurrentUser();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  signUp: async (email, password, fullName) => {
    set({ isLoading: true });
    try {
      await authService.signUpWithEmail(email, password, fullName);
      set({ isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  signOut: async () => {
    await authService.signOut();
    set({ user: null, isAuthenticated: false });
  },

  resetPassword: (email) => authService.resetPassword(email),
}));
