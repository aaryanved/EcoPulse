import { useState, useEffect, useCallback } from 'react';
import { getCarbonIntensity } from '@/services/electricityMaps';
import { Config } from '@/constants';

export interface GridIntensityState {
  zone: string;
  intensityGCo2PerKwh: number;
  fossilPercent: number;
  renewablePercent: number;
  updatedAt: string | null;
  isLoading: boolean;
  error: string | null;
}

const DEFAULT_INTENSITY_G = 233; // global average g CO₂/kWh
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Module-level cache survives re-renders; resets on app reload (acceptable)
const cache = new Map<string, { data: GridIntensityState; expiresAt: number }>();

function getInitialState(zone: string): GridIntensityState {
  const hit = cache.get(zone);
  if (hit && Date.now() < hit.expiresAt) return hit.data;
  return {
    zone,
    intensityGCo2PerKwh: DEFAULT_INTENSITY_G,
    fossilPercent: 0,
    renewablePercent: 0,
    updatedAt: null,
    isLoading: !!Config.electricityMaps.apiKey,
    error: null,
  };
}

export function useGridIntensity(zone: string = 'US-CA'): GridIntensityState & { refresh: () => void } {
  const [state, setState] = useState<GridIntensityState>(() => getInitialState(zone));

  const fetchIntensity = useCallback(async () => {
    if (!Config.electricityMaps.apiKey) return;

    const hit = cache.get(zone);
    if (hit && Date.now() < hit.expiresAt) {
      setState(hit.data);
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await getCarbonIntensity(zone);
      const next: GridIntensityState = {
        zone,
        intensityGCo2PerKwh: data.carbon_intensity,
        fossilPercent: data.fossil_fuel_percentage,
        renewablePercent: data.renewable_percentage,
        updatedAt: data.updated_at,
        isLoading: false,
        error: null,
      };
      cache.set(zone, { data: next, expiresAt: Date.now() + CACHE_TTL_MS });
      setState(next);
    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch grid data',
      }));
    }
  }, [zone]);

  useEffect(() => {
    fetchIntensity();
  }, [fetchIntensity]);

  return { ...state, refresh: fetchIntensity };
}
