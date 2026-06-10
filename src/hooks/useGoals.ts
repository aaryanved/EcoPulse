import { useCallback } from 'react';
import { useGoalStore } from '@/stores/goalStore';
import { useAuthStore } from '@/stores/authStore';
import type { ActivityCategory } from '@/types';

export function useGoals() {
  const { user } = useAuthStore();
  const { goals, isLoading, fetchGoals, addGoal, syncProgress } = useGoalStore();

  const refresh = useCallback(async () => {
    if (user?.id) await fetchGoals(user.id);
  }, [user?.id, fetchGoals]);

  const createGoal = useCallback(
    async (
      title: string,
      category: ActivityCategory | 'overall',
      targetKg: number,
      period: 'weekly' | 'monthly' | 'yearly'
    ) => {
      if (!user?.id) throw new Error('Not authenticated');
      await addGoal(user.id, title, category, targetKg, period);
    },
    [user?.id, addGoal]
  );

  const sync = useCallback(
    async (breakdown: Record<string, number>) => {
      if (!user?.id) return;
      await syncProgress(user.id, breakdown);
    },
    [user?.id, syncProgress]
  );

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');

  return { goals, activeGoals, completedGoals, isLoading, refresh, createGoal, sync };
}
