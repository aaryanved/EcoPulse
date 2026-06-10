import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WeeklyReportPayload {
  user_id: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const deepseekKey = Deno.env.get('DEEPSEEK_API_KEY') ?? '';

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { user_id }: WeeklyReportPayload = await req.json();
    if (!user_id) throw new Error('user_id is required');

    // Get user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user_id)
      .single();
    if (userError) throw userError;

    // Get current week activities
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);

    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(weekStart.getDate() - 7);

    const [currentWeek, previousWeek] = await Promise.all([
      supabase
        .from('activities')
        .select('*')
        .eq('user_id', user_id)
        .gte('activity_date', weekStart.toISOString().split('T')[0]),
      supabase
        .from('activities')
        .select('*')
        .eq('user_id', user_id)
        .gte('activity_date', prevWeekStart.toISOString().split('T')[0])
        .lt('activity_date', weekStart.toISOString().split('T')[0]),
    ]);

    function buildBreakdown(activities: any[]) {
      const breakdown = { transport: 0, food: 0, electricity: 0, purchases: 0, waste: 0, other: 0, total: 0 };
      for (const a of activities) {
        const cat = a.category as keyof typeof breakdown;
        if (cat in breakdown && cat !== 'total') {
          breakdown[cat] += a.carbon_kg;
        } else {
          breakdown.other += a.carbon_kg;
        }
        breakdown.total += a.carbon_kg;
      }
      return breakdown;
    }

    const current = buildBreakdown(currentWeek.data ?? []);
    const previous = buildBreakdown(previousWeek.data ?? []);

    // Call DeepSeek
    const prompt = `Generate a concise weekly sustainability report for a user:

Current week carbon: ${current.total.toFixed(1)}kg CO₂
Previous week: ${previous.total.toFixed(1)}kg CO₂
Change: ${((current.total - previous.total) / (previous.total || 1) * 100).toFixed(1)}%

Breakdown this week:
- Transport: ${current.transport.toFixed(1)}kg
- Food: ${current.food.toFixed(1)}kg
- Electricity: ${current.electricity.toFixed(1)}kg
- Purchases: ${current.purchases.toFixed(1)}kg

User: Diet=${user.diet_type}, Transport=${user.transport_mode}

Write 3-4 sentences: what went well, main source, one specific tip. Be encouraging. No headers.`;

    const aiResponse = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${deepseekKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are EcoPulse, a friendly AI sustainability coach.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 300,
      }),
    });

    const aiData = await aiResponse.json();
    const content: string = aiData.choices?.[0]?.message?.content ?? 'Unable to generate report.';

    // Save recommendation
    const savings = Math.max(0, previous.total - current.total);
    await supabase.from('ai_recommendations').insert({
      user_id,
      type: 'weekly_report',
      title: 'Your Weekly Sustainability Report',
      content,
      potential_savings_kg: savings,
      generated_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ success: true, content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
