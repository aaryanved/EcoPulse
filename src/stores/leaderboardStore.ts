import { create } from 'zustand';
import { getGlobalLeaderboard } from '@/services/database';
import type { LeaderboardEntryRow } from '@/types';
import { toISODate } from '@/utils';

interface LeaderboardEntry extends LeaderboardEntryRow {
  user?: { display_name: string | null; avatar_url: string | null; current_streak: number };
}

interface LeaderboardState {
  entries: LeaderboardEntry[];
  isLoading: boolean;
  currentPeriod: string;

  fetchLeaderboard: (period?: string) => Promise<void>;
}

export const useLeaderboardStore = create<LeaderboardState>((set) => ({
  entries: [],
  isLoading: false,
  currentPeriod: toISODate(new Date()).slice(0, 7),

  fetchLeaderboard: async (period) => {
    const activePeriod = period ?? toISODate(new Date()).slice(0, 7);
    set({ isLoading: true, currentPeriod: activePeriod });
    try {
      const entries = await getGlobalLeaderboard(activePeriod);
      // Assign ranks client-side (sorted by carbon_kg ASC from DB)
      const ranked = entries.map((e: LeaderboardEntry, i: number) => ({ ...e, rank: i + 1 }));
      set({ entries: ranked });
    } finally {
      set({ isLoading: false });
    }
  },
}));
