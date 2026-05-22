<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Lingua language learning app. The following changes were made:

- **`src/lib/posthog.ts`** — Created PostHog client singleton using `expo-constants` to read `POSTHOG_PROJECT_TOKEN` and `POSTHOG_HOST` from `app.config.js` extras. Gracefully disabled when token is not configured.
- **`app.config.js`** — Created dynamic Expo config (replacing static `app.json` at runtime) to inject PostHog env vars into `Constants.expoConfig.extra`.
- **`src/app/_layout.tsx`** — Added `PostHogProvider` wrapping the app and manual screen tracking with `posthog.screen()` on every `usePathname` change.
- **`src/app/onboarding.tsx`** — Tracks `get_started_tapped` when user taps the Get Started button (top of acquisition funnel).
- **`src/components/auth-screen.tsx`** — Tracks `sign_up_submitted`, `sign_up_completed` (with `posthog.identify()`), `sign_in_completed` (with `posthog.identify()`), `social_auth_tapped`, and `social_auth_completed`.
- **`src/app/language-selection.tsx`** — Tracks `language_confirmed` with the selected language name and ID.
- **`src/app/(tabs)/home.tsx`** — Tracks `continue_learning_tapped` and `today_plan_item_tapped`.
- **`src/store/progressStore.ts`** — Tracks `xp_earned` (with amount and total) and `lesson_completed` (with lesson ID and total completed count) directly from the Zustand store using the posthog singleton.

| Event | Description | File |
|---|---|---|
| `get_started_tapped` | User taps Get Started on onboarding screen — top of acquisition funnel | `src/app/onboarding.tsx` |
| `sign_up_submitted` | User submits sign-up form with email and password | `src/components/auth-screen.tsx` |
| `sign_up_completed` | User successfully completes email verification and account creation | `src/components/auth-screen.tsx` |
| `sign_in_completed` | User successfully signs in with email code verification | `src/components/auth-screen.tsx` |
| `social_auth_tapped` | User taps a social auth provider (Google, Facebook, Apple) button | `src/components/auth-screen.tsx` |
| `social_auth_completed` | User successfully authenticates via a social provider | `src/components/auth-screen.tsx` |
| `language_confirmed` | User confirms their selected language on the language selection screen | `src/app/language-selection.tsx` |
| `continue_learning_tapped` | User taps Continue on the home screen to resume their current lesson | `src/app/(tabs)/home.tsx` |
| `today_plan_item_tapped` | User taps a Today's Plan item on the home screen | `src/app/(tabs)/home.tsx` |
| `lesson_completed` | User completes a lesson, tracked via the progress store | `src/store/progressStore.ts` |
| `xp_earned` | User earns XP, tracked via the progress store | `src/store/progressStore.ts` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics dashboard](/dashboard/1618532)
- [Sign-up Conversion Funnel](/insights/v5GmlenB) — Tracks drop-off from Get Started → sign_up_submitted → sign_up_completed
- [Daily Active Learners](/insights/3L33AqwW) — Unique users engaging with Continue Learning each day
- [Language Selections](/insights/T1YneQty) — Which languages users are choosing, broken down by language name
- [Lesson Completions Over Time](/insights/l9H6thvE) — Total lessons completed per day
- [Sign-ups vs Sign-ins](/insights/rocrH5jP) — Comparing email sign-up, email sign-in, and social auth completions

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
