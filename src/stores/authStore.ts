import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';
import type { UserRow } from '@/types';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: UserRow | null;
  isLoading: boolean;
  isInitialized: boolean;

  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<UserRow>) => Promise<void>;
  fetchProfile: (userId: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      set({ session, user: session?.user ?? null });

      if (session?.user) {
        await get().fetchProfile(session.user.id).catch(() => {});
      }

      supabase.auth.onAuthStateChange(async (event, session) => {
        set({ session, user: session?.user ?? null });

        if (session?.user) {
          await get().fetchProfile(session.user.id).catch(() => {});
        } else {
          set({ profile: null });
        }
      });
    } catch {
      // Auth init failure — still unblock the app so the login screen renders
    } finally {
      set({ isInitialized: true });
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  signUp: async (email, password, displayName) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      if (data.user) {
        const { error: profileError } = await (supabase as any).from('users').insert({
          id: data.user.id,
          email,
          display_name: displayName,
          onboarding_completed: false,
          monthly_carbon_goal: 200,
          current_streak: 0,
          longest_streak: 0,
          total_carbon_saved: 0,
          country_code: 'US',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          notifications_enabled: true,
          weekly_report_enabled: true,
        });

        if (profileError) throw profileError;
      }
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ session: null, user: null, profile: null });
    } finally {
      set({ isLoading: false });
    }
  },

  resetPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'ecopulse://reset-password',
    });
    if (error) throw error;
  },

  fetchProfile: async (userId) => {
    const { data, error } = await (supabase as any)
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    if (data) set({ profile: data as UserRow });
  },

  updateProfile: async (updates) => {
    const userId = get().user?.id;
    const userEmail = get().user?.email;
    if (!userId) throw new Error('Not authenticated');

    const { data, error } = await (supabase as any)
      .from('users')
      .upsert({
        id: userId,
        email: userEmail ?? '',
        ...updates,
      })
      .select()
      .single();

    if (error) throw error;
    set({ profile: data as UserRow });
  },
}));
