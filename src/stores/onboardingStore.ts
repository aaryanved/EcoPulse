import { create } from 'zustand';
import type { OnboardingData } from '@/types';

interface OnboardingState {
  data: Partial<OnboardingData>;
  currentStep: number;
  totalSteps: number;

  setField: <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
}

const initialData: Partial<OnboardingData> = {
  transport_mode: undefined,
  diet_type: undefined,
  energy_source: undefined,
  shopping_frequency: undefined,
  country_code: 'US',
  monthly_goal: 200,
};

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  data: { ...initialData },
  currentStep: 0,
  totalSteps: 4,

  setField: (key, value) =>
    set(state => ({ data: { ...state.data, [key]: value } })),

  nextStep: () =>
    set(state => ({
      currentStep: Math.min(state.currentStep + 1, state.totalSteps - 1),
    })),

  prevStep: () =>
    set(state => ({
      currentStep: Math.max(state.currentStep - 1, 0),
    })),

  reset: () => set({ data: { ...initialData }, currentStep: 0 }),
}));
