import { Config } from '@/constants';

interface VisionResponse {
  responses: Array<{
    textAnnotations?: Array<{
      description: string;
      boundingPoly: unknown;
    }>;
    error?: { code: number; message: string };
  }>;
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  category: string;
  estimatedCarbonKg: number;
}

export interface ParsedReceipt {
  merchant: string | null;
  date: string | null;
  total: number | null;
  items: ReceiptItem[];
  rawText: string;
}

export async function extractTextFromImage(base64Image: string): Promise<string> {
  const requestBody = {
    requests: [
      {
        image: { content: base64Image },
        features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
      },
    ],
  };

  const response = await fetch(
    `${Config.googleVision.baseUrl}/images:annotate?key=${Config.googleVision.apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    throw new Error(`Google Vision API error: ${response.status}`);
  }

  const data: VisionResponse = await response.json();
  const textAnnotation = data.responses[0]?.textAnnotations?.[0];

  if (data.responses[0]?.error) {
    throw new Error(data.responses[0].error.message);
  }

  return textAnnotation?.description ?? '';
}

export async function parseReceiptText(rawText: string): Promise<ParsedReceipt> {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

  const merchantName = extractMerchantName(lines);
  const date = extractDate(lines);
  const total = extractTotal(lines);
  const items = extractLineItems(lines);

  return {
    merchant: merchantName,
    date,
    total,
    items,
    rawText,
  };
}

function extractMerchantName(lines: string[]): string | null {
  if (lines.length > 0) return lines[0];
  return null;
}

function extractDate(lines: string[]): string | null {
  const datePattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{2}[\/\-]\d{2})/;
  for (const line of lines) {
    const match = line.match(datePattern);
    if (match) return match[1];
  }
  return null;
}

function extractTotal(lines: string[]): number | null {
  const totalPattern = /total[:\s]+\$?(\d+\.?\d*)/i;
  for (const line of lines) {
    const match = line.match(totalPattern);
    if (match) return parseFloat(match[1]);
  }
  return null;
}

function extractLineItems(lines: string[]): ReceiptItem[] {
  const items: ReceiptItem[] = [];
  const itemPattern = /^(.+?)\s+\$?(\d+\.?\d*)$/;

  for (const line of lines) {
    const match = line.match(itemPattern);
    if (match && !line.toLowerCase().includes('total') && !line.toLowerCase().includes('tax')) {
      const name = match[1].trim();
      const price = parseFloat(match[2]);

      if (name.length > 2 && price > 0 && price < 1000) {
        items.push({
          name,
          quantity: 1,
          price,
          category: categorizeItem(name),
          estimatedCarbonKg: estimateItemCarbon(name, price),
        });
      }
    }
  }

  return items;
}

function categorizeItem(name: string): string {
  const lower = name.toLowerCase();

  if (/beef|steak|burger|meat|chicken|pork|fish|salmon|tuna/.test(lower)) return 'meat';
  if (/milk|cheese|yogurt|butter|cream|dairy/.test(lower)) return 'dairy';
  if (/vegetable|fruit|salad|produce|organic/.test(lower)) return 'produce';
  if (/bread|pasta|rice|cereal|grain/.test(lower)) return 'grains';
  if (/snack|chip|candy|chocolate|cookie/.test(lower)) return 'snacks';
  if (/drink|juice|soda|water|coffee|tea/.test(lower)) return 'beverages';
  if (/plastic|paper|bag|wrap/.test(lower)) return 'packaging';

  return 'general';
}

function estimateItemCarbon(name: string, price: number): number {
  const category = categorizeItem(name);

  const kgPerDollar: Record<string, number> = {
    meat: 0.27,
    dairy: 0.08,
    produce: 0.03,
    grains: 0.02,
    snacks: 0.05,
    beverages: 0.04,
    packaging: 0.1,
    general: 0.06,
  };

  return (kgPerDollar[category] ?? 0.06) * price;
}

export const googleVisionService = {
  extractTextFromImage,
  parseReceiptText,
};
