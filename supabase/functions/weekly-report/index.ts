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
    const geminiKey = Deno.env.get('GEMINI_API_KEY') ?? '';

    if (!geminiKey) throw new Error('GEMINI_API_KEY not configured');

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { user_id }: WeeklyReportPayload = await req.json();
    if (!user_id) throw new Error('user_id is required');

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user_id)
      .single();
    if (userError) throw userError;

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(weekStart.getDate() - 7);

    const [currentWeek, previousWeek] = await Promise.all([
      supabase
        .from('activities')
        .select('category, carbon_kg')
        .eq('user_id', user_id)
        .gte('activity_date', weekStart.toISOString().split('T')[0]),
      supabase
        .from('activities')
        .select('category, carbon_kg')
        .eq('user_id', user_id)
        .gte('activity_date', prevWeekStart.toISOString().split('T')[0])
        .lt('activity_date', weekStart.toISOString().split('T')[0]),
    ]);

    type Breakdown = { transport: number; food: number; electricity: number; purchases: number; other: number; total: number };

    function buildBreakdown(activities: Array<{ category: string; carbon_kg: number }>): Breakdown {
      const b: Breakdown = { transport: 0, food: 0, electricity: 0, purchases: 0, other: 0, total: 0 };
      for (const a of activities) {
        const cat = a.category as keyof Omit<Breakdown, 'total'>;
        if (cat in b) b[cat] += a.carbon_kg;
        else b.other += a.carbon_kg;
        b.total += a.carbon_kg;
      }
      return b;
    }

    const current = buildBreakdown(currentWeek.data ?? []);
    const previous = buildBreakdown(previousWeek.data ?? []);
    const change = previous.total > 0
      ? (((current.total - previous.total) / previous.total) * 100).toFixed(1)
      : '0';
    const improved = parseFloat(change) < 0;

    const prompt = `Generate a weekly sustainability report for this user.

This week: ${current.total.toFixed(1)} kg CO₂e
Last week: ${previous.total.toFixed(1)} kg CO₂e
Change: ${improved ? '↓' : '↑'} ${Math.abs(parseFloat(change))}% ${improved ? '(improvement)' : '(increase)'}

Breakdown this week:
- Transport: ${current.transport.toFixed(1)} kg
- Food: ${current.food.toFixed(1)} kg
- Electricity: ${current.electricity.toFixed(1)} kg
- Purchases: ${current.purchases.toFixed(1)} kg

User: diet=${user.diet_type ?? 'omnivore'}, transport=${user.transport_mode ?? 'car'}, streak=${user.current_streak ?? 0} days

Rules:
- 4 sentences maximum
- First: acknowledge overall week with exact numbers
- Second: biggest driver with kg figure
- Third: one specific, quantified tip targeting that driver
- Fourth: encouraging close referencing their streak if > 0
- Plain prose, no headers`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: 'You are EcoPulse AI, a concise and data-driven sustainability coach. Never exceed 4 sentences.' }],
          },
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 300 },
        }),
      }
    );

    const geminiData = await geminiResponse.json();
    const content: string = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Unable to generate report.';

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
