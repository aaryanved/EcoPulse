# EcoPulse — Carbon Intelligence Platform

A production-ready mobile app that helps users understand, track, predict and reduce their carbon footprint using AI, real-world emission data, and behavioral science.

---

## Features

| Feature | Status | API |
|---|---|---|
| Email auth + 4-step onboarding | ✅ | Supabase Auth |
| Activity logging with live estimates | ✅ | Climatiq + local fallback |
| Monthly carbon dashboard | ✅ | Supabase DB |
| Carbon category breakdown + trends | ✅ | react-native-svg charts |
| AI sustainability coach | ✅ | **Google Gemini 2.0 Flash** |
| Typewriter chat responses | ✅ | — |
| Weekly AI report | ✅ | Gemini + Supabase Edge Function |
| Reduction plan generator | ✅ | Gemini 1.5 Pro |
| Receipt scanner (OCR) | ✅ | Google Cloud Vision |
| Carbon Simulator (Twin + Time Machine) | ✅ | Personalized from user data |
| Carbon goals | ✅ | Supabase DB |
| Challenges & badges (Duolingo-style) | ✅ | Supabase DB |
| Global leaderboard | ✅ | Supabase DB + trigger |
| Live electricity grid intensity | ✅ | Electricity Maps API |
| Eco streaks | ✅ | Supabase DB |
| Animated splash screen | ✅ | Reanimated 3 |
| Data export (CSV via Share) | ✅ | React Native Share |
| Dark mode design system | ✅ | — |

---

## Tech Stack

**Frontend**
- React Native 0.74 + Expo SDK 51
- TypeScript (strict mode, 0 errors)
- Expo Router v3 (file-based navigation)
- Zustand (global state)
- Reanimated 3 (animations + typewriter)
- react-native-svg (charts without heavy deps)

**Backend**
- Supabase PostgreSQL (11 tables, full RLS)
- Supabase Auth (email/password, SecureStore session)
- 2 migrations + DB trigger for leaderboard ranks
- Deno Edge Function for weekly AI reports

**External APIs**
- Google Gemini 2.0 Flash / 1.5 Pro (AI coach)
- Climatiq (1M+ emission factors)
- Electricity Maps (real-time grid carbon intensity)
- Google Cloud Vision (receipt OCR)

---

## Project Structure

```
EcoPulse/
├── app/                        # Expo Router screens
│   ├── (auth)/                 # Login, Signup, Forgot Password
│   ├── (onboarding)/           # Transport → Diet → Energy → Shopping
│   ├── (tabs)/
│   │   ├── dashboard.tsx       # Hero card, AI insights, goals, live grid
│   │   ├── log.tsx             # Category → details with live Climatiq estimates
│   │   ├── coach.tsx           # Gemini chat with typewriter animation
│   │   ├── challenges.tsx      # Active/Available/Badges tabs
│   │   └── leaderboard.tsx     # Real DB rankings + podium
│   ├── simulator.tsx           # Carbon Twin + Time Machine (personalized)
│   ├── receipt-scanner.tsx     # Camera/gallery → OCR → save
│   ├── goals.tsx               # Create + track carbon goals
│   └── settings.tsx            # Profile, notifications, export, grid zone
│
├── src/
│   ├── components/
│   │   ├── ui/                 # Text, Button, Card, Input, Badge, ProgressBar, etc.
│   │   └── carbon/             # CarbonMeter, ActivityCard, RecommendationCard,
│   │                           # GoalCard, GridIntensityCard, CategoryBreakdown
│   ├── services/
│   │   ├── gemini.ts           # AI service + deep system prompt
│   │   ├── climatiq.ts         # Carbon emission factor API
│   │   ├── electricityMaps.ts  # Live grid intensity
│   │   ├── googleVision.ts     # Receipt OCR + carbon estimation
│   │   ├── supabase.ts         # Auth client (SecureStore)
│   │   └── database.ts         # Typed Supabase data layer
│   ├── stores/                 # auth, carbon, challenge, goal,
│   │                           # recommendation, leaderboard (Zustand)
│   ├── hooks/                  # useAuth, useCarbon, useChallenges,
│   │                           # useGoals, useRecommendations,
│   │                           # useClimatiqEstimate, useGridIntensity
│   ├── types/                  # database.ts, carbon.ts, index.ts
│   ├── utils/                  # carbon.ts, date.ts, index.ts
│   └── constants/              # theme.ts (design tokens), config.ts
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql      # 11 tables, RLS, seed data
│   │   └── 002_leaderboard_view_and_functions.sql
│   └── functions/
│       └── weekly-report/index.ts      # Deno → Gemini → save recommendation
│
└── assets/images/              # App icons + splash
```

