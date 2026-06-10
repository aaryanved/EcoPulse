-- Leaderboard view with user details
CREATE OR REPLACE VIEW public.leaderboard_with_users AS
SELECT
  le.id,
  le.user_id,
  le.scope,
  le.scope_id,
  le.period,
  le.carbon_kg,
  le.rank,
  le.reduction_percentage,
  le.created_at,
  u.display_name,
  u.avatar_url,
  u.current_streak
FROM public.leaderboard_entries le
JOIN public.users u ON le.user_id = u.id;

-- Function to refresh leaderboard ranks for a period
CREATE OR REPLACE FUNCTION refresh_leaderboard_ranks(p_period TEXT, p_scope TEXT DEFAULT 'global')
RETURNS VOID AS $$
BEGIN
  WITH ranked AS (
    SELECT
      id,
      ROW_NUMBER() OVER (ORDER BY carbon_kg ASC) AS new_rank
    FROM public.leaderboard_entries
    WHERE period = p_period AND scope = p_scope
  )
  UPDATE public.leaderboard_entries le
  SET rank = ranked.new_rank
  FROM ranked
  WHERE le.id = ranked.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to refresh ranks after upsert
CREATE OR REPLACE FUNCTION trigger_refresh_leaderboard()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM refresh_leaderboard_ranks(NEW.period, NEW.scope);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS leaderboard_rank_refresh ON public.leaderboard_entries;
CREATE TRIGGER leaderboard_rank_refresh
  AFTER INSERT OR UPDATE ON public.leaderboard_entries
  FOR EACH ROW EXECUTE FUNCTION trigger_refresh_leaderboard();

-- Function to compute carbon summary for a user in a date range
CREATE OR REPLACE FUNCTION get_carbon_summary(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE(
  category TEXT,
  total_kg NUMERIC,
  entry_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.category,
    SUM(a.carbon_kg) AS total_kg,
    COUNT(*) AS entry_count
  FROM public.activities a
  WHERE a.user_id = p_user_id
    AND a.activity_date >= p_start_date
    AND a.activity_date <= p_end_date
  GROUP BY a.category
  ORDER BY total_kg DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS for the view
ALTER VIEW public.leaderboard_with_users OWNER TO postgres;
GRANT SELECT ON public.leaderboard_with_users TO authenticated;

-- Index for faster leaderboard queries
CREATE INDEX IF NOT EXISTS leaderboard_scope_period_idx
  ON public.leaderboard_entries(scope, period, carbon_kg ASC);

-- Index for AI recommendations
CREATE INDEX IF NOT EXISTS ai_recs_generated_at_idx
  ON public.ai_recommendations(user_id, generated_at DESC);
