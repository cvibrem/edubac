<script lang="ts">
	import { Capacitor, registerPlugin } from '@capacitor/core';
	import { App } from '@capacitor/app';
	import { onMount } from 'svelte';

	import Splash from '$lib/core/shell/Splash.svelte';
	import '$lib/design/tokens.css';
	import '$lib/design/base.css';
	import '../app.css';
	import '$lib/core/shell/ripple.css';

	import { afterNavigate, onNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { navDirection, tabHistory } from '$lib/core/navigation/state.svelte';

	const CustomSplash = registerPlugin<{ hide: () => Promise<void> }>('CustomSplash');

	onMount(async () => {
		// Seed once: afterNavigate alone misses the initial `enter` navigation
		// that mounts this layout (incl. `/` -> `/home` redirect).
		tabHistory.seed(page.url.pathname);
		navDirection.seed(page.url.pathname);

		if (Capacitor.isNativePlatform()) {
			setTimeout(async () => {
				try {
					await CustomSplash.hide();
				} catch (error) {
					console.error('Error showing splash screen:', error);
				}
			}, 100);
		}
	});

	let { children } = $props();
	let shouldShowWebSplashscreen = !Capacitor.isNativePlatform();
	let alreadyShowSplash = $state(false);

	$effect(() => {
		if (!Capacitor.isNativePlatform()) return;

		const listenerPromise = App.addListener('backButton', ({ canGoBack }) => {
			if (canGoBack) {
				window.history.back();
			} else {
				App.exitApp();
			}
		});

		return () => {
			listenerPromise.then((handle) => handle.remove());
		};
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
	});
</script>

<svelte:head>
	<link rel="icon" type="image/svg+xml" href="/edubac-logo.svg" />
	<link
		rel="icon"
		type="image/svg+xml"
		href="/edubac-logo-dark.svg"
		media="(prefers-color-scheme: dark)"
	/>
</svelte:head>

{#if !alreadyShowSplash && shouldShowWebSplashscreen}
	<Splash onFinished={() => (alreadyShowSplash = true)} />
{:else}
	{@render children()}
{/if}
