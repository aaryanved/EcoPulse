export const Config = {
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  },
  climatiq: {
    apiKey: process.env.EXPO_PUBLIC_CLIMATIQ_API_KEY ?? '',
    baseUrl: 'https://beta3.api.climatiq.io',
  },
  electricityMaps: {
    apiKey: process.env.EXPO_PUBLIC_ELECTRICITY_MAPS_API_KEY ?? '',
    baseUrl: 'https://api.electricitymap.org/v3',
  },
  iata: {
    apiKey: process.env.EXPO_PUBLIC_IATA_API_KEY ?? '',
    baseUrl: 'https://api.developer.iata.org',
  },
  gemini: {
    apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    model: 'gemini-2.0-flash',
    proModel: 'gemini-1.5-pro',
  },
  openRouter: {
    apiKey: process.env.EXPO_PUBLIC_OPENROUTER_API_KEY ?? '',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'deepseek/deepseek-v4-flash',
    proModel: 'deepseek/deepseek-r1-0528',
  },
  googleVision: {
    apiKey: process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY ?? '',
    baseUrl: 'https://vision.googleapis.com/v1',
  },
} as const;

export const APP_CONFIG = {
  name: 'EcoPulse',
  version: '1.0.0',
  defaultCurrency: 'USD',
  defaultUnit: 'kg',
  carbonGoalDefault: 200,
  streakGracePeriodHours: 12,
} as const;
