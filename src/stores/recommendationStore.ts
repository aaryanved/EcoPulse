import { create } from 'zustand';
import {
  getUnreadRecommendations,
  saveRecommendation,
  markRecommendationRead,
  dismissRecommendation,
} from '@/services/database';
import { generateWeeklyReport, generateReductionPlan } from '@/services/gemini';
import type { AIRecommendationRow, CarbonBreakdown, UserRow } from '@/types';

interface RecommendationState {
  recommendations: AIRecommendationRow[];
  isLoading: boolean;
  isGenerating: boolean;

  fetchRecommendations: (userId: string) => Promise<void>;
  generateWeeklyReport: (
    userId: string,
    userProfile: Partial<UserRow>,
    current: CarbonBreakdown,
    previous: CarbonBreakdown
  ) => Promise<void>;
  generateReductionPlan: (
    userId: string,
    userProfile: Partial<UserRow>,
    breakdown: CarbonBreakdown,
    targetPercent: number
  ) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  dismiss: (id: string) => Promise<void>;
}

export const useRecommendationStore = create<RecommendationState>((set, get) => ({
  recommendations: [],
  isLoading: false,
  isGenerating: false,

  fetchRecommendations: async (userId) => {
    set({ isLoading: true });
    try {
      const recs = await getUnreadRecommendations(userId);
      set({ recommendations: recs });
    } finally {
      set({ isLoading: false });
    }
  },

  generateWeeklyReport: async (userId, userProfile, current, previous) => {
    set({ isGenerating: true });
    try {
      const content = await generateWeeklyReport(userProfile, current, previous);
      const rec = await saveRecommendation(
        userId,
        'weekly_report',
        'Your Weekly Sustainability Report',
        content,
        Math.max(0, previous.total - current.total)
      );
      set(state => ({ recommendations: [rec, ...state.recommendations] }));
    } finally {
      set({ isGenerating: false });
    }
  },

  generateReductionPlan: async (userId, userProfile, breakdown, targetPercent) => {
    set({ isGenerating: true });
    try {
      const content = await generateReductionPlan(userProfile, breakdown, targetPercent);
      const rec = await saveRecommendation(
        userId,
        'goal',
        `${targetPercent}% Carbon Reduction Plan`,
        content,
        (breakdown.total * targetPercent) / 100
      );
      set(state => ({ recommendations: [rec, ...state.recommendations] }));
    } finally {
      set({ isGenerating: false });
    }
  },

  markRead: async (id) => {
    await markRecommendationRead(id);
    set(state => ({
      recommendations: state.recommendations.filter(r => r.id !== id),
    }));
  },

  dismiss: async (id) => {
    await dismissRecommendation(id);
    set(state => ({
      recommendations: state.recommendations.filter(r => r.id !== id),
    }));
  },
}));
