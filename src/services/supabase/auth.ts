import { supabase } from './client';
import type { User, UserSettings } from '../../types/auth';

const DEFAULT_SETTINGS: UserSettings = {
  navigationMode: 'walking',
  notifyGateChanges: true,
  notifyDelays: true,
  notifyBoarding: true,
  notifyConnectionRisk: true,
  delayThresholdMinutes: 30,
  language: 'en',
  units: 'metric',
};

export const authService = {
  async signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signUpWithEmail(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;

    if (data.user) {
      await supabase.from('user_profiles').insert({
        id: data.user.id,
        email,
        full_name: fullName,
        settings: DEFAULT_SETTINGS,
        preferred_airports: [],
        saved_flights: [],
      });
    }
    return data;
  },

  async signInWithApple() {
    const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'apple' });
    if (error) throw error;
    return data;
  },

  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'airportwaze://reset-password',
    });
    if (error) throw error;
  },

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) return null;

    return {
      id: user.id,
      email: user.email!,
      fullName: profile.full_name ?? undefined,
      avatarUrl: profile.avatar_url ?? undefined,
      preferredAirports: profile.preferred_airports ?? [],
      savedFlights: profile.saved_flights ?? [],
      settings: (profile.settings as UserSettings) ?? DEFAULT_SETTINGS,
      createdAt: new Date(user.created_at),
    };
  },

  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange(async (_, session) => {
      if (session?.user) {
        const user = await authService.getCurrentUser();
        callback(user);
      } else {
        callback(null);
      }
    });
  },
};
