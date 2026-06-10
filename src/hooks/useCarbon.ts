import { useCallback } from 'react';
import { useCarbonStore } from '@/stores/carbonStore';
import { useAuthStore } from '@/stores/authStore';
import type { ActivityCategory } from '@/types';

export function useCarbon() {
  const { user } = useAuthStore();
  const {
    activities,
    currentMonthBreakdown,
    previousMonthBreakdown,
    isLoading,
    selectedMonth,
    fetchMonthData,
    logActivity,
    deleteActivity,
    setSelectedMonth,
  } = useCarbonStore();

  const refresh = useCallback(async () => {
    if (user?.id) {
      await fetchMonthData(user.id, selectedMonth);
    }
  }, [user?.id, fetchMonthData, selectedMonth]);

  const log = useCallback(
    async (
      category: ActivityCategory,
      subcategory: string,
      description: string,
      carbonKg: number,
      metadata?: Record<string, unknown>
    ) => {
      if (!user?.id) throw new Error('Not authenticated');
      await logActivity(user.id, category, subcategory, description, carbonKg, metadata);
    },
    [user?.id, logActivity]
  );

  const remove = useCallback(
    async (activityId: string) => {
      await deleteActivity(activityId);
    },
    [deleteActivity]
  );

  const reductionVsPrevious =
    previousMonthBreakdown.total > 0
      ? ((previousMonthBreakdown.total - currentMonthBreakdown.total) / previousMonthBreakdown.total) * 100
      : 0;

  return {
    activities,
    currentMonthBreakdown,
    previousMonthBreakdown,
    isLoading,
    selectedMonth,
    reductionVsPrevious,
    refresh,
    log,
    remove,
    setSelectedMonth,
  };
}
