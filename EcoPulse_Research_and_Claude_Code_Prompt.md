# EcoPulse – Carbon Footprint Awareness Platform

## Recommended Architecture

```text
User
 ↓
React Native (Expo)
 ↓
Supabase Backend
 ↓
Carbon Intelligence Layer
 ├── Climatiq API
 ├── Electricity Maps API
 ├── IATA CO2 Connect API
 ├── OCR (Google Vision)
 └── DeepSeek/OpenAI
```

---

# 1. Core Carbon Calculation API (MUST HAVE)

## Climatiq

Features:

- Transportation emissions
- Flights
- Energy usage
- Food estimates
- Purchases
- Waste
- Scope 1/2/3 calculations
- Over 1 million emission factors
- REST API
- Batch calculations
- Country-specific factors

Documentation:

- https://www.climatiq.io/docs
- https://www.climatiq.io/docs/guides/climatiq-product-suite/api/getting-started/quickstart
- https://www.climatiq.io/docs/api-reference/estimate

---

# 2. Electricity Carbon Intensity API

## Electricity Maps

Why:

Carbon impact of electricity varies by:

- Country
- Region
- Time of day

Documentation:

- https://portal.electricitymaps.com/docs

Use Cases:

- Home energy dashboard
- Real-time carbon tracking
- Smart recommendations

---

# 3. Flight Carbon API

## IATA CO2 Connect

Documentation:

- https://api.developer.iata.org/category/Environmental%20Sustainability

---

# 4. Aviation Backup API

## ICAO Carbon Emissions Calculator API

Documentation:

- https://www.icao.int/environmental-protection/environmental-tools/icec/icec-api

---

# 5. Travel Carbon API

## Travel CO₂

Documentation:

- https://travelco2.com/documentation

---

# 6. Receipt Scanner

## Google Vision OCR

Documentation:

- https://cloud.google.com/vision/docs/ocr

Workflow:

```text
Receipt
 ↓
OCR
 ↓
Extract Products
 ↓
AI Categorization
 ↓
Climatiq Estimate
```

---

# 7. AI Sustainability Coach

## DeepSeek API

Documentation:

- https://platform.deepseek.com

Functions:

- Personalized recommendations
- Weekly sustainability reports
- Carbon reduction plans
- Goal tracking

---

# 8. Database

## Supabase

Documentation:

- https://supabase.com/docs

Tables:

```sql
users

activities

carbon_entries

challenges

badges

goals

ai_recommendations

receipts

leaderboards
```

---

# Features That Could Win a Hackathon

## Carbon Twin

Create a digital twin of the user.

Example:

Current lifestyle:

- 220 kg CO₂/month

Future lifestyle:

- 160 kg CO₂/month

Visualized as two Earths.

---

## Carbon Time Machine

User asks:

"What would happen if I kept my current habits for 5 years?"

Show:

- Total emissions
- Equivalent trees needed
- Equivalent flights

---

## Eco Streaks

Like Duolingo.

Examples:

- Public Transport Streak
- Vegetarian Meal Streak
- Low Energy Week

---

## AI Weekly Sustainability Report

Every Sunday:

```text
You emitted:

178 kg CO₂

Top Source:
Transportation (48%)

Great Job:
Electricity down 12%

Next Goal:
Reduce transport emissions by 8%
```

---

# Claude Code Master Prompt

```text
You are a senior staff engineer and award-winning product designer.

Build a production-ready mobile-first application called "EcoPulse".

Purpose:
Help users understand, track, predict and reduce their carbon footprint using AI and real-world emissions data.

Tech Stack:

Frontend:
- React Native
- Expo
- TypeScript
- Expo Router
- React Native Paper

Backend:
- Supabase
- PostgreSQL
- Edge Functions

AI:
- DeepSeek API

Carbon APIs:
- Climatiq API (primary)
- Electricity Maps API
- IATA CO2 Connect API

Authentication:
- Supabase Auth

State Management:
- Zustand

Charts:
- Victory Native

Animations:
- Reanimated
- Lottie

Design System:

Theme:
- Dark mode by default
- Emerald green
- Forest green
- White accents

Style:
- Apple Health
- Stripe Dashboard
- Duolingo Gamification

Create the following screens:

1. Splash Screen
- Animated Earth
- Carbon particles
- App logo

2. Authentication
- Login
- Signup
- Forgot Password

3. Onboarding
- Transportation habits
- Diet habits
- Energy habits
- Shopping habits

4. Dashboard
- Monthly carbon footprint
- Breakdown by category
- Trends
- Reduction score

5. Activity Logging
- Travel
- Food
- Electricity
- Purchases

6. Receipt Scanner
- Camera integration
- OCR extraction
- Automatic categorization

7. AI Coach
- Chat interface
- Personalized recommendations
- Reduction plans

8. Carbon Simulator
- What-if scenarios
- Lifestyle comparisons
- Future projections

9. Challenges
- Streaks
- Rewards
- Badges

10. Leaderboard
- Friends
- Schools
- Companies

11. Settings
- Profile
- Notification settings
- Data export

Backend Requirements:

- Complete Supabase schema
- Row Level Security policies
- Database migrations
- Edge Functions
- API integrations

AI Features:

- Weekly sustainability reports
- Carbon reduction planning
- Personalized recommendations
- Goal prediction

Analytics:

- Carbon trend forecasting
- Monthly summaries
- Emission source detection

Create:

1. Full folder structure
2. All source code
3. Database schema
4. API integration code
5. Environment variable setup
6. Deployment instructions
7. README
8. Production-ready architecture

Generate the project step-by-step and write complete code for every file.
Never use placeholders.
Always provide complete working implementations.
```
