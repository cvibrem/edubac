# sveltekit-capacitor-tab-starter

A reusable Svelte frontend base: **SvelteKit 2 + Svelte 5 (runes) + Capacitor**, with a
native-style **tab router** (bottom tab bar, drill-in stacks, Android back-button support)
that behaves the same on web and in the native shell. Ships with a color-coded demo
(4 tabs + inner tabs + sibling login page) so you can see every transition immediately.

Suggested GitHub name: `sveltekit-capacitor-tab-starter`
(short alternatives: `sv-cap-tabs`, `svelte-tab-shell`).

## Stack

| Piece      | Choice                                                     |
| ---------- | ---------------------------------------------------------- |
| UI         | Svelte 5 (runes enforced), TypeScript                      |
| Routing    | SvelteKit file-based routes + custom tab-history layer     |
| Web output | `adapter-static`, fully prerendered SPA (`ssr: false`)     |
| Native     | Capacitor 8 (`android/` platform committed, ready to sync) |
| Checks     | `svelte-check`, `eslint`, `prettier`                       |

## Getting started

```sh
npm install

# local dev (default Vite port)
npm run dev

# dev behind a reverse proxy / on a fixed address (for nginx, containers, …)
npm run dev:expose   # http://127.0.0.1:8080, fails fast if the port is taken

npm run check        # typecheck
npm run build        # prerendered output in build/
npx eslint <files>   # lint (repo has pre-existing prettier drift; don't `lint` blindly)
```

> If you serve dev through a proxy host, add it to `server.allowedHosts` in
> `vite.config.ts` (there is a commented example).

## Project structure

```
src/lib/config/tabs.ts            # ROUTES ONLY: tab names + hrefs (edit this per project)
src/lib/core/navigation/
  state.svelte.ts                 # tabHistory mirror, navDirection, sessionDepth
  helpers.ts                      # tabRootOf(), tabHref()
  paths.ts                        # asResolved() typed wrapper for $app/paths
  back.ts                         # goBack() — history.back() or fallback goto
src/lib/core/shell/
  AppShell.svelte                 # tab viewport + side-by-side slide transitions
  BottomNav.svelte                # PRESENTATION: labels/icons live here, hrefs from config
  StackTransition.svelte          # drill/inner-page transition (subtle zoom)
  Splash.svelte                   # web splash (native uses the Capacitor splash)
src/routes/
  +layout.svelte                  # global owner: splash, Android back button, history mirror
  +page.ts                        # / -> default tab (from config)
  (app)/                          # tab shell group (bottom bar visible)
    +layout.svelte                # thin wrapper around <AppShell>
    home/+page.svelte             # blue   | + innerPage/ (orange/teal/rose inner tabs)
    search/+page.svelte           # green
    notifications/+page.svelte    # amber
    profile/+page.svelte          # purple
  (auth)/login/+page.svelte       # sibling group: NO tab bar (slate)
android/                          # Capacitor platform (committed; build outputs gitignored)
capacitor.config.ts               # appId / appName / webDir
```

Route groups `(app)` / `(auth)` don't affect URLs: `/login` renders without the tab bar.

## How the tab router works

- `tabHistory` (in `core/navigation/state.svelte.ts`) mirrors in-app browser history as
  `{ path, root }` entries, seeded on `enter` + `onMount` (afterNavigate alone misses the
  initial navigation — that was the original desync bug).
- Tapping a **different** tab pops with `history.go(-steps)` to its root href if visited
  (Pattern B: always lands on the tab **root**, never on a stale drill page), else `goto()` pushes.
- Tapping the **same** tab is a no-op at root, otherwise pops the drill back to root.
- Rapid double-taps are throttled (400 ms + `inFlight` guard).
- `goBack(fallback)` from `core/navigation/back.ts`: `history.back()` when history exists,
  otherwise `goto(fallback)` (covers deep links / fresh reloads).

## Common tasks

**Rename / add / remove a tab** — edit `src/lib/config/tabs.ts`, then add/remove the
`src/routes/(app)/<name>/` folder. Labels/icons are set in `BottomNav.svelte`
(`LABEL` / `ICON` maps), the router never sees them.

**Add a drill page inside a tab** (keeps the bottom bar):
`src/routes/(app)/home/details/+page.svelte` → link to `/home/details`.
Tapping Home pops back to `/home`; browser back steps one level at a time.

**Add inner top tabs** (like the Home-detail demo):
add `(app)/home/<section>/+layout.svelte` with a tab bar + `{@render children()}`,
then one `+page.svelte` per inner tab. No router changes needed.

**Add a page without the tab bar** (login, onboarding, modal):
put it in `(auth)/` or a new group, e.g. `(auth)/login/+page.svelte`.
Use `goBack(asResolved('/home'))` for its back button.

**Change animations** (base defaults, override per project):

- Outer tab slide: `AppShell.svelte` (`slideIn`/`slideOut`, 240 ms `quintOut`, side-by-side, no fade).
- Drill/inner: `StackTransition.svelte` (`in: scale 0.96→1` 200 ms, `out: fade` 120 ms).

## Native build (Capacitor / Android)

Prereqs: JDK 17+ and the Android SDK with `ANDROID_HOME` exported, e.g.
`export ANDROID_HOME=/usr/lib/android-sdk`.

```sh
npm run build            # prerender -> build/
npx cap sync android     # copy web assets into the platform project
cd android && sh gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

`npm run deploy:usb` does build + sync + assemble + install in one go
(set `ANDROID_SERIAL` or pass `-s <id>` if several devices are attached).
Hardware back is handled in `src/routes/+layout.svelte` via `@capacitor/app`
(`history.back()`, else `exitApp()`).

## Starting a new project from this base

1. Clone, `npm install`.
2. `capacitor.config.ts`: set `appId` (e.g. `com.yourco.yourapp`) + `appName`.
3. `package.json`: rename package, fix the `monkey -p <appId>` package in deploy scripts.
4. `android/`: after changing `appId`, delete + `npx cap add android` for a clean platform,
   or keep and re-sync (also check `android/app/src/main/res/values/strings.xml` app name).
5. `src/lib/config/tabs.ts`: define your tabs; rewrite the demo pages.
6. `static/assets/imgs/icon.svg` + `static/favicon.svg`: replace branding.

## Demo cheat-sheet (what the colors mean)

| Screen                                      | Color                | Route              |
| ------------------------------------------- | -------------------- | ------------------ |
| Home                                        | blue                 | `/home`            |
| Home detail → Overview / Details / Activity | orange / teal / rose | `/home/innerPage…` |
| Search                                      | green                | `/search`          |
| Alerts                                      | amber                | `/notifications`   |
| Profile                                     | purple               | `/profile`         |
| Login (no tab bar)                          | slate                | `/login`           |

Try: Home → inner page → inner tabs → tap Home (pops to root) → Search → Home.
Browser back from a tab loop returns to the previous tab, never to a blank page.