---

## Quick Start

### 1. Install

```bash
git clone <repo-url>
cd EcoPulse
npm install --cache /tmp/npm-cache-ecopulse
```

### 2. Environment

```bash
cp .env.example .env
```

Fill in `.env`:

| Variable | Source |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Same location |
| `SUPABASE_SERVICE_ROLE_KEY` | Same (server-side only, never expose) |
| `EXPO_PUBLIC_GEMINI_API_KEY` | [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) |
| `EXPO_PUBLIC_CLIMATIQ_API_KEY` | [climatiq.io](https://climatiq.io) |
| `EXPO_PUBLIC_ELECTRICITY_MAPS_API_KEY` | [electricitymaps.com](https://electricitymaps.com) |
| `EXPO_PUBLIC_GOOGLE_VISION_API_KEY` | Google Cloud Console → Vision API |

**All API keys are optional for development** — the app gracefully degrades:
- No Gemini key → coach shows a configuration error
- No Climatiq key → log screen uses local emission factors (labeled "local")
- No Electricity Maps key → GridIntensityCard hides silently
- No Vision key → receipt scanner shows an error on scan

### 3. Supabase setup

1. Create a project at [supabase.com](https://supabase.com)
2. In SQL Editor, run `supabase/migrations/001_initial_schema.sql`
3. Then run `supabase/migrations/002_leaderboard_view_and_functions.sql`

### 4. Deploy edge function (optional)

```bash
npx supabase functions deploy weekly-report --project-ref <your-ref>
npx supabase secrets set GEMINI_API_KEY=your-gemini-key --project-ref <your-ref>
```

### 5. Run

```bash
npx expo start
# Press i for iOS simulator, a for Android, w for web
```

---

## AI Coach — System Prompt Design

The Gemini system prompt (`src/services/gemini.ts → buildSystemPrompt`) is rebuilt on every request with the user's live carbon data. Key design principles:

- **Max 180 words** — forces high information density, no padding
- **Specificity mandate** — must reference exact kg figures ("your 85 kg transport footprint", not "your transport")
- **Action close** — every response ends with a single `**Action:**` line
- **Filler ban** — explicitly bans "Great question!", "Absolutely!", etc.
- **Low-footprint mode** — switches to optimization advice when total < 150 kg/month
- **Internal QA step** — prompt includes self-verification: "Would a knowledgeable friend give more specific advice? If yes, rewrite."
- **Behavior science** — includes motivational interviewing principles and identity-based change framing

Weekly reports use Gemini 2.0 Flash (4-sentence structured format).
Reduction plans use Gemini 1.5 Pro (more reasoning capacity for multi-step plans).

---

## Carbon Emission Methodology

**Live API estimates** (shown as `Climatiq` badge in log screen):
- Transport: DEFRA 2023 + IPCC AR6 factors via Climatiq
- Food: lifecycle assessment (Poore & Nemecek 2018 methodology)
- Energy: national/regional grid mix from Climatiq
- Purchases: EEIO spend-based factors

**Local fallback** (shown as `local` badge, used when no API key or API error):
- Same scientific sources, hardcoded as static factors
- Transport: 0.192 kg/km (petrol car) down to 0.041 kg/km (train)
- Food: 27 kg/kg (beef) down to 0.4 kg/kg (vegetables)
- Energy: 0.233 kg/kWh (global grid average)

---

## Carbon Simulator Logic

The simulator uses **personalized savings** based on the user's actual current-month breakdown:

- **Public transit**: 55% of current transport (0 if already on transit)
- **EV**: 65% of transport (0 if already driving EV)
- **Vegetarian**: 50% of food (scales down for flexitarians; 0 if already veg)
- **Vegan**: 65% of food (scales based on current diet)
- **Green energy**: 80% of electricity (0 if already on renewables)
- **WFH 3 days**: 24% of transport (0 if not car-dependent)
- **Reduce shopping**: 50% of purchases

The "Ask AI" button passes the active scenario to the Gemini coach with full context pre-filled.

---

## Design System

Dark-mode-first, emerald/forest green palette. Key tokens in `src/constants/theme.ts`:

```
Background: #0a0f0a → #1f2b1f (elevated)
Accent:     #10b981 (emerald-500)
Text:       #f0fdf4 (primary) / #34d399 (secondary) / #4ade80 (muted)
Carbon:     Low #10b981 / Medium #f59e0b / High #f97316 / Critical #ef4444
```

Inspired by Apple Health (data density), Stripe (clean cards), Duolingo (gamification).

---

## License

MIT — built for a greener planet.
