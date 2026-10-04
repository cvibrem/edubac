<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { onNavigate } from '$app/navigation';
	import { quintOut } from 'svelte/easing';
	import { navDirection, switchTab, tabHistory } from '$lib/core/navigation/state.svelte';
	import { adjacentTab, tabRootOf } from '$lib/core/navigation/helpers';
	import { TAB_ORDER } from '$lib/config/tabs';
	import BottomNav from './BottomNav.svelte';

	let { children } = $props();

	onMount(() => {
		navDirection.seed(page.url.pathname);
	});

	onNavigate((navigation) => {
		if (navigation.to?.url) navDirection.update(navigation.to.url.pathname);
	});

	let tabRoot = $derived(tabRootOf(page.url.pathname) ?? TAB_ORDER[0]);

	// Swipe between tabs (release-to-navigate; the slide plays on release).
	// Vertical scrolling is untouched — only mostly-horizontal drags switch tabs.
	const SWIPE_MIN_X = 64;
	const SWIPE_MAX_Y = 80;
	let swipeStart: { x: number; y: number; id: number } | null = null;

	function onPointerDown(e: PointerEvent) {
		if (!e.isPrimary) return;
		if (e.pointerType === 'mouse' && e.button !== 0) return;
		swipeStart = { x: e.clientX, y: e.clientY, id: e.pointerId };
	}

	function onPointerUp(e: PointerEvent) {
		if (!swipeStart || e.pointerId !== swipeStart.id) return;
		const dx = e.clientX - swipeStart.x;
		const dy = e.clientY - swipeStart.y;
		swipeStart = null;
		if (tabHistory.inFlight) return;
		if (Math.abs(dx) < SWIPE_MIN_X || Math.abs(dy) > SWIPE_MAX_Y) return;
		const target = adjacentTab(tabRootOf(page.url.pathname), dx < 0 ? 1 : -1);
		if (target) switchTab(target, page.url.pathname);
	}

	function onPointerCancel(e: PointerEvent) {
		if (swipeStart?.id === e.pointerId) swipeStart = null;
	}

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
	<div
		class="tab-viewport"
		role="presentation"
		onpointerdown={onPointerDown}
		onpointerup={onPointerUp}
		onpointercancel={onPointerCancel}
	>
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
