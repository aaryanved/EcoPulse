import { create } from 'zustand';
import { getUserGoals, createGoal, updateGoalProgress } from '@/services/database';
import type { GoalRow, GoalInsert, ActivityCategory } from '@/types';
import { toISODate } from '@/utils';

interface GoalState {
  goals: GoalRow[];
  isLoading: boolean;

  fetchGoals: (userId: string) => Promise<void>;
  addGoal: (
    userId: string,
    title: string,
    category: ActivityCategory | 'overall',
    targetKg: number,
    period: 'weekly' | 'monthly' | 'yearly'
  ) => Promise<void>;
  syncProgress: (userId: string, categoryBreakdown: Record<string, number>) => Promise<void>;
}

export const useGoalStore = create<GoalState>((set, get) => ({
  goals: [],
  isLoading: false,

  fetchGoals: async (userId) => {
    set({ isLoading: true });
    try {
      const goals = await getUserGoals(userId);
      set({ goals });
    } finally {
      set({ isLoading: false });
    }
  },

  addGoal: async (userId, title, category, targetKg, period) => {
    const now = new Date();
    let endDate: Date;
    switch (period) {
      case 'weekly':
        endDate = new Date(now.getTime() + 7 * 86400000);
        break;
      case 'monthly':
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
        break;
      case 'yearly':
        endDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
        break;
    }

    const goalData: GoalInsert = {
      user_id: userId,
      title,
      category,
      target_carbon_kg: targetKg,
      current_carbon_kg: 0,
      period,
      start_date: toISODate(now),
      end_date: toISODate(endDate),
      status: 'active',
    };

    const goal = await createGoal(goalData);
    set(state => ({ goals: [goal, ...state.goals] }));
  },

  syncProgress: async (userId, categoryBreakdown) => {
    const { goals } = get();
    await Promise.all(
      goals.map(async goal => {
        const currentKg =
          goal.category === 'overall'
            ? Object.values(categoryBreakdown).reduce((a, b) => a + b, 0)
            : (categoryBreakdown[goal.category] ?? 0);

        if (Math.abs(currentKg - goal.current_carbon_kg) > 0.01) {
          await updateGoalProgress(goal.id, currentKg);
          set(state => ({
            goals: state.goals.map(g =>
              g.id === goal.id
                ? { ...g, current_carbon_kg: currentKg, status: currentKg >= g.target_carbon_kg ? 'completed' : 'active' }
                : g
            ),
          }));
        }
      })
    );
  },
}));
