# AirportWaze — Local Dev Run Guide

Everything below assumes you're in the project root:
```
C:\Users\1\קלוד קוד\אלפלקציה מפות שדות תעופה\
```

---

## ① Install dependencies (first time only)

```bash
npm install
```

---

## ② Create your .env file (first time only)

Copy the example:
```bash
cp .env.example .env
```

For local mock-only testing you can leave every value as a placeholder —  
the app runs entirely on in-memory mock data in `__DEV__` mode:

```
EXPO_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=placeholder_key
EXPO_PUBLIC_AVIATION_STACK_KEY=placeholder
EXPO_PUBLIC_MAPBOX_TOKEN=placeholder
EXPO_PUBLIC_APP_ENV=development
```

> **Tip:** Supabase calls will fail silently (error caught in the store)  
> and the app falls back to the built-in mock data automatically.

---

## ③ Start the Expo dev server

```bash
npx expo start
```

You'll see a QR code and a menu like this:

```
  › Press a │ open Android
  › Press i │ open iOS simulator
  › Press w │ open web browser
  › Press r │ reload app
  › Press m │ toggle menu
```

---

## ④ Open on your device

### Physical phone — Expo Go (fastest, no setup)

1. Install **Expo Go** from the App Store / Play Store
2. Make sure your phone and computer are on **the same Wi-Fi network**
3. **Android:** open Expo Go → tap "Scan QR code" → scan the terminal QR
4. **iPhone:**  open the Camera app → scan the QR → tap the banner

### Android Emulator (requires Android Studio)

```bash
# Start the emulator first, then:
npx expo start --android
# or press 'a' in the Expo menu
```

### iOS Simulator (macOS only, requires Xcode)

```bash
npx expo start --ios
# or press 'i' in the Expo menu
```

---

## ⑤ What you'll see on first launch

Because `__DEV__ = true`, the app automatically:

| What | Detail |
|---|---|
| **Skips login** | A mock user (`dev@airportwaze.app`) is injected — you land straight on the Dashboard tab |
| **6 flights pre-loaded** | UA 123/DL 456 (JFK tight), AA 200/B6 300 (ATL safe), UA 500/UA 600 (DEN at-risk/delayed) |
| **5 crowd reports active** | Heavy security line, crowded gate B12, passport control delay, elevator out, clear at C3 |
| **⚙ DEV chip** | Visible top-right on every tab — tap to open the scenario switcher panel |

---

## ⑥ Test each feature

### Connection Navigator (the core feature)

1. Tap **Navigate** tab
2. Enter one of these pairs:

| Pair | Scenario |
|---|---|
| `UA 123` → `DL 456` | Tight 90-min JFK connection |
| `AA 200` → `B6 300` | Safe 2-hour ATL connection |
| `UA 500` → `UA 600` | At-risk DEN connection (inbound delayed 17 min) |
| `MOCK` → `MOCK` | Full 7-step walk-through (JFK T4 B12 → C3) |

3. Tap **Find My Route** → Dashboard loads with countdown ring + crowd banners
4. Tap **Start Navigation** → step through the 7-step route
5. Tap **Report** on any step to submit a crowd report

### Crowd Reports (the Waze effect)

1. Tap **Maps** tab → switch to **Alerts** tab
2. See the 5 pre-loaded crowd alerts for JFK
3. Tap the purple **Report** FAB to open the report sheet
4. Select a report type, enter a location, tap **Submit Report**
5. The alert appears instantly in the Alerts list

### Dev scenario switcher

Tap the **⚙ DEV** chip (top-right corner on any tab):
- One-tap to load any of the 3 connection scenarios on the dashboard
- One-tap navigation to any screen
- MOCK route shortcut

---

## ⑦ Seed real Supabase data (optional)

If you have a Supabase project with real credentials in `.env`:

```bash
npm install -D tsx          # one-time install
npx tsx scripts/seed-supabase.ts
```

This inserts all 6 mock flights + 6 crowd reports into your Supabase database.
After seeding, real-time updates from other devices will show up automatically.

---

## ⑧ Useful commands

```bash
npx expo start --clear       # clear Metro cache (fixes "module not found" errors)
npx expo start --tunnel      # use ngrok tunnel if on different networks
npx expo install             # sync native dependency versions
npx expo doctor              # diagnose environment issues
```

---

## Common issues

| Error | Fix |
|---|---|
| `Unable to resolve module` | Run `npx expo start --clear` |
| QR code doesn't work | Use `--tunnel` flag or check same Wi-Fi |
| App crashes on launch | Check Metro logs, likely a missing import |
| Fonts not found | The layout no longer requires custom fonts — uses system defaults |
| Supabase errors in console | Expected in mock mode — safely ignored |
