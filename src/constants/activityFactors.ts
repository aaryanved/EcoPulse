import type { ActivityCategory } from '@/types';

export interface Subcategory {
  id: string;
  label: string;
  unit: string;
  kgPerUnit: number;
}

export const SUBCATEGORIES: Record<ActivityCategory, Subcategory[]> = {
  transport: [
    { id: 'car_petrol', label: 'Car (Petrol)', unit: 'km', kgPerUnit: 0.192 },
    { id: 'car_diesel', label: 'Car (Diesel)', unit: 'km', kgPerUnit: 0.171 },
    { id: 'car_electric', label: 'Electric Car', unit: 'km', kgPerUnit: 0.053 },
    { id: 'bus', label: 'Bus', unit: 'km', kgPerUnit: 0.089 },
    { id: 'train', label: 'Train', unit: 'km', kgPerUnit: 0.041 },
    { id: 'flight_short', label: 'Short Flight (<3h)', unit: 'flight', kgPerUnit: 255 },
    { id: 'flight_long', label: 'Long Flight (>3h)', unit: 'flight', kgPerUnit: 895 },
    { id: 'taxi', label: 'Taxi / Rideshare', unit: 'km', kgPerUnit: 0.149 },
  ],
  food: [
    { id: 'beef', label: 'Beef / Lamb', unit: 'kg', kgPerUnit: 27 },
    { id: 'chicken', label: 'Chicken / Pork', unit: 'kg', kgPerUnit: 5.7 },
    { id: 'fish', label: 'Fish / Seafood', unit: 'kg', kgPerUnit: 6.1 },
    { id: 'dairy', label: 'Dairy', unit: 'kg', kgPerUnit: 3.2 },
    { id: 'vegetables', label: 'Vegetables', unit: 'kg', kgPerUnit: 0.4 },
    { id: 'grains', label: 'Grains / Bread', unit: 'kg', kgPerUnit: 1.4 },
    { id: 'meal_restaurant', label: 'Restaurant Meal', unit: 'meal', kgPerUnit: 2.1 },
    { id: 'meal_takeout', label: 'Takeout / Delivery', unit: 'meal', kgPerUnit: 1.8 },
  ],
  electricity: [
    { id: 'home_electricity', label: 'Home Electricity', unit: 'kWh', kgPerUnit: 0.233 },
    { id: 'natural_gas', label: 'Natural Gas', unit: 'kWh', kgPerUnit: 0.203 },
    { id: 'heating_oil', label: 'Heating Oil', unit: 'litre', kgPerUnit: 2.68 },
  ],
  purchases: [
    { id: 'clothing', label: 'Clothing', unit: 'USD', kgPerUnit: 0.025 },
    { id: 'electronics', label: 'Electronics', unit: 'USD', kgPerUnit: 0.04 },
    { id: 'furniture', label: 'Furniture', unit: 'USD', kgPerUnit: 0.03 },
    { id: 'online_shopping', label: 'Online Shopping', unit: 'USD', kgPerUnit: 0.02 },
  ],
  waste: [
    { id: 'general_waste', label: 'General Waste', unit: 'kg', kgPerUnit: 0.57 },
    { id: 'recycling', label: 'Recycling (saved)', unit: 'kg', kgPerUnit: -0.15 },
    { id: 'compost', label: 'Composting (saved)', unit: 'kg', kgPerUnit: -0.2 },
  ],
  other: [
    { id: 'custom', label: 'Custom Entry', unit: 'kg CO₂', kgPerUnit: 1 },
  ],
};

export function getSubcategory(id: string): Subcategory | undefined {
  return Object.values(SUBCATEGORIES).flat().find(s => s.id === id);
}

export function estimateLocalCarbon(subcategoryId: string, quantity: number): number {
  const sub = getSubcategory(subcategoryId);
  if (!sub) return 0;
  return sub.kgPerUnit * quantity;
}
