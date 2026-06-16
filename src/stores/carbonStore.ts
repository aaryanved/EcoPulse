import { create } from 'zustand';
import { supabase } from '@/services/supabase';
import { updateStreak, upsertLeaderboardEntry, checkAndAwardBadges } from '@/services/database';
import type { ActivityRow, CarbonEntryRow, ActivityCategory, CarbonBreakdown } from '@/types';
import { buildCarbonBreakdown, toISODate, getMonthRange } from '@/utils';

interface CarbonState {
  entries: CarbonEntryRow[];
  activities: ActivityRow[];
  currentMonthBreakdown: CarbonBreakdown;
  previousMonthBreakdown: CarbonBreakdown;
  isLoading: boolean;
  selectedMonth: Date;

  fetchMonthData: (userId: string, month?: Date) => Promise<void>;
  logActivity: (
    userId: string,
    category: ActivityCategory,
    subcategory: string,
    description: string,
    carbonKg: number,
    metadata?: Record<string, unknown>
  ) => Promise<void>;
  deleteActivity: (activityId: string) => Promise<void>;
  setSelectedMonth: (month: Date) => void;
}

export const useCarbonStore = create<CarbonState>((set, get) => ({
  entries: [],
  activities: [],
  currentMonthBreakdown: { transport: 0, food: 0, electricity: 0, purchases: 0, waste: 0, other: 0, total: 0 },
  previousMonthBreakdown: { transport: 0, food: 0, electricity: 0, purchases: 0, waste: 0, other: 0, total: 0 },
  isLoading: false,
  selectedMonth: new Date(),

  fetchMonthData: async (userId, month = new Date()) => {
    set({ isLoading: true });
    try {
      const { start, end } = getMonthRange(month);
      const prevMonth = new Date(month.getFullYear(), month.getMonth() - 1, 1);
      const { start: prevStart, end: prevEnd } = getMonthRange(prevMonth);

      const db = supabase as any;
      const [currentResult, previousResult] = await Promise.all([
        db
          .from('activities')
          .select('*')
          .eq('user_id', userId)
          .gte('activity_date', toISODate(start))
          .lte('activity_date', toISODate(end))
          .order('activity_date', { ascending: false }),
        db
          .from('activities')
          .select('*')
          .eq('user_id', userId)
          .gte('activity_date', toISODate(prevStart))
          .lte('activity_date', toISODate(prevEnd)),
      ]);

      if (currentResult.error) throw currentResult.error;
      if (previousResult.error) throw previousResult.error;

      const activities = currentResult.data ?? [];
      const previousActivities = previousResult.data ?? [];

      set({
        activities,
        currentMonthBreakdown: buildCarbonBreakdown(activities),
        previousMonthBreakdown: buildCarbonBreakdown(previousActivities),
      });
    } finally {
      set({ isLoading: false });
    }
  },

  logActivity: async (userId, category, subcategory, description, carbonKg, metadata = {}) => {
    const { error } = await (supabase as any).from('activities').insert({
      user_id: userId,
      category,
      subcategory,
      description,
      carbon_kg: carbonKg,
      metadata: metadata as Record<string, unknown>,
      activity_date: toISODate(new Date()),
    });

    if (error) throw error;

    const { activities } = get();
    const newActivity: ActivityRow = {
      id: crypto.randomUUID(),
      user_id: userId,
      category,
      subcategory,
      description,
      carbon_kg: carbonKg,
      metadata: metadata as import('@/types').Json,
      activity_date: toISODate(new Date()),
      created_at: new Date().toISOString(),
    };

    const updated = [newActivity, ...activities];
    const newBreakdown = buildCarbonBreakdown(updated);

    set({ activities: updated, currentMonthBreakdown: newBreakdown });

    // Fire-and-forget side effects: streak, leaderboard, badges
    const period = toISODate(new Date()).slice(0, 7); // YYYY-MM
    void Promise.all([
      updateStreak(userId).catch(() => {}),
      upsertLeaderboardEntry(userId, period, newBreakdown.total, 0).catch(() => {}),
      checkAndAwardBadges(userId).catch(() => {}),
    ]);
  },

  deleteActivity: async (activityId) => {
    const { error } = await (supabase as any).from('activities').delete().eq('id', activityId);
    if (error) throw error;

    const updated = get().activities.filter(a => a.id !== activityId);
    set({
      activities: updated,
      currentMonthBreakdown: buildCarbonBreakdown(updated),
    });
  },

  setSelectedMonth: (month) => set({ selectedMonth: month }),
}));
