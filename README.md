# EcoPulse

EcoPulse is a carbon intelligence platform that helps people understand, track, and reduce their environmental impact — powered by AI, real-world emission data, and behavioral science.

**Live demo:** [EcoPulse on bhalla.info](https://bhalla.info/projects/ecopulse)

---

## Table of Contents

- [What it does](#what-it-does)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [License](#license)

---

## What it does

EcoPulse gives users a clear picture of their carbon footprint across transport, food, energy, and shopping — and actively helps them reduce it. Users log activities, scan receipts, set goals, and get AI-powered coaching grounded in their actual data.

---

## Features

### Activity tracking
Log everyday activities — driving, flights, meals, energy use, and purchases — and get live CO₂ estimates from Climatiq's database of over 1 million emission factors.

### AI sustainability coach
Chat with an AI coach powered by Google Gemini. Responses are grounded in the user's real carbon data, not generic advice.

### Receipt scanner
Point the camera at a receipt and Google Cloud Vision OCR reads the items. The app then estimates the carbon cost of each purchase automatically.

### Carbon simulator
A personal "what if" tool that models the impact of lifestyle changes — switching to public transit, going vegetarian, working from home, and more — before a user commits to them.

### Weekly AI reports
Automatically generated summaries that surface personalized reduction opportunities and track progress over time.

### Challenges and streaks
Duolingo-style habit-building: join eco-challenges, maintain streaks, earn badges, and see how you rank on a global leaderboard.

### Live grid intensity
Real-time electricity carbon intensity from Electricity Maps, so users know when their local grid is cleanest and can time high-energy tasks accordingly.

---

## Tech stack

| Layer | Technology |
|---|---|
| Mobile and web | React Native, Expo |
| Language | TypeScript |
| Navigation | Expo Router |
| State management | Zustand |
| Backend and auth | Supabase (PostgreSQL with row-level security) |
| AI coach | Google Gemini |
| Emission estimates | Climatiq API |
| Grid intensity | Electricity Maps API |
| Receipt scanning | Google Cloud Vision OCR |

---

## Getting started

### Prerequisites

- Node.js 18 or later
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- A Supabase project with the schema from `supabase/`

### Install dependencies

```bash
npm install
```

### Run on iOS or Android

```bash
npx expo start
```

Then press `i` for iOS simulator, `a` for Android emulator, or scan the QR code with the Expo Go app.

### Run on web

```bash
npx expo start --web
```

---

## Environment variables

Create a `.env.local` file in the project root and add the following keys:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
EXPO_PUBLIC_CLIMATIQ_API_KEY=your_climatiq_api_key
EXPO_PUBLIC_ELECTRICITY_MAPS_API_KEY=your_electricity_maps_key
EXPO_PUBLIC_GOOGLE_VISION_API_KEY=your_google_vision_key
```

---

## License

MIT — built for a greener planet.
