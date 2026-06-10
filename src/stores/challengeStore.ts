import { create } from 'zustand';
import {
  getAllChallenges,
  getUserChallenges,
  joinChallenge,
  updateChallengeProgress,
  getAllBadges,
  getUserBadges,
} from '@/services/database';
import type { ChallengeRow, UserChallengeRow, BadgeRow, UserBadgeRow } from '@/types';

interface ChallengeWithDetails extends UserChallengeRow {
  challenge?: ChallengeRow;
}

interface ChallengeState {
  allChallenges: ChallengeRow[];
  userChallenges: ChallengeWithDetails[];
  allBadges: BadgeRow[];
  userBadges: UserBadgeRow[];
  isLoading: boolean;

  fetchAll: (userId: string) => Promise<void>;
  join: (userId: string, challengeId: string) => Promise<void>;
  updateProgress: (
    userChallengeId: string,
    progress: number,
    status: 'active' | 'completed' | 'failed'
  ) => Promise<void>;
}

export const useChallengeStore = create<ChallengeState>((set, get) => ({
  allChallenges: [],
  userChallenges: [],
  allBadges: [],
  userBadges: [],
  isLoading: false,

  fetchAll: async (userId) => {
    set({ isLoading: true });
    try {
      const [allChallenges, userChallenges, allBadges, userBadges] = await Promise.all([
        getAllChallenges(),
        getUserChallenges(userId),
        getAllBadges(),
        getUserBadges(userId),
      ]);
      set({ allChallenges, userChallenges, allBadges, userBadges });
    } finally {
      set({ isLoading: false });
    }
  },

  join: async (userId, challengeId) => {
    const entry = await joinChallenge(userId, challengeId);
    const { allChallenges, userChallenges } = get();
    const challenge = allChallenges.find(c => c.id === challengeId);
    set({
      userChallenges: [{ ...entry, challenge }, ...userChallenges],
    });
  },

  updateProgress: async (userChallengeId, progress, status) => {
    await updateChallengeProgress(userChallengeId, progress, status);
    set(state => ({
      userChallenges: state.userChallenges.map(uc =>
        uc.id === userChallengeId
          ? {
              ...uc,
              progress,
              status,
              completed_at: status === 'completed' ? new Date().toISOString() : uc.completed_at,
            }
          : uc
      ),
    }));
  },
}));
