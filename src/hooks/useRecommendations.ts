import { useCallback } from 'react';
import { useRecommendationStore } from '@/stores/recommendationStore';
import { useAuthStore } from '@/stores/authStore';
import type { CarbonBreakdown } from '@/types';

export function useRecommendations() {
  const { user, profile } = useAuthStore();
  const {
    recommendations,
    isLoading,
    isGenerating,
    fetchRecommendations,
    generateWeeklyReport,
    generateReductionPlan,
    markRead,
    dismiss,
  } = useRecommendationStore();

  const refresh = useCallback(async () => {
    if (user?.id) await fetchRecommendations(user.id);
  }, [user?.id, fetchRecommendations]);

  const requestWeeklyReport = useCallback(
    async (current: CarbonBreakdown, previous: CarbonBreakdown) => {
      if (!user?.id) throw new Error('Not authenticated');
      await generateWeeklyReport(user.id, profile ?? {}, current, previous);
    },
    [user?.id, profile, generateWeeklyReport]
  );

  const requestReductionPlan = useCallback(
    async (breakdown: CarbonBreakdown, targetPercent: number) => {
      if (!user?.id) throw new Error('Not authenticated');
      await generateReductionPlan(user.id, profile ?? {}, breakdown, targetPercent);
    },
    [user?.id, profile, generateReductionPlan]
  );

  return {
    recommendations,
    isLoading,
    isGenerating,
    refresh,
    requestWeeklyReport,
    requestReductionPlan,
    markRead,
    dismiss,
  };
}
