import { useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';

export function useAuth() {
  const { session, user, profile, isLoading, signIn, signUp, signOut, resetPassword, updateProfile } =
    useAuthStore();

  const isAuthenticated = !!session;
  const hasCompletedOnboarding = profile?.onboarding_completed ?? false;

  const login = useCallback(
    async (email: string, password: string) => {
      await signIn(email, password);
    },
    [signIn]
  );

  const register = useCallback(
    async (email: string, password: string, displayName: string) => {
      await signUp(email, password, displayName);
    },
    [signUp]
  );

  const logout = useCallback(async () => {
    await signOut();
  }, [signOut]);

  const forgotPassword = useCallback(
    async (email: string) => {
      await resetPassword(email);
    },
    [resetPassword]
  );

  const saveProfile = useCallback(
    async (updates: Parameters<typeof updateProfile>[0]) => {
      await updateProfile(updates);
    },
    [updateProfile]
  );

  return {
    session,
    user,
    profile,
    isLoading,
    isAuthenticated,
    hasCompletedOnboarding,
    login,
    register,
    logout,
    forgotPassword,
    saveProfile,
  };
}
