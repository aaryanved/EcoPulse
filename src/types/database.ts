export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: UserRow;
        Insert: UserInsert;
        Update: UserUpdate;
      };
      activities: {
        Row: ActivityRow;
        Insert: ActivityInsert;
        Update: ActivityUpdate;
      };
      carbon_entries: {
        Row: CarbonEntryRow;
        Insert: CarbonEntryInsert;
        Update: CarbonEntryUpdate;
      };
      challenges: {
        Row: ChallengeRow;
        Insert: ChallengeInsert;
        Update: ChallengeUpdate;
      };
      user_challenges: {
        Row: UserChallengeRow;
        Insert: UserChallengeInsert;
        Update: UserChallengeUpdate;
      };
      badges: {
        Row: BadgeRow;
        Insert: BadgeInsert;
        Update: BadgeUpdate;
      };
      user_badges: {
        Row: UserBadgeRow;
        Insert: UserBadgeInsert;
        Update: UserBadgeUpdate;
      };
      goals: {
        Row: GoalRow;
        Insert: GoalInsert;
        Update: GoalUpdate;
      };
      ai_recommendations: {
        Row: AIRecommendationRow;
        Insert: AIRecommendationInsert;
        Update: AIRecommendationUpdate;
      };
      receipts: {
        Row: ReceiptRow;
        Insert: ReceiptInsert;
        Update: ReceiptUpdate;
      };
      leaderboard_entries: {
        Row: LeaderboardEntryRow;
        Insert: LeaderboardEntryInsert;
        Update: LeaderboardEntryUpdate;
      };
    };
  };
}

export interface UserRow {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  onboarding_completed: boolean;
  transport_mode: TransportMode | null;
  diet_type: DietType | null;
  energy_source: EnergySource | null;
  shopping_frequency: ShoppingFrequency | null;
  monthly_carbon_goal: number;
  current_streak: number;
  longest_streak: number;
  total_carbon_saved: number;
  country_code: string;
  timezone: string;
  notifications_enabled: boolean;
  weekly_report_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export type UserInsert = Omit<UserRow, 'created_at' | 'updated_at'>;
export type UserUpdate = Partial<UserInsert>;

export interface ActivityRow {
  id: string;
  user_id: string;
  category: ActivityCategory;
  subcategory: string;
  description: string;
  carbon_kg: number;
  metadata: Json;
  activity_date: string;
  created_at: string;
}

export type ActivityInsert = Omit<ActivityRow, 'id' | 'created_at'>;
export type ActivityUpdate = Partial<ActivityInsert>;

export interface CarbonEntryRow {
  id: string;
  user_id: string;
  activity_id: string | null;
  category: ActivityCategory;
  carbon_kg: number;
  source: CarbonSource;
  climatiq_factor_id: string | null;
  entry_date: string;
  created_at: string;
}

export type CarbonEntryInsert = Omit<CarbonEntryRow, 'id' | 'created_at'>;
export type CarbonEntryUpdate = Partial<CarbonEntryInsert>;

export interface ChallengeRow {
  id: string;
  title: string;
  description: string;
  category: ActivityCategory;
  target_value: number;
  target_unit: string;
  duration_days: number;
  reward_points: number;
  badge_id: string | null;
  icon: string;
  difficulty: ChallengeDifficulty;
  is_active: boolean;
  created_at: string;
}

export type ChallengeInsert = Omit<ChallengeRow, 'id' | 'created_at'>;
export type ChallengeUpdate = Partial<ChallengeInsert>;

export interface UserChallengeRow {
  id: string;
  user_id: string;
  challenge_id: string;
  status: ChallengeStatus;
  progress: number;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

export type UserChallengeInsert = Omit<UserChallengeRow, 'id' | 'created_at'>;
export type UserChallengeUpdate = Partial<UserChallengeInsert>;

export interface BadgeRow {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  requirement_type: string;
  requirement_value: number;
  rarity: BadgeRarity;
  created_at: string;
}

export type BadgeInsert = Omit<BadgeRow, 'id' | 'created_at'>;
export type BadgeUpdate = Partial<BadgeInsert>;

export interface UserBadgeRow {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
}

export type UserBadgeInsert = Omit<UserBadgeRow, 'id'>;
export type UserBadgeUpdate = Partial<UserBadgeInsert>;

export interface GoalRow {
  id: string;
  user_id: string;
  title: string;
  category: ActivityCategory | 'overall';
  target_carbon_kg: number;
  current_carbon_kg: number;
  period: GoalPeriod;
  start_date: string;
  end_date: string;
  status: GoalStatus;
  created_at: string;
  updated_at: string;
}

export type GoalInsert = Omit<GoalRow, 'id' | 'created_at' | 'updated_at'>;
export type GoalUpdate = Partial<GoalInsert>;

export interface AIRecommendationRow {
  id: string;
  user_id: string;
  type: RecommendationType;
  title: string;
  content: string;
  potential_savings_kg: number;
  category: ActivityCategory | null;
  is_read: boolean;
  is_dismissed: boolean;
  generated_at: string;
  created_at: string;
}

export type AIRecommendationInsert = Omit<AIRecommendationRow, 'id' | 'created_at'>;
export type AIRecommendationUpdate = Partial<AIRecommendationInsert>;

export interface ReceiptRow {
  id: string;
  user_id: string;
  image_url: string;
  ocr_text: string | null;
  extracted_items: Json;
  total_carbon_kg: number;
  status: ReceiptStatus;
  merchant_name: string | null;
  receipt_date: string | null;
  created_at: string;
}

export type ReceiptInsert = Omit<ReceiptRow, 'id' | 'created_at'>;
export type ReceiptUpdate = Partial<ReceiptInsert>;

export interface LeaderboardEntryRow {
  id: string;
  user_id: string;
  scope: LeaderboardScope;
  scope_id: string | null;
  period: string;
  carbon_kg: number;
  rank: number | null;
  reduction_percentage: number;
  created_at: string;
}

export type LeaderboardEntryInsert = Omit<LeaderboardEntryRow, 'id' | 'created_at'>;
export type LeaderboardEntryUpdate = Partial<LeaderboardEntryInsert>;

// Enums
export type ActivityCategory = 'transport' | 'food' | 'electricity' | 'purchases' | 'waste' | 'other';
export type TransportMode = 'car' | 'public_transit' | 'cycling' | 'walking' | 'mixed';
export type DietType = 'omnivore' | 'flexitarian' | 'vegetarian' | 'vegan';
export type EnergySource = 'grid' | 'solar' | 'wind' | 'mixed_renewable' | 'unknown';
export type ShoppingFrequency = 'rarely' | 'monthly' | 'weekly' | 'daily';
export type CarbonSource = 'climatiq' | 'electricity_maps' | 'iata' | 'manual' | 'ai_estimate';
export type ChallengeDifficulty = 'easy' | 'medium' | 'hard' | 'expert';
export type ChallengeStatus = 'active' | 'completed' | 'failed' | 'abandoned';
export type BadgeCategory = 'transport' | 'food' | 'energy' | 'social' | 'streak' | 'milestone';
export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type GoalPeriod = 'weekly' | 'monthly' | 'yearly';
export type GoalStatus = 'active' | 'completed' | 'failed';
export type RecommendationType = 'weekly_report' | 'tip' | 'challenge' | 'goal' | 'alert';
export type ReceiptStatus = 'processing' | 'completed' | 'failed';
export type LeaderboardScope = 'global' | 'friends' | 'school' | 'company';
