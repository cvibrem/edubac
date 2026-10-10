<script lang="ts">
	import { onMount } from 'svelte';

	import Splash from '$lib/core/shell/Splash.svelte';
	import OverlayHost from '$lib/core/overlay/OverlayHost.svelte';
	import '$lib/design/tokens.css';
	import '$lib/design/base.css';
	import '../app.css';
	import '$lib/core/shell/ripple.css';

	import { afterNavigate, beforeNavigate, goto, onNavigate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { navDirection, tabHistory } from '$lib/core/navigation/state.svelte';
	import { overlay } from '$lib/core/overlay/state.svelte';
	import { isNativePlatform } from '$lib/native/platform';
	import { hasSeenOnboarding } from '$lib/onboarding/seen';

	// Shell boundary: this layout never imports `@capacitor/*` statically.
	// Native wiring (back button, deep links, splash hide) lives in
	// `src/lib/native/bridge.ts` and is dynamically imported on device only,
	// so the browser build is a plain SPA with zero Capacitor code.

	onMount(async () => {
		// Drop the static boot splash from app.html: the Svelte Splash (web)
		// or the system drawable (native) takes over from here with identical
		// visuals, so the handoff is invisible.
		document.getElementById('boot-splash')?.remove();

		// Seed once: afterNavigate alone misses the initial `enter` navigation
		// that mounts this layout (incl. `/` -> `/home` redirect).
		tabHistory.seed(page.url.pathname);
		navDirection.seed(page.url.pathname);

		// First launch: route to onboarding (replaceState, so back never
		// returns here). Covered by the web splash — no visible flash.
		if (!hasSeenOnboarding() && page.url.pathname !== resolve('/onboarding')) {
			await goto(resolve('/onboarding'), { replaceState: true });
		}

		if (isNativePlatform()) {
			import('$lib/native/bridge')
				.then((m) => m.initNativeBridge())
				.catch((error) => console.error('Error initing native bridge:', error));
		}
	});

	let { children } = $props();
	let shouldShowWebSplashscreen = !isNativePlatform();
	let alreadyShowSplash = $state(false);

	// Modal overlays own the back button: a system back (native button or
	// browser back) dismisses the top dialog/sheet instead of navigating.
	// The native bridge calls history.back() for hardware presses, so both
	// paths funnel through here. inFlight is reset defensively — a cancelled
	// popstate must never wedge the router's double-tap guard.
	beforeNavigate((navigation) => {
		if (navigation.type === 'popstate' && overlay.hasModal) {
			tabHistory.inFlight = false;
			navigation.cancel();
			overlay.dismissTop();
		}
	});

	// Global nav mirror: single owner (works for tab + non-tab routes).
	// Tabs layout only handles slide direction.
	onNavigate(() => {
		tabHistory.inFlight = true;
	});

	afterNavigate((navigation) => {
		tabHistory.handleAfterNavigate({
			type: navigation.type,
			toPath: navigation.to?.url?.pathname ?? page.url.pathname
		});
		// Pending dialogs/sheets don't survive a route change (their
		// promises resolve null). Toasts are unaffected.
		overlay.clearModals();
	});
</script>

<svelte:head>
	<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
	<link
		rel="icon"
		type="image/svg+xml"
		href="/favicon-dark.svg"
		media="(prefers-color-scheme: dark)"
	/>
</svelte:head>

{#if !alreadyShowSplash && shouldShowWebSplashscreen}
	<Splash onFinished={() => (alreadyShowSplash = true)} />
{:else}
	{@render children()}
	<OverlayHost />
{/if}
