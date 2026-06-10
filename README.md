# EcoPulse

Carbon Footprint Awareness Platform — track, understand, and reduce your environmental impact with AI.

## Tech Stack

- **Frontend**: React Native + Expo SDK 51 + TypeScript + Expo Router
- **Backend**: Supabase (PostgreSQL + Edge Functions + Auth)
- **State**: Zustand
- **AI**: DeepSeek API
- **Carbon APIs**: Climatiq, Electricity Maps, IATA CO2 Connect
- **OCR**: Google Vision API
- **Animations**: Reanimated 3 + Lottie

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Fill in your API keys
```

Required keys:
- `EXPO_PUBLIC_SUPABASE_URL` — from Supabase project settings
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — from Supabase project settings
- `EXPO_PUBLIC_CLIMATIQ_API_KEY` — from climatiq.io
- `EXPO_PUBLIC_ELECTRICITY_MAPS_API_KEY` — from electricitymaps.com
- `EXPO_PUBLIC_DEEPSEEK_API_KEY` — from platform.deepseek.com
- `EXPO_PUBLIC_GOOGLE_VISION_API_KEY` — from Google Cloud Console

### 3. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the migration in `supabase/migrations/001_initial_schema.sql` via the SQL editor
3. Copy your project URL and anon key to `.env`

### 4. Run the app

```bash
npm run ios      # iOS
npm run android  # Android
npm run web      # Web
```

## Features

- **Dashboard** — Monthly carbon overview, category breakdown, trends
- **Activity Logging** — Transport, food, electricity, purchases with real emission factors
- **AI Coach** — DeepSeek-powered sustainability assistant
- **Receipt Scanner** — Google Vision OCR + automatic carbon categorization
- **Carbon Simulator** — What-if scenarios, Carbon Time Machine (5-year projections)
- **Challenges** — Duolingo-style streaks and eco-challenges
- **Leaderboard** — Global and friends rankings
- **Weekly Reports** — AI-generated sustainability summaries

## Architecture

```
app/                    # Expo Router file-based navigation
├── (auth)/             # Login, signup, forgot password
├── (onboarding)/       # 4-step user onboarding
├── (tabs)/             # Main tab screens
├── simulator.tsx       # Carbon simulator modal
├── receipt-scanner.tsx # OCR receipt scanner modal
└── settings.tsx        # User settings

src/
├── components/         # UI, carbon, chart components
├── hooks/              # useAuth, useCarbon
├── services/           # API clients (Supabase, Climatiq, DeepSeek, etc.)
├── stores/             # Zustand state (auth, carbon, onboarding)
├── types/              # TypeScript interfaces
├── utils/              # Carbon math, date helpers
└── constants/          # Theme, colors, config

supabase/
├── migrations/         # Database schema + RLS policies
└── functions/          # Edge Functions
```

## License

MIT
