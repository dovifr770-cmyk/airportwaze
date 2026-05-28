# AirportWaze — Setup Guide

## 1. Install dependencies

```bash
npm install
```

## 2. Configure environment

```bash
cp .env.example .env
```

Fill in `.env`:
| Variable | Where to get it |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase dashboard → Settings → API |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Same page, anon/public key |
| `EXPO_PUBLIC_AVIATION_STACK_KEY` | https://aviationstack.com (free tier: 100 req/mo) |
| `EXPO_PUBLIC_MAPBOX_TOKEN` | https://mapbox.com → Tokens |

## 3. Create a Supabase project

1. Go to https://supabase.com → New project
2. Install Supabase CLI:  `npm install -g supabase`
3. Link your project:     `supabase login && supabase link --project-ref YOUR_REF`
4. Run migrations:        `supabase db push`
5. Generate TypeScript types: `npm run supabase:types`

## 4. Deploy Edge Functions

```bash
supabase functions deploy flight-sync
```

Set secrets:
```bash
supabase secrets set AVIATION_STACK_KEY=your-key
```

Schedule the sync (in Supabase Dashboard → Database → Extensions → pg_cron):
```sql
select cron.schedule('sync-flights', '*/2 * * * *', $$
  select net.http_post('https://YOUR_PROJECT.supabase.co/functions/v1/flight-sync',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb);
$$);
```

## 5. Run the app

```bash
# iOS simulator
npm run ios

# Android emulator
npm run android

# Expo Go (limited — some native modules won't work)
npm start
```

## 6. EAS Build (production)

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform all
```

---

## Architecture Overview

```
AirportWaze
├── app/                      # Expo Router (file-based routing)
│   ├── (auth)/               # Unauthenticated screens
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   └── (tabs)/               # Main tab navigator (requires auth)
│       ├── index.tsx          # Dashboard
│       ├── maps/index.tsx     # Airport interactive maps
│       ├── navigate/index.tsx # Connection navigator (Waze-like)
│       ├── parking/index.tsx  # Parking finder & pricing
│       └── profile/index.tsx  # Settings & account
│
├── src/
│   ├── types/                 # TypeScript interfaces
│   ├── stores/                # Zustand global state
│   ├── services/
│   │   ├── supabase/          # Auth, realtime, DB client
│   │   ├── flights/           # AviationStack API wrapper
│   │   └── navigation/        # Route & walking-time calculator
│   ├── hooks/                 # useAuth, useFlightData, useRealTime…
│   ├── config/                # Airport list, min connection times
│   └── utils/                 # Formatters, validators
│
└── supabase/
    ├── migrations/            # PostgreSQL schema + RLS policies
    └── functions/             # Edge Functions (flight sync, notifications)
```

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Mobile | React Native + **Expo SDK 51** | Cross-platform, OTA updates, rich ecosystem |
| Routing | **Expo Router v3** | File-based, typed routes, deep linking |
| Backend | **Supabase** | Real-time subscriptions, PostGIS, built-in auth, Edge Functions |
| Auth | Supabase Auth | Email/password + Apple/Google OAuth |
| State | **Zustand** | Minimal boilerplate, works great with React Native |
| Server state | **TanStack Query** | Caching, background refetch, stale-while-revalidate |
| Maps | **Mapbox** (`@rnmapbox/maps`) | Indoor map support, custom vector tiles |
| Styling | **NativeWind v4** | Tailwind utilities in React Native |
| Flight data | **AviationStack** API | Real-time flight status, gate/terminal info |
| Notifications | **Expo Notifications** + FCM | Gate changes, boarding alerts, connection risk |
