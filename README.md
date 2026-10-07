# EduBac

Mobile app (Svelte + Capacitor, Android) gathering **old BAC exams and their corrections**.
Built on the [`svelte-tab-shell`](https://github.com/cvibrem/svelte-tab-shell) base:
SvelteKit 2 + Svelte 5 runes, native-style tab router, `adapter-static` SPA.

## Develop

```sh
npm install
npm run dev            # local Vite dev
npm run dev:expose     # http://127.0.0.1:8080 behind the nginx proxy
npm run check          # typecheck
```

Demo screens (color-coded): Home blue → detail inner tabs orange/teal/rose,
Search green, Alerts amber, Profile purple, Login slate (`/login`, no tab bar).

## Structure

- `src/lib/config/tabs.ts` — tab routes (name/href)
- `src/lib/config/links.ts` — deep-link scheme (`edubac://`) + hosts
- `src/lib/core/navigation/` — tab history mirror, `goBack()`, overlay-aware
  `handleSystemBack()`, pure `parseDeepLink()`/`handleDeepLink()`
- `src/lib/core/overlay/` — `openDialog()`/`openSheet()`/`openToast()` (back
  dismisses modals instead of navigating)
- `src/lib/core/shell/` — `AppShell`, `BottomNav` (labels/icons), transitions,
  splash, `reducedMotion` helpers
- `src/lib/native/` — the only Capacitor code (`bridge.ts`, dynamic import)
- `src/routes/(app)/` — tab screens · `src/routes/(auth)/login/` — no tab bar
- `tests/` — Playwright e2e (`npm run test:e2e`, dev on :8081)
- `scripts/bump-version.mjs` — `npm run version:patch|minor|major`
- `android/` — Capacitor platform, appId `com.myriad.edubac`

Router details live in the base repo README.

## Native build

```sh
npm run build && npx cap sync android
cd android && sh gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

Or `npm run deploy:usb` (build + sync + assemble + install), then
`npm run deploy:usb:launch` to open the app on the device.
Requires JDK 17+ and `ANDROID_HOME` pointing at the Android SDK.
