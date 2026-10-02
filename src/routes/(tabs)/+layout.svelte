<script lang="ts">
	import { page } from '$app/state';
	import { onNavigate, afterNavigate } from '$app/navigation';
	import { quintOut } from 'svelte/easing';
	import { navDirection, tabStack, tabRootOf, TAB_ORDER } from '$lib/stores/navigation.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';

	let { children } = $props();

	onNavigate((navigation) => {
		if (navigation.to?.url) navDirection.update(navigation.to.url.pathname);
	});

	afterNavigate((navigation) => {
		const root = navigation.to?.url ? tabRootOf(navigation.to.url.pathname) : undefined;
		if (root) tabStack.sync(root);
	});

	let tabRoot = $derived(page.url.pathname.split('/').filter(Boolean)[0] ?? TAB_ORDER[0]);

	function slideIn(_node: HTMLElement, { direction = 1, duration = 220 } = {}) {
		return {
			duration,
			easing: quintOut,
			css: (t: number) => `transform: translateX(${(1 - t) * 100 * direction}%); opacity: ${t}`
		};
	}

	function slideOut(_node: HTMLElement, { direction = 1, duration = 220 } = {}) {
		return {
			duration,
			easing: quintOut,
			css: (t: number) => `transform: translateX(${(1 - t) * -100 * direction}%); opacity: ${t}`
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