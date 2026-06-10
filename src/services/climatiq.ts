import { Config } from '@/constants';
import type {
  CarbonEstimate,
  TransportEmissionParams,
  FlightEmissionParams,
  EnergyEmissionParams,
  FoodEmissionParams,
  PurchaseEmissionParams,
} from '@/types';

interface ClimatiqEstimateRequest {
  emission_factor: {
    activity_id: string;
    data_version?: string;
    region?: string;
  };
  parameters: Record<string, number | string>;
}

interface ClimatiqBatchItem {
  emission_factor: { activity_id: string; region?: string };
  parameters: Record<string, number | string>;
}

async function estimate(request: ClimatiqEstimateRequest): Promise<CarbonEstimate> {
  const response = await fetch(`${Config.climatiq.baseUrl}/estimate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${Config.climatiq.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error ?? `Climatiq API error: ${response.status}`);
  }

  return response.json();
}

async function batchEstimate(items: ClimatiqBatchItem[]): Promise<CarbonEstimate[]> {
  const response = await fetch(`${Config.climatiq.baseUrl}/batch`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${Config.climatiq.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ batch: items }),
  });

  if (!response.ok) {
    throw new Error(`Climatiq batch API error: ${response.status}`);
  }

  const data = await response.json();
  return data.results;
}

export async function estimateTransportEmissions(params: TransportEmissionParams): Promise<CarbonEstimate> {
  const activityMap: Record<string, string> = {
    car: 'passenger_vehicle-vehicle_type_car-fuel_source_petrol-engine_size_na-vehicle_age_na-vehicle_weight_na',
    bus: 'passenger_vehicle-vehicle_type_local_bus-fuel_source_na-engine_size_na-vehicle_age_na-vehicle_weight_na',
    train: 'passenger_train-route_type_commuter_rail-fuel_source_na',
    plane: 'passenger_flight-route_type_domestic-aircraft_type_na-distance_na-class_economy-rf_included',
    ferry: 'passenger_ferry-route_type_na-fuel_source_na',
    motorbike: 'passenger_vehicle-vehicle_type_motorbike-fuel_source_petrol-engine_size_na-vehicle_age_na-vehicle_weight_na',
    taxi: 'passenger_vehicle-vehicle_type_taxi-fuel_source_petrol-engine_size_na-vehicle_age_na-vehicle_weight_na',
    electric_vehicle: 'passenger_vehicle-vehicle_type_car-fuel_source_bev-engine_size_na-vehicle_age_na-vehicle_weight_na',
  };

  return estimate({
    emission_factor: {
      activity_id: activityMap[params.mode] ?? activityMap.car,
      data_version: '^6',
    },
    parameters: {
      distance: params.distance_km,
      distance_unit: 'km',
      ...(params.passengers ? { passengers: params.passengers } : {}),
    },
  });
}

export async function estimateFlightEmissions(params: FlightEmissionParams): Promise<CarbonEstimate> {
  return estimate({
    emission_factor: {
      activity_id: `passenger_flight-route_type_na-aircraft_type_na-distance_na-class_${params.cabin_class}-rf_included`,
      data_version: '^6',
    },
    parameters: {
      distance: 0,
      distance_unit: 'km',
      origin: params.origin,
      destination: params.destination,
      passengers: params.passengers,
    },
  });
}

export async function estimateEnergyEmissions(params: EnergyEmissionParams): Promise<CarbonEstimate> {
  const activityMap: Record<string, string> = {
    electricity: 'electricity-supply_grid-source_production_mix',
    natural_gas: 'fuel_type_natural_gas-fuel_use_na',
    heating_oil: 'fuel_type_heating_oil-fuel_use_na',
    lpg: 'fuel_type_lpg-fuel_use_na',
  };

  return estimate({
    emission_factor: {
      activity_id: activityMap[params.energy_type] ?? activityMap.electricity,
      data_version: '^6',
      ...(params.region ? { region: params.region } : {}),
    },
    parameters: {
      energy: params.energy_kwh,
      energy_unit: 'kWh',
    },
  });
}

export async function estimateFoodEmissions(params: FoodEmissionParams): Promise<CarbonEstimate> {
  return estimate({
    emission_factor: {
      activity_id: `food_type_${params.food_type.toLowerCase().replace(/\s+/g, '_')}-production_and_transport`,
      data_version: '^6',
    },
    parameters: {
      weight: params.weight_kg,
      weight_unit: 'kg',
    },
  });
}

export async function estimatePurchaseEmissions(params: PurchaseEmissionParams): Promise<CarbonEstimate> {
  return estimate({
    emission_factor: {
      activity_id: `consumer_goods-type_${params.category.toLowerCase().replace(/\s+/g, '_')}`,
      data_version: '^6',
    },
    parameters: {
      money: params.spend_usd,
      money_unit: params.currency ?? 'usd',
    },
  });
}

export const climatiqService = {
  estimateTransportEmissions,
  estimateFlightEmissions,
  estimateEnergyEmissions,
  estimateFoodEmissions,
  estimatePurchaseEmissions,
  batchEstimate,
};
