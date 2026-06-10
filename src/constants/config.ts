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
  deepseek: {
    apiKey: process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY ?? '',
    baseUrl: 'https://api.deepseek.com',
    model: 'deepseek-chat',
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
