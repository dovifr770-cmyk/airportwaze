import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';

export function useAuth() {
  const store = useAuthStore();

  useEffect(() => {
    store.initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    user:            store.user,
    isLoading:       store.isLoading,
    isAuthenticated: store.isAuthenticated,
    signIn:          store.signIn,
    signUp:          store.signUp,
    signOut:         store.signOut,
    resetPassword:   store.resetPassword,
  };
}
