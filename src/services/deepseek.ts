import { Config } from '@/constants';
import type { ChatMessage, CarbonBreakdown, UserRow } from '@/types';

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepSeekResponse {
  choices: Array<{
    message: { content: string };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

async function chat(messages: DeepSeekMessage[]): Promise<string> {
  const response = await fetch(`${Config.deepseek.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${Config.deepseek.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: Config.deepseek.model,
      messages,
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status}`);
  }

  const data: DeepSeekResponse = await response.json();
  return data.choices[0]?.message.content ?? '';
}

export async function sendChatMessage(
  history: ChatMessage[],
  userMessage: string,
  userProfile: Partial<UserRow>,
  carbonBreakdown: CarbonBreakdown
): Promise<string> {
  const systemPrompt = buildSystemPrompt(userProfile, carbonBreakdown);

  const messages: DeepSeekMessage[] = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-10).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: userMessage },
  ];

  return chat(messages);
}

export async function generateWeeklyReport(
  userProfile: Partial<UserRow>,
  currentBreakdown: CarbonBreakdown,
  previousBreakdown: CarbonBreakdown
): Promise<string> {
  const prompt = `Generate a concise weekly sustainability report for a user with these stats:

Current week carbon: ${currentBreakdown.total.toFixed(1)}kg CO₂
Previous week: ${previousBreakdown.total.toFixed(1)}kg CO₂
Change: ${((currentBreakdown.total - previousBreakdown.total) / (previousBreakdown.total || 1) * 100).toFixed(1)}%

Breakdown:
- Transport: ${currentBreakdown.transport.toFixed(1)}kg
- Food: ${currentBreakdown.food.toFixed(1)}kg
- Electricity: ${currentBreakdown.electricity.toFixed(1)}kg
- Purchases: ${currentBreakdown.purchases.toFixed(1)}kg

User profile: Diet=${userProfile.diet_type}, Transport=${userProfile.transport_mode}

Write a 3-4 sentence report: what went well, main driver of emissions, one specific actionable tip. Be encouraging and specific. Use simple language. No markdown headers.`;

  return chat([
    { role: 'system', content: 'You are EcoPulse, a friendly AI sustainability coach. Keep responses concise and actionable.' },
    { role: 'user', content: prompt },
  ]);
}

export async function generateReductionPlan(
  userProfile: Partial<UserRow>,
  carbonBreakdown: CarbonBreakdown,
  targetReductionPercent: number
): Promise<string> {
  const prompt = `Create a personalized carbon reduction plan for this user:

Current monthly carbon: ${carbonBreakdown.total.toFixed(1)}kg CO₂
Target reduction: ${targetReductionPercent}%
Target: ${(carbonBreakdown.total * (1 - targetReductionPercent / 100)).toFixed(1)}kg CO₂

Top emissions:
- Transport: ${carbonBreakdown.transport.toFixed(1)}kg (${((carbonBreakdown.transport / carbonBreakdown.total) * 100).toFixed(0)}%)
- Food: ${carbonBreakdown.food.toFixed(1)}kg (${((carbonBreakdown.food / carbonBreakdown.total) * 100).toFixed(0)}%)
- Electricity: ${carbonBreakdown.electricity.toFixed(1)}kg (${((carbonBreakdown.electricity / carbonBreakdown.total) * 100).toFixed(0)}%)

Lifestyle: Diet=${userProfile.diet_type}, Transport=${userProfile.transport_mode}

Provide 3 concrete, realistic steps to achieve this reduction. For each step include: the action, estimated CO₂ savings, and difficulty level (Easy/Medium/Hard). Be specific.`;

  return chat([
    { role: 'system', content: 'You are EcoPulse, a practical AI sustainability coach. Give specific, achievable recommendations.' },
    { role: 'user', content: prompt },
  ]);
}

function buildSystemPrompt(userProfile: Partial<UserRow>, carbonBreakdown: CarbonBreakdown): string {
  return `You are EcoPulse, an expert AI sustainability coach embedded in a carbon footprint tracking app.

User profile:
- Diet: ${userProfile.diet_type ?? 'omnivore'}
- Primary transport: ${userProfile.transport_mode ?? 'car'}
- Energy source: ${userProfile.energy_source ?? 'grid'}
- Monthly carbon goal: ${userProfile.monthly_carbon_goal ?? 200}kg CO₂

Current month emissions:
- Total: ${carbonBreakdown.total.toFixed(1)}kg CO₂
- Transport: ${carbonBreakdown.transport.toFixed(1)}kg
- Food: ${carbonBreakdown.food.toFixed(1)}kg
- Electricity: ${carbonBreakdown.electricity.toFixed(1)}kg
- Purchases: ${carbonBreakdown.purchases.toFixed(1)}kg

Guidelines:
- Be concise, friendly, and encouraging
- Give specific, actionable advice based on their actual data
- Reference their numbers when relevant
- Never be preachy or guilt-inducing
- Suggest small, achievable changes
- Maximum 150 words per response unless asked for detail`;
}

export const deepseekService = {
  sendChatMessage,
  generateWeeklyReport,
  generateReductionPlan,
};
