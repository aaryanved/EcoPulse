-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  transport_mode TEXT CHECK (transport_mode IN ('car', 'public_transit', 'cycling', 'walking', 'mixed')),
  diet_type TEXT CHECK (diet_type IN ('omnivore', 'flexitarian', 'vegetarian', 'vegan')),
  energy_source TEXT CHECK (energy_source IN ('grid', 'solar', 'wind', 'mixed_renewable', 'unknown')),
  shopping_frequency TEXT CHECK (shopping_frequency IN ('rarely', 'monthly', 'weekly', 'daily')),
  monthly_carbon_goal NUMERIC NOT NULL DEFAULT 200,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  total_carbon_saved NUMERIC NOT NULL DEFAULT 0,
  country_code TEXT NOT NULL DEFAULT 'US',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  weekly_report_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activities table
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('transport', 'food', 'electricity', 'purchases', 'waste', 'other')),
  subcategory TEXT NOT NULL,
  description TEXT NOT NULL,
  carbon_kg NUMERIC NOT NULL CHECK (carbon_kg >= -1000 AND carbon_kg <= 100000),
  metadata JSONB NOT NULL DEFAULT '{}',
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX activities_user_date_idx ON public.activities(user_id, activity_date DESC);
CREATE INDEX activities_user_category_idx ON public.activities(user_id, category);

-- Carbon entries table (for API-sourced entries)
CREATE TABLE public.carbon_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('transport', 'food', 'electricity', 'purchases', 'waste', 'other')),
  carbon_kg NUMERIC NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('climatiq', 'electricity_maps', 'iata', 'manual', 'ai_estimate')),
  climatiq_factor_id TEXT,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX carbon_entries_user_date_idx ON public.carbon_entries(user_id, entry_date DESC);

-- Challenges table
CREATE TABLE public.challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('transport', 'food', 'electricity', 'purchases', 'waste', 'other')),
  target_value NUMERIC NOT NULL,
  target_unit TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  reward_points INTEGER NOT NULL DEFAULT 50,
  badge_id UUID,
  icon TEXT NOT NULL DEFAULT 'trophy',
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User challenges (many-to-many)
CREATE TABLE public.user_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'abandoned')),
  progress NUMERIC NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, challenge_id)
);

-- Badges table
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('transport', 'food', 'energy', 'social', 'streak', 'milestone')),
  requirement_type TEXT NOT NULL,
  requirement_value NUMERIC NOT NULL,
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User badges (earned badges)
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Goals table
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  target_carbon_kg NUMERIC NOT NULL,
  current_carbon_kg NUMERIC NOT NULL DEFAULT 0,
  period TEXT NOT NULL CHECK (period IN ('weekly', 'monthly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI recommendations table
CREATE TABLE public.ai_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('weekly_report', 'tip', 'challenge', 'goal', 'alert')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  potential_savings_kg NUMERIC NOT NULL DEFAULT 0,
  category TEXT CHECK (category IN ('transport', 'food', 'electricity', 'purchases', 'waste', 'other')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_dismissed BOOLEAN NOT NULL DEFAULT false,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ai_recs_user_unread_idx ON public.ai_recommendations(user_id, is_read, is_dismissed);

-- Receipts table
CREATE TABLE public.receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  ocr_text TEXT,
  extracted_items JSONB NOT NULL DEFAULT '[]',
  total_carbon_kg NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  merchant_name TEXT,
  receipt_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Leaderboard entries table
CREATE TABLE public.leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  scope TEXT NOT NULL CHECK (scope IN ('global', 'friends', 'school', 'company')),
  scope_id TEXT,
  period TEXT NOT NULL,
  carbon_kg NUMERIC NOT NULL,
  rank INTEGER,
  reduction_percentage NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, scope, period)
);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carbon_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies: activities
CREATE POLICY "Users can manage own activities" ON public.activities FOR ALL USING (auth.uid() = user_id);

-- RLS Policies: carbon_entries
CREATE POLICY "Users can manage own carbon entries" ON public.carbon_entries FOR ALL USING (auth.uid() = user_id);

-- RLS Policies: challenges (public read)
CREATE POLICY "Challenges are publicly readable" ON public.challenges FOR SELECT USING (true);

-- RLS Policies: user_challenges
CREATE POLICY "Users can manage own challenges" ON public.user_challenges FOR ALL USING (auth.uid() = user_id);

-- RLS Policies: badges (public read)
CREATE POLICY "Badges are publicly readable" ON public.badges FOR SELECT USING (true);

-- RLS Policies: user_badges
CREATE POLICY "Users can view own badges" ON public.user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert user badges" ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies: goals
CREATE POLICY "Users can manage own goals" ON public.goals FOR ALL USING (auth.uid() = user_id);

-- RLS Policies: ai_recommendations
CREATE POLICY "Users can manage own recommendations" ON public.ai_recommendations FOR ALL USING (auth.uid() = user_id);

-- RLS Policies: receipts
CREATE POLICY "Users can manage own receipts" ON public.receipts FOR ALL USING (auth.uid() = user_id);

-- RLS Policies: leaderboard (users can see global rankings)
CREATE POLICY "Users can view global leaderboard" ON public.leaderboard_entries FOR SELECT USING (scope = 'global' OR auth.uid() = user_id);
CREATE POLICY "Users can manage own leaderboard entries" ON public.leaderboard_entries FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Seed initial challenges
INSERT INTO public.challenges (title, description, category, target_value, target_unit, duration_days, reward_points, icon, difficulty) VALUES
  ('Public Transit Week', 'Use public transport for all commutes for 7 days', 'transport', 7, 'days', 7, 50, 'bus', 'easy'),
  ('Meat-Free Days', 'Skip meat for 5 days this week', 'food', 5, 'days', 7, 75, 'leaf', 'medium'),
  ('Energy Saver', 'Reduce electricity usage by 15% this month', 'electricity', 15, '% reduction', 30, 150, 'lightning-bolt', 'hard'),
  ('Zero Waste Week', 'Minimize single-use items for 7 days', 'waste', 7, 'days', 7, 100, 'recycle', 'medium'),
  ('Bike Commuter', 'Cycle instead of drive for 5 trips', 'transport', 5, 'trips', 14, 80, 'bicycle', 'medium'),
  ('Local Food', 'Buy only local or organic food for a week', 'food', 7, 'days', 7, 60, 'food-apple', 'easy');

-- Seed initial badges
INSERT INTO public.badges (name, description, icon, category, requirement_type, requirement_value, rarity) VALUES
  ('First Step', 'Logged your first activity', '🌱', 'milestone', 'activities_logged', 1, 'common'),
  ('Transit Hero', 'Used public transit 5 days in a row', '🚌', 'transport', 'transit_streak', 5, 'rare'),
  ('Plant Eater', 'Had 7 consecutive meat-free days', '🌿', 'food', 'meatfree_streak', 7, 'rare'),
  ('Energy Wizard', 'Reduced electricity usage by 20%', '⚡', 'energy', 'energy_reduction', 20, 'epic'),
  ('On Fire', 'Maintained a 14-day tracking streak', '🔥', 'streak', 'tracking_streak', 14, 'epic'),
  ('Earth Guardian', 'Reduced footprint by 30% over a month', '🌍', 'milestone', 'monthly_reduction', 30, 'legendary');
