import { supabase } from './supabase';
import type {
  UserRow,
  ActivityRow,
  ChallengeRow,
  UserChallengeRow,
  BadgeRow,
  UserBadgeRow,
  GoalRow,
  GoalInsert,
  AIRecommendationRow,
  LeaderboardEntryRow,
  RecommendationType,
  ActivityCategory,
} from '@/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// ─── User ───────────────────────────────────────────────────────────────────

export async function getUser(userId: string): Promise<UserRow> {
  const { data, error } = await db.from('users').select('*').eq('id', userId).single();
  if (error) throw error;
  return data;
}

export async function updateUser(userId: string, updates: Partial<UserRow>): Promise<UserRow> {
  const { data, error } = await db
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Streak ──────────────────────────────────────────────────────────────────

export async function updateStreak(userId: string): Promise<void> {
  const { data: user, error } = await db
    .from('users')
    .select('current_streak, longest_streak, updated_at')
    .eq('id', userId)
    .single();
  if (error) throw error;

  const lastUpdate = new Date(user.updated_at);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - lastUpdate.getTime()) / 86400000);

  let newStreak = user.current_streak;
  if (daysDiff === 0) return; // Already logged today
  if (daysDiff === 1) {
    newStreak = user.current_streak + 1;
  } else {
    newStreak = 1; // Streak broken
  }

  const newLongest = Math.max(newStreak, user.longest_streak);
  await db.from('users').update({ current_streak: newStreak, longest_streak: newLongest }).eq('id', userId);
}

// ─── Activities ───────────────────────────────────────────────────────────────

