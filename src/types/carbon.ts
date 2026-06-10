import type { ActivityCategory } from './database';

export interface CarbonEstimate {
  co2e: number;
  co2e_unit: string;
  co2e_calculation_method: string;
  emission_factor: {
    name: string;
    source: string;
    region: string | null;
    year: number | null;
  };
}

export interface TransportEmissionParams {
  mode: 'car' | 'bus' | 'train' | 'plane' | 'ferry' | 'motorbike' | 'taxi' | 'electric_vehicle';
  distance_km: number;
  passengers?: number;
  fuel_type?: string;
  vehicle_type?: string;
}

export interface FlightEmissionParams {
  origin: string;
  destination: string;
  cabin_class: 'economy' | 'premium_economy' | 'business' | 'first';
  passengers: number;
}

export interface EnergyEmissionParams {
  energy_kwh: number;
  energy_type: 'electricity' | 'natural_gas' | 'heating_oil' | 'lpg';
  region?: string;
}

export interface FoodEmissionParams {
  food_type: string;
  weight_kg: number;
  origin?: string;
}

export interface PurchaseEmissionParams {
  category: string;
  spend_usd: number;
  currency?: string;
}

export interface ElectricityIntensity {
  zone: string;
  carbon_intensity: number;
  fossil_fuel_percentage: number;
  renewable_percentage: number;
  updated_at: string;
}

export interface CarbonBreakdown {
  transport: number;
  food: number;
  electricity: number;
  purchases: number;
  waste: number;
  other: number;
  total: number;
}

export interface MonthlyCarbon {
  month: string;
  year: number;
  total_kg: number;
  breakdown: CarbonBreakdown;
  vs_previous_month: number;
  vs_global_average: number;
}

export interface CarbonTrend {
  date: string;
  value: number;
  category?: ActivityCategory;
}

export interface SimulatorScenario {
  name: string;
  description: string;
  changes: Partial<{
    transport_mode: string;
    diet_type: string;
    flights_per_year: number;
    energy_kwh_monthly: number;
    car_km_weekly: number;
  }>;
  projected_monthly_kg: number;
  savings_kg: number;
  savings_percentage: number;
  equivalent_trees: number;
  equivalent_flights: number;
}
