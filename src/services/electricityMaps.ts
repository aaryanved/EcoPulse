import { Config } from '@/constants';
import type { ElectricityIntensity } from '@/types';

export async function getCarbonIntensity(zone: string): Promise<ElectricityIntensity> {
  const response = await fetch(
    `${Config.electricityMaps.baseUrl}/carbon-intensity/latest?zone=${zone}`,
    {
      headers: {
        'auth-token': Config.electricityMaps.apiKey,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Electricity Maps API error: ${response.status}`);
  }

  const data = await response.json();

  return {
    zone,
    carbon_intensity: data.carbonIntensity,
    fossil_fuel_percentage: data.fossilFuelPercentage ?? 0,
    renewable_percentage: data.renewablePercentage ?? 0,
    updated_at: data.datetime,
  };
}

export async function getPowerBreakdown(zone: string): Promise<{
  renewables: number;
  fossil: number;
  nuclear: number;
  unknown: number;
}> {
  const response = await fetch(
    `${Config.electricityMaps.baseUrl}/power-breakdown/latest?zone=${zone}`,
    {
      headers: {
        'auth-token': Config.electricityMaps.apiKey,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Electricity Maps power breakdown error: ${response.status}`);
  }

  const data = await response.json();
  const total = data.totalConsumption ?? 1;

  return {
    renewables: Math.round(((data.renewableConsumption ?? 0) / total) * 100),
    fossil: Math.round(((data.fossilFuelConsumption ?? 0) / total) * 100),
    nuclear: Math.round(((data.nuclearConsumption ?? 0) / total) * 100),
    unknown: Math.round(((data.unknownConsumption ?? 0) / total) * 100),
  };
}

export const electricityMapsService = {
  getCarbonIntensity,
  getPowerBreakdown,
};
