<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { onNavigate } from '$app/navigation';
	import { quintOut } from 'svelte/easing';
	import { navDirection } from '$lib/core/navigation/state.svelte';
	import { TAB_ORDER } from '$lib/config/tabs';
	import BottomNav from './BottomNav.svelte';

	let { children } = $props();

	onMount(() => {
		navDirection.seed(page.url.pathname);
	});

	onNavigate((navigation) => {
		if (navigation.to?.url) navDirection.update(navigation.to.url.pathname);
	});

	let tabRoot = $derived(page.url.pathname.split('/').filter(Boolean)[0] ?? TAB_ORDER[0]);

	function slideIn(_node: HTMLElement, { direction = 1, duration = 240 } = {}) {
		return {
			duration,
			easing: quintOut,
			css: (t: number) => `transform: translateX(${(1 - t) * 100 * direction}%)`
		};
	}

	// Side-by-side: outgoing slides out while incoming slides in, same
	// duration/easing, no opacity fade (the fade is what flashed white).
	function slideOut(_node: HTMLElement, { direction = 1, duration = 240 } = {}) {
		return {
			duration,
			easing: quintOut,
			css: (t: number) => `transform: translateX(${(1 - t) * -100 * direction}%)`
		};
	}
</script>

<div class="app-shell">
	<div class="tab-viewport">
		{#key tabRoot}
			<div
				class="tab-page"
				in:slideIn={{ direction: navDirection.direction }}
				out:slideOut={{ direction: navDirection.direction }}
			>
				{@render children()}
			</div>
		{/key}
	</div>

	<BottomNav />
</div>
