<script lang="ts">
	import { Capacitor, registerPlugin } from '@capacitor/core';
	import { App } from '@capacitor/app';
	import { onMount } from 'svelte';

	import Splash from '$lib/components/Splash.svelte';
	import '../app.css';

	import { afterNavigate } from '$app/navigation';
	import { sessionDepth } from '$lib/stores/navigation.svelte';

	const CustomSplash = registerPlugin<{ hide: () => Promise<void> }>('CustomSplash');

	onMount(async () => {
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

	afterNavigate((navigation) => {
		sessionDepth.track(navigation.type);
	});
</script>

<svelte:head>
	<link rel="icon" href="/favicon.svg" />
</svelte:head>

{#if !alreadyShowSplash && shouldShowWebSplashscreen}
	<Splash onFinished={() => (alreadyShowSplash = true)} />
{:else}
	{@render children()}
{/if}
