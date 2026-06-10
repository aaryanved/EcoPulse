import { useState, useEffect, useRef } from 'react';
import {
  estimateTransportEmissions,
  estimateEnergyEmissions,
  estimateFoodEmissions,
  estimatePurchaseEmissions,
} from '@/services/climatiq';
import { Config } from '@/constants';

export type EstimateSource = 'climatiq' | 'local';

export interface UseClimatiqEstimateResult {
  carbonKg: number;
  source: EstimateSource;
  factorName: string | null;
  isLoading: boolean;
}

const LOCAL_FACTORS: Record<string, number> = {
  car_petrol: 0.192,
  car_diesel: 0.171,
  car_electric: 0.053,
  bus: 0.089,
  train: 0.041,
  flight_short: 255,
  flight_long: 895,
  taxi: 0.149,
  beef: 27,
  chicken: 5.7,
  fish: 6.1,
  dairy: 3.2,
  vegetables: 0.4,
  grains: 1.4,
  meal_restaurant: 2.1,
  meal_takeout: 1.8,
  home_electricity: 0.233,
  natural_gas: 0.203,
  heating_oil: 2.68,
  clothing: 0.025,
  electronics: 0.04,
  furniture: 0.03,
  online_shopping: 0.02,
  general_waste: 0.57,
  recycling: -0.15,
  compost: -0.2,
  custom: 1,
};

// Subcategories with working Climatiq API mappings
const CLIMATIQ_SUPPORTED = new Set([
  'car_petrol', 'car_electric', 'bus', 'train', 'taxi',
  'beef', 'chicken', 'fish', 'dairy', 'vegetables', 'grains',
  'home_electricity', 'natural_gas',
  'clothing', 'electronics', 'furniture', 'online_shopping',
]);

async function callClimatiqApi(
  subcategoryId: string,
  quantity: number
): Promise<{ co2e: number; name: string }> {
  switch (subcategoryId) {
    case 'car_petrol': {
      const r = await estimateTransportEmissions({ mode: 'car', distance_km: quantity });
      return { co2e: r.co2e, name: r.emission_factor.name };
    }
    case 'car_electric': {
      const r = await estimateTransportEmissions({ mode: 'electric_vehicle', distance_km: quantity });
      return { co2e: r.co2e, name: r.emission_factor.name };
    }
    case 'bus': {
      const r = await estimateTransportEmissions({ mode: 'bus', distance_km: quantity });
      return { co2e: r.co2e, name: r.emission_factor.name };
    }
    case 'train': {
      const r = await estimateTransportEmissions({ mode: 'train', distance_km: quantity });
      return { co2e: r.co2e, name: r.emission_factor.name };
    }
    case 'taxi': {
      const r = await estimateTransportEmissions({ mode: 'taxi', distance_km: quantity });
      return { co2e: r.co2e, name: r.emission_factor.name };
    }
    case 'beef': {
      const r = await estimateFoodEmissions({ food_type: 'beef', weight_kg: quantity });
      return { co2e: r.co2e, name: r.emission_factor.name };
    }
    case 'chicken': {
      const r = await estimateFoodEmissions({ food_type: 'poultry', weight_kg: quantity });
      return { co2e: r.co2e, name: r.emission_factor.name };
    }
    case 'fish': {
      const r = await estimateFoodEmissions({ food_type: 'fish', weight_kg: quantity });
      return { co2e: r.co2e, name: r.emission_factor.name };
    }
    case 'dairy': {
      const r = await estimateFoodEmissions({ food_type: 'dairy', weight_kg: quantity });
      return { co2e: r.co2e, name: r.emission_factor.name };
    }
    case 'vegetables': {
      const r = await estimateFoodEmissions({ food_type: 'vegetables', weight_kg: quantity });
      return { co2e: r.co2e, name: r.emission_factor.name };
    }
    case 'grains': {
      const r = await estimateFoodEmissions({ food_type: 'grain', weight_kg: quantity });
      return { co2e: r.co2e, name: r.emission_factor.name };
    }
    case 'home_electricity': {
      const r = await estimateEnergyEmissions({ energy_type: 'electricity', energy_kwh: quantity });
      return { co2e: r.co2e, name: r.emission_factor.name };
    }
    case 'natural_gas': {
      const r = await estimateEnergyEmissions({ energy_type: 'natural_gas', energy_kwh: quantity });
      return { co2e: r.co2e, name: r.emission_factor.name };
    }
    case 'clothing': {
      const r = await estimatePurchaseEmissions({ category: 'clothing', spend_usd: quantity });
      return { co2e: r.co2e, name: r.emission_factor.name };
    }
    case 'electronics': {
      const r = await estimatePurchaseEmissions({ category: 'electronics', spend_usd: quantity });
      return { co2e: r.co2e, name: r.emission_factor.name };
    }
    case 'furniture': {
      const r = await estimatePurchaseEmissions({ category: 'furniture', spend_usd: quantity });
      return { co2e: r.co2e, name: r.emission_factor.name };
    }
    case 'online_shopping': {
      const r = await estimatePurchaseEmissions({ category: 'retail', spend_usd: quantity });
      return { co2e: r.co2e, name: r.emission_factor.name };
    }
    default:
      throw new Error(`No Climatiq mapping for: ${subcategoryId}`);
  }
}

const DEBOUNCE_MS = 650;

export function useClimatiqEstimate(
  subcategoryId: string | null,
  quantity: number
): UseClimatiqEstimateResult {
  const localFactor = subcategoryId ? (LOCAL_FACTORS[subcategoryId] ?? 1) : 1;
  const localCarbon = quantity > 0 ? quantity * localFactor : 0;

  const [state, setState] = useState<UseClimatiqEstimateResult>({
    carbonKg: localCarbon,
    source: 'local',
    factorName: null,
    isLoading: false,
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!subcategoryId || quantity <= 0) {
      setState({ carbonKg: 0, source: 'local', factorName: null, isLoading: false });
      return;
    }

    const canUseApi = CLIMATIQ_SUPPORTED.has(subcategoryId) && !!Config.climatiq.apiKey;

    // Immediately show local estimate so UI is always responsive
    setState(prev => ({
      ...prev,
      carbonKg: localCarbon,
      source: 'local',
      isLoading: canUseApi,
    }));

    if (!canUseApi) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    cancelledRef.current = false;

    timerRef.current = setTimeout(async () => {
      try {
        const result = await callClimatiqApi(subcategoryId, quantity);
        if (cancelledRef.current) return;
        setState({
          carbonKg: result.co2e,
          source: 'climatiq',
          factorName: result.name,
          isLoading: false,
        });
      } catch {
        if (cancelledRef.current) return;
        // API failed — stay on local estimate, silently
        setState({
          carbonKg: localCarbon,
          source: 'local',
          factorName: null,
          isLoading: false,
        });
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelledRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [subcategoryId, quantity]);

  return state;
}
