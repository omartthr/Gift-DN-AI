# Gift DN-AI — Mobile App

Mobile (iOS + Android) version of Gift DN-AI, built with **Expo (SDK 54)** + **Expo Router** + **TypeScript**.

The mobile app uses **the same Supabase backend** as the web app (same project, same Edge Functions, same tables), so any user / wishlist / community state is shared between platforms.

## Architecture

```
apps/mobile/
├── app/                       Expo Router (file-based routing)
│   ├── _layout.tsx            Root layout, auth gate, theme
│   ├── auth.tsx               Email/password sign-in & sign-up
│   ├── quiz.tsx               Initial chips → AI conversation → loading
│   ├── results.tsx            3 gift cards + load more + share/save
│   ├── share.tsx              Modal: share a gift to the community
│   └── (tabs)/                Bottom-tab navigator
│       ├── _layout.tsx
│       ├── index.tsx          Home / start a new quiz
│       ├── wishlist.tsx       Saved gifts (synced with web)
│       ├── community.tsx      Community feed + like + save
│       └── profile.tsx        Account, language, paywall info, sign out
├── components/                Shared UI atoms (Button, Chip, Card, etc.)
├── lib/
│   ├── supabase.ts            Supabase client w/ AsyncStorage session
│   ├── theme.ts               Color, spacing, type tokens (mirrors web)
│   ├── types.ts               Shared TS types (Profile, GiftSuggestion, …)
│   ├── i18n/                  TR + EN translations, Zustand store
│   └── stores/                authStore, quizStore, wishlistStore, communityStore
├── assets/                    Icon + splash placeholders (Expo defaults)
├── app.json                   Expo config (bundle ID, scheme, plugins)
├── babel.config.js            Babel preset + Reanimated plugin
├── .env                       Local env (gitignored)
└── .env.example
```

## Setup

1. **Install dependencies** (already done if you ran `npm install` at the monorepo root, but just in case):

   ```bash
   cd apps/mobile
   npm install
   ```

2. **Configure environment**

   Copy `.env.example` to `.env` and fill in the values. The Supabase URL/anon key are public — they're already populated for the project's Supabase instance.

   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://joazvguuhpwsxgwyylqk.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
   EXPO_PUBLIC_WEB_URL=http://localhost:3000   # used by the paywall "upgrade on web" button
   ```

3. **Start the dev server**

   ```bash
   npm run start            # opens the Expo dev menu (QR code for Expo Go, etc.)
   npm run ios              # opens iOS Simulator
   npm run android          # opens Android emulator
   ```

   You'll need **Xcode** for iOS Simulator and **Android Studio** for the Android emulator. Alternatively, install **Expo Go** on a physical device and scan the QR code.

## Differences vs. the web app (intentional)

| Feature                | Web                                              | Mobile                                                                 |
| ---------------------- | ------------------------------------------------ | ---------------------------------------------------------------------- |
| Auth                   | Email/password + Google OAuth                    | Email/password only                                                    |
| Subscription / payment | Stripe checkout, $2.99/month                     | **Read-only.** Free users get 1 quiz, then a modal points to web/pricing |
| Visual style           | Editorial layout, OGL 3D background, tilted cards | Mobile-native, calm, simple — same palette, same copy                  |
| Navigation             | Left rail + top nav                              | Bottom tab bar (Discover / Wishlist / Community / Profile)             |
| Quiz loading           | Animated confidence-score reveal                 | Simple animated dots loader                                            |

Everything else — quiz logic, AI prompt, gift generation, wishlist, community posts/likes, language switch — is identical and shared via the same Supabase backend.

## How the paywall works on mobile

- On `Discover → Continue`, the app counts the user's completed quiz sessions in Supabase.
- If the user has `subscription_status = "active"` (set via web Stripe checkout), they can run unlimited quizzes.
- Otherwise, after 1 completed quiz, a modal appears with a button that opens the web `/pricing` page in the system browser (via `expo-web-browser`).
- After upgrading on the web, the next session refresh on mobile picks up `active` and the limit is lifted automatically.

## Project & icon

- App name: **Gift DN-AI**
- iOS bundle ID / Android package: **com.giftdnai.app**
- URL scheme: **giftdnai://**
- Icon & splash: currently the Expo defaults (placeholders). Replace `assets/icon.png` (1024×1024) and `assets/splash-icon.png` to brand.

## Notes on Expo SDK 54

- Uses the **new React Native architecture** (`newArchEnabled: true`).
- **Expo Router 6** with typed routes.
- **react-native-reanimated 4** (babel plugin wired in `babel.config.js`).
- For up-to-date package guidance: https://docs.expo.dev/versions/v54.0.0/

## Web app safety

This mobile app lives in its own `apps/mobile` folder and **does not touch any web code or web dependencies**. The web app under `apps/web` is unaffected.
