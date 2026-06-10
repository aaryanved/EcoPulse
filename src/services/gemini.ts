import { Config } from '@/constants';
import type { ChatMessage, CarbonBreakdown, UserRow } from '@/types';

// ---------------------------------------------------------------------------
// Gemini REST types
// ---------------------------------------------------------------------------

interface GeminiPart {
  text: string;
}

interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

interface GeminiRequest {
  system_instruction?: { parts: GeminiPart[] };
  contents: GeminiContent[];
  generationConfig?: {
    temperature?: number;
    topK?: number;
    topP?: number;
    maxOutputTokens?: number;
  };
}

interface GeminiResponse {
  candidates: Array<{
    content: { parts: GeminiPart[]; role: string };
    finishReason: string;
  }>;
  error?: { message: string; code: number };
}

// ---------------------------------------------------------------------------
// Core fetch wrapper
// ---------------------------------------------------------------------------

async function callGemini(
  request: GeminiRequest,
  model: string = Config.gemini.model
): Promise<string> {
  if (!Config.gemini.apiKey) {
    throw new Error('Gemini API key not configured. Add EXPO_PUBLIC_GEMINI_API_KEY to your .env');
  }

  const url = `${Config.gemini.baseUrl}/models/${model}:generateContent?key=${Config.gemini.apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const data: GeminiResponse = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error?.message ?? `Gemini API error: ${response.status}`);
  }

  return data.candidates[0]?.content?.parts[0]?.text ?? '';
}

// ---------------------------------------------------------------------------
// System prompt — the intelligence core of EcoPulse AI
// ---------------------------------------------------------------------------

function buildSystemPrompt(
  userProfile: Partial<UserRow>,
  carbonBreakdown: CarbonBreakdown
): string {
  const total = carbonBreakdown.total;
  const globalAvgMonthly = 400; // kg CO₂/month global average

  const pct = (n: number) => (total > 0 ? ((n / total) * 100).toFixed(0) : '0');
  const vsGoal =
    userProfile.monthly_carbon_goal && userProfile.monthly_carbon_goal > 0
      ? ((total / userProfile.monthly_carbon_goal) * 100).toFixed(0)
      : 'N/A';
  const vsGlobal =
    total > 0
      ? `${((total - globalAvgMonthly) / globalAvgMonthly) * 100 > 0 ? '+' : ''}${(
          ((total - globalAvgMonthly) / globalAvgMonthly) *
          100
        ).toFixed(0)}% vs global avg`
      : 'no data yet';

  const highestCategory = (() => {
    const cats = {
      Transport: carbonBreakdown.transport,
      Food: carbonBreakdown.food,
      Electricity: carbonBreakdown.electricity,
      Purchases: carbonBreakdown.purchases,
      'Waste/Other': carbonBreakdown.waste + carbonBreakdown.other,
    };
    return Object.entries(cats).sort((a, b) => b[1] - a[1])[0][0];
  })();

  return `You are EcoPulse AI — an expert sustainability coach and carbon intelligence analyst embedded in the EcoPulse carbon tracking app.

## Core Identity
You are science-driven, specific, and warm. You combine the rigor of an IPCC climate scientist, the actionability of a zero-waste lifestyle coach, and the empathy of a personal trainer who genuinely celebrates every small win. You are allergic to vague advice and never say things like "try to reduce your footprint" without specifying exactly how much and how.

## Deep Expertise
• Carbon accounting: Scope 1/2/3, IPCC AR6 emission factors, lifecycle assessment methodology
• Transport: ICE vs EV emissions, aviation radiative forcing (2.7× multiplier), modal shift benefits, last-mile solutions
• Food systems: Enteric fermentation, land-use change, supply chains. Key benchmarks: beef ≈ 27 kgCO₂/kg, lamb ≈ 24, cheese ≈ 13, chicken ≈ 6, tofu ≈ 3, lentils ≈ 0.9
• Energy: Grid carbon intensity (global avg ≈ 475 gCO₂/kWh), heat pumps vs gas, renewable tariff switching
• Purchasing: Embodied carbon. Benchmarks: new smartphone ≈ 70 kg CO₂, jeans ≈ 33 kg, cotton T-shirt ≈ 7 kg, fast fashion multipliers
• Behavior science: Motivational interviewing, identity-based habits, implementation intentions

## This User's Profile
- Diet: ${userProfile.diet_type ?? 'omnivore'}
- Primary transport: ${userProfile.transport_mode ?? 'car'}
- Energy source: ${userProfile.energy_source ?? 'grid'}
- Monthly CO₂ goal: ${userProfile.monthly_carbon_goal ?? 200} kg CO₂e
- Current streak: ${userProfile.current_streak ?? 0} days logged

## Live Carbon Data — This Month
Total: ${total.toFixed(1)} kg CO₂e  (${vsGlobal})
├ Transport:   ${carbonBreakdown.transport.toFixed(1)} kg   (${pct(carbonBreakdown.transport)}%)
├ Food:        ${carbonBreakdown.food.toFixed(1)} kg   (${pct(carbonBreakdown.food)}%)
├ Electricity: ${carbonBreakdown.electricity.toFixed(1)} kg   (${pct(carbonBreakdown.electricity)}%)
├ Purchases:   ${carbonBreakdown.purchases.toFixed(1)} kg   (${pct(carbonBreakdown.purchases)}%)
└ Waste/Other: ${(carbonBreakdown.waste + carbonBreakdown.other).toFixed(1)} kg   (${pct(carbonBreakdown.waste + carbonBreakdown.other)}%)

Goal progress: ${vsGoal}% of ${userProfile.monthly_carbon_goal ?? 200} kg monthly budget used
Biggest impact area: ${highestCategory}

## Communication Rules — NON-NEGOTIABLE
1. **Length**: ≤ 180 words by default. Only exceed if the user explicitly requests a detailed plan, step-by-step guide, or full report.
2. **Specificity**: Lead with the most high-leverage insight for THIS user based on their actual numbers — never generic sustainability advice. If their transport is 80% of their footprint, open with that.
3. **Their numbers**: Quote exact values — "your ${carbonBreakdown.transport.toFixed(0)} kg transport footprint" not "your transport."
4. **Action close**: Every response ends with a single **Action:** line — one concrete thing they can do today or this week.
5. **Tone**: Warm, confident, never preachy. Respect autonomy. Don't say "you should" — say "here's what works."
6. **Filler ban**: No "Great question!", "Absolutely!", "Of course!" — start immediately with substance.
7. **Low footprint mode**: If their total is already < 150 kg/month, acknowledge it and focus on optimization rather than basics.
8. **Format**: Plain prose ≤ 3 sentences for quick answers; numbered lists only for plans with 3+ steps.

## Boundary Handling
- Off-topic: "I'm focused on sustainability coaching — for [topic] a quick web search would work better."
- Uncertain data: give a range with explicit uncertainty — "this varies widely, typically 5–15 kg CO₂."
- Unsafe advice: never recommend anything extreme, unsafe, or financially ruinous.

## Internal Quality Check
Before generating each response, verify: "Would a knowledgeable friend with access to this exact carbon data give more specific, more useful advice?" If yes, rewrite.`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function sendChatMessage(
  history: ChatMessage[],
  userMessage: string,
  userProfile: Partial<UserRow>,
  carbonBreakdown: CarbonBreakdown
): Promise<string> {
  const systemPrompt = buildSystemPrompt(userProfile, carbonBreakdown);

  // Convert chat history to Gemini format (user / model roles)
  const contents: GeminiContent[] = history
    .filter(m => m.role !== 'assistant' || m.content.trim())
    .slice(-12) // last 12 messages for context window efficiency
    .map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

  // Ensure history ends with a user turn (Gemini requirement)
  contents.push({ role: 'user', parts: [{ text: userMessage }] });

  return callGemini({
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: {
      temperature: 0.75,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 512,
    },
  });
}

export async function generateWeeklyReport(
  userProfile: Partial<UserRow>,
  currentBreakdown: CarbonBreakdown,
  previousBreakdown: CarbonBreakdown
): Promise<string> {
  const change =
    previousBreakdown.total > 0
      ? (((currentBreakdown.total - previousBreakdown.total) / previousBreakdown.total) * 100).toFixed(1)
      : '0';
  const improved = parseFloat(change) < 0;

  const prompt = `Generate a weekly sustainability report for this user.

This week: ${currentBreakdown.total.toFixed(1)} kg CO₂e
Last week: ${previousBreakdown.total.toFixed(1)} kg CO₂e
Change: ${improved ? '↓' : '↑'} ${Math.abs(parseFloat(change))}% ${improved ? '(improvement!)' : '(increase)'}

Breakdown this week:
- Transport: ${currentBreakdown.transport.toFixed(1)} kg
- Food: ${currentBreakdown.food.toFixed(1)} kg
- Electricity: ${currentBreakdown.electricity.toFixed(1)} kg
- Purchases: ${currentBreakdown.purchases.toFixed(1)} kg

User: diet=${userProfile.diet_type ?? 'omnivore'}, transport=${userProfile.transport_mode ?? 'car'}, streak=${userProfile.current_streak ?? 0} days

Rules:
- 4 sentences maximum
- First sentence: acknowledge the overall week with their exact numbers
- Second: identify the single biggest driver (with kg figure)
- Third: one specific, quantified tip targeting that driver
- Fourth: encouraging close referencing their streak if > 0
- Plain prose, no headers, no bullet points`;

  return callGemini({
    system_instruction: {
      parts: [{ text: 'You are EcoPulse AI, a concise and data-driven sustainability coach. Be specific with numbers, warm in tone, and never exceed 4 sentences.' }],
    },
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 300 },
  });
}

export async function generateReductionPlan(
  userProfile: Partial<UserRow>,
  carbonBreakdown: CarbonBreakdown,
  targetReductionPercent: number
): Promise<string> {
  const target = carbonBreakdown.total * (1 - targetReductionPercent / 100);
  const savingsNeeded = carbonBreakdown.total - target;

  const prompt = `Create a personalized ${targetReductionPercent}% carbon reduction plan.

Current monthly footprint: ${carbonBreakdown.total.toFixed(1)} kg CO₂e
Target: ${target.toFixed(1)} kg CO₂e (save ${savingsNeeded.toFixed(1)} kg/month)

Current breakdown:
- Transport: ${carbonBreakdown.transport.toFixed(1)} kg (${carbonBreakdown.total > 0 ? ((carbonBreakdown.transport / carbonBreakdown.total) * 100).toFixed(0) : 0}%)
- Food: ${carbonBreakdown.food.toFixed(1)} kg (${carbonBreakdown.total > 0 ? ((carbonBreakdown.food / carbonBreakdown.total) * 100).toFixed(0) : 0}%)
- Electricity: ${carbonBreakdown.electricity.toFixed(1)} kg (${carbonBreakdown.total > 0 ? ((carbonBreakdown.electricity / carbonBreakdown.total) * 100).toFixed(0) : 0}%)
- Purchases: ${carbonBreakdown.purchases.toFixed(1)} kg

Lifestyle: diet=${userProfile.diet_type ?? 'omnivore'}, transport=${userProfile.transport_mode ?? 'car'}, energy=${userProfile.energy_source ?? 'grid'}

Provide exactly 3 steps. For each:
1. Specific action (not "eat less meat" — "replace 3 beef meals/week with lentils")
2. Estimated monthly CO₂ savings (kg) based on their actual numbers
3. Difficulty: Easy / Medium / Hard
4. Time to impact: Immediate / 1 week / 1 month

Format each step clearly. Target the categories with highest absolute emissions first. Be realistic — no extreme changes.`;

  return callGemini(
    {
      system_instruction: {
        parts: [{ text: 'You are EcoPulse AI. Provide a precise, achievable 3-step carbon reduction plan with exact savings estimates. No generic advice.' }],
      },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.6, maxOutputTokens: 600 },
    },
    Config.gemini.proModel // use pro for detailed plans
  );
}

export const geminiService = {
  sendChatMessage,
  generateWeeklyReport,
  generateReductionPlan,
};
