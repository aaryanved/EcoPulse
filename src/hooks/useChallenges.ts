import { useCallback } from 'react';
import { useChallengeStore } from '@/stores/challengeStore';
import { useAuthStore } from '@/stores/authStore';

export function useChallenges() {
  const { user } = useAuthStore();
  const { allChallenges, userChallenges, allBadges, userBadges, isLoading, fetchAll, join, updateProgress } =
    useChallengeStore();

  const refresh = useCallback(async () => {
    if (user?.id) await fetchAll(user.id);
  }, [user?.id, fetchAll]);

  const joinChallenge = useCallback(
    async (challengeId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      await join(user.id, challengeId);
    },
    [user?.id, join]
  );

  const activeChallenges = userChallenges.filter(uc => uc.status === 'active');
  const completedChallenges = userChallenges.filter(uc => uc.status === 'completed');
  const joinedIds = new Set(userChallenges.map(uc => uc.challenge_id));
  const availableChallenges = allChallenges.filter(c => !joinedIds.has(c.id));

  const earnedBadgeIds = new Set(userBadges.map((ub: any) => ub.badge_id));

  return {
    allChallenges,
    userChallenges,
    activeChallenges,
    completedChallenges,
    availableChallenges,
    allBadges,
    userBadges,
    earnedBadgeIds,
    isLoading,
    refresh,
    joinChallenge,
    updateProgress,
  };
}
