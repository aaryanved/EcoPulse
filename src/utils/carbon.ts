import type { ActivityCategory, CarbonBreakdown } from '@/types';

const GLOBAL_AVERAGE_MONTHLY_KG = 833;
const TREE_ABSORPTION_KG_PER_YEAR = 21;
const FLIGHT_ECONOMY_KG_PER_HOUR = 255;
const AVG_FLIGHT_DURATION_HOURS = 2.5;

export function formatCarbonKg(kg: number): string {
  if (kg >= 1000) {
    return `${(kg / 1000).toFixed(1)}t`;
  }
  if (kg < 1) {
    return `${(kg * 1000).toFixed(0)}g`;
  }
  return `${kg.toFixed(1)}kg`;
}

export function carbonToTrees(kg: number): number {
  return Math.ceil((kg / TREE_ABSORPTION_KG_PER_YEAR) * 12);
}

export function carbonToFlights(kg: number): number {
  const kgPerFlight = FLIGHT_ECONOMY_KG_PER_HOUR * AVG_FLIGHT_DURATION_HOURS;
  return Math.round((kg / kgPerFlight) * 10) / 10;
}

export function carbonToDrivingKm(kg: number): number {
  const kgPerKm = 0.192;
  return Math.round(kg / kgPerKm);
}

export function getCarbonLevel(kg: number): 'low' | 'medium' | 'high' | 'critical' {
  if (kg <= 300) return 'low';
  if (kg <= 600) return 'medium';
  if (kg <= 1000) return 'high';
  return 'critical';
}

export function getVsGlobalAverage(kg: number): number {
  return Math.round(((kg - GLOBAL_AVERAGE_MONTHLY_KG) / GLOBAL_AVERAGE_MONTHLY_KG) * 100);
}

export function calculateReductionScore(current: number, previous: number): number {
  if (previous === 0) return 0;
  const reduction = ((previous - current) / previous) * 100;
  return Math.max(0, Math.min(100, Math.round(reduction)));
}

export function buildCarbonBreakdown(
  entries: Array<{ category: ActivityCategory; carbon_kg: number }>
): CarbonBreakdown {
  const breakdown: CarbonBreakdown = {
    transport: 0,
    food: 0,
    electricity: 0,
    purchases: 0,
    waste: 0,
    other: 0,
    total: 0,
  };

  for (const entry of entries) {
    const cat = entry.category as keyof Omit<CarbonBreakdown, 'total'>;
    if (cat in breakdown) {
      breakdown[cat] += entry.carbon_kg;
    } else {
      breakdown.other += entry.carbon_kg;
    }
    breakdown.total += entry.carbon_kg;
  }

  return breakdown;
}

export function getCategoryColor(category: ActivityCategory): string {
  const colors: Record<ActivityCategory, string> = {
    transport: '#3b82f6',
    food: '#f59e0b',
    electricity: '#8b5cf6',
    purchases: '#ec4899',
    waste: '#6b7280',
    other: '#14b8a6',
  };
  return colors[category] ?? '#6b7280';
}

export function getCategoryIcon(category: ActivityCategory): string {
  const icons: Record<ActivityCategory, string> = {
    transport: 'car',
    food: 'food-apple',
    electricity: 'lightning-bolt',
    purchases: 'shopping',
    waste: 'trash-can',
    other: 'dots-horizontal',
  };
  return icons[category] ?? 'dots-horizontal';
}

export function getCategoryLabel(category: ActivityCategory): string {
  const labels: Record<ActivityCategory, string> = {
    transport: 'Transport',
    food: 'Food',
    electricity: 'Electricity',
    purchases: 'Purchases',
    waste: 'Waste',
    other: 'Other',
  };
  return labels[category] ?? 'Other';
}