export async function getActivitiesForPeriod(
  userId: string,
  startDate: string,
  endDate: string
): Promise<ActivityRow[]> {
  const { data, error } = await db
    .from('activities')
    .select('*')
    .eq('user_id', userId)
    .gte('activity_date', startDate)
    .lte('activity_date', endDate)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ─── Challenges ───────────────────────────────────────────────────────────────

export async function getAllChallenges(): Promise<ChallengeRow[]> {
  const { data, error } = await db
    .from('challenges')
    .select('*')
    .eq('is_active', true)
    .order('difficulty');
  if (error) throw error;
  return data ?? [];
}

export async function getUserChallenges(userId: string): Promise<UserChallengeRow[]> {
  const { data, error } = await db
    .from('user_challenges')
    .select('*, challenge:challenges(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function joinChallenge(userId: string, challengeId: string): Promise<UserChallengeRow> {
  const { data, error } = await db
    .from('user_challenges')
    .insert({ user_id: userId, challenge_id: challengeId, status: 'active', progress: 0 })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateChallengeProgress(
  userChallengeId: string,
  progress: number,
  status: 'active' | 'completed' | 'failed'
): Promise<void> {
  const updates: Record<string, unknown> = { progress, status };
  if (status === 'completed') updates.completed_at = new Date().toISOString();
  const { error } = await db.from('user_challenges').update(updates).eq('id', userChallengeId);
  if (error) throw error;
}

// ─── Badges ───────────────────────────────────────────────────────────────────

export async function getAllBadges(): Promise<BadgeRow[]> {
  const { data, error } = await db.from('badges').select('*').order('rarity');
  if (error) throw error;
  return data ?? [];
}

export async function getUserBadges(userId: string): Promise<UserBadgeRow[]> {
  const { data, error } = await db
    .from('user_badges')
    .select('*, badge:badges(*)')
    .eq('user_id', userId)
    .order('earned_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function awardBadge(userId: string, badgeId: string): Promise<void> {
  const { error } = await db
    .from('user_badges')
    .insert({ user_id: userId, badge_id: badgeId });
  if (error && error.code !== '23505') throw error; // Ignore duplicate
}

export async function checkAndAwardBadges(userId: string): Promise<void> {
  const [user, badges, userBadges, activities] = await Promise.all([
    getUser(userId),
    getAllBadges(),
    getUserBadges(userId),
    getActivitiesForPeriod(userId, '2020-01-01', new Date().toISOString().split('T')[0]),
  ]);

  const earned = new Set(userBadges.map((ub: UserBadgeRow) => ub.badge_id));

  for (const badge of badges) {
    if (earned.has(badge.id)) continue;

    let qualifies = false;
    switch (badge.requirement_type) {
      case 'activities_logged':
        qualifies = activities.length >= badge.requirement_value;
        break;
      case 'tracking_streak':
        qualifies = user.current_streak >= badge.requirement_value;
        break;
      case 'transit_streak':
        qualifies =
          activities.filter((a: ActivityRow) =>
            a.category === 'transport' && a.subcategory?.toLowerCase().includes('transit')
          ).length >= badge.requirement_value;
        break;
    }

    if (qualifies) {
      await awardBadge(userId, badge.id);
    }
  }
}

// ─── Goals ───────────────────────────────────────────────────────────────────

export async function getUserGoals(userId: string): Promise<GoalRow[]> {
  const { data, error } = await db
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createGoal(goal: GoalInsert): Promise<GoalRow> {
  const { data, error } = await db.from('goals').insert(goal).select().single();
  if (error) throw error;
  return data;
}

export async function updateGoalProgress(goalId: string, currentKg: number): Promise<void> {
  const { data: goal, error: fetchError } = await db
    .from('goals')
    .select('target_carbon_kg')
    .eq('id', goalId)
    .single();
  if (fetchError) throw fetchError;

  const status = currentKg >= goal.target_carbon_kg ? 'completed' : 'active';
  const { error } = await db
    .from('goals')
    .update({ current_carbon_kg: currentKg, status })
    .eq('id', goalId);
  if (error) throw error;
}

// ─── AI Recommendations ───────────────────────────────────────────────────────

export async function getUnreadRecommendations(userId: string): Promise<AIRecommendationRow[]> {
  const { data, error } = await db
    .from('ai_recommendations')
    .select('*')
    .eq('user_id', userId)
    .eq('is_read', false)
    .eq('is_dismissed', false)
    .order('generated_at', { ascending: false })
    .limit(5);
  if (error) throw error;
  return data ?? [];
}

export async function saveRecommendation(
  userId: string,
  type: RecommendationType,
  title: string,
  content: string,
  potentialSavingsKg = 0,
  category?: ActivityCategory
): Promise<AIRecommendationRow> {
  const { data, error } = await db
    .from('ai_recommendations')
    .insert({
      user_id: userId,
      type,
      title,
      content,
      potential_savings_kg: potentialSavingsKg,
      category: category ?? null,
      generated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function markRecommendationRead(id: string): Promise<void> {
  const { error } = await db.from('ai_recommendations').update({ is_read: true }).eq('id', id);
  if (error) throw error;
}

export async function dismissRecommendation(id: string): Promise<void> {
  const { error } = await db.from('ai_recommendations').update({ is_dismissed: true }).eq('id', id);
  if (error) throw error;
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

export async function getGlobalLeaderboard(period: string, limit = 50): Promise<LeaderboardEntryRow[]> {
  const { data, error } = await db
    .from('leaderboard_entries')
    .select('*, user:users(display_name, avatar_url, current_streak)')
    .eq('scope', 'global')
    .eq('period', period)
    .order('carbon_kg', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function upsertLeaderboardEntry(
  userId: string,
  period: string,
  carbonKg: number,
  reductionPercentage: number
): Promise<void> {
  const { error } = await db.from('leaderboard_entries').upsert({
    user_id: userId,
    scope: 'global',
    period,
    carbon_kg: carbonKg,
    reduction_percentage: reductionPercentage,
  }, { onConflict: 'user_id,scope,period' });
  if (error) throw error;
}

export const databaseService = {
  getUser,
  updateUser,
  updateStreak,
  getActivitiesForPeriod,
  getAllChallenges,
  getUserChallenges,
  joinChallenge,
  updateChallengeProgress,
  getAllBadges,
  getUserBadges,
  awardBadge,
  checkAndAwardBadges,
  getUserGoals,
  createGoal,
  updateGoalProgress,
  getUnreadRecommendations,
  saveRecommendation,
  markRecommendationRead,
  dismissRecommendation,
  getGlobalLeaderboard,
  upsertLeaderboardEntry,
};
