<script lang="ts">
	import { page } from '$app/state';
	import { switchInnerTab, switchTab, tabHistory } from '$lib/core/navigation/state.svelte';
	import { adjacentTab, SWIPE_MAX_Y, SWIPE_MIN_X } from '$lib/core/navigation/helpers';
	import type { TabName } from '$lib/config/tabs';

	/**
	 * Nested swipe zone (base default for inner tab bars).
	 * Swipes cycle through `routes`; at either edge the gesture escapes to the
	 * neighboring *main* tab via `parentRoot` instead of wrapping.
	 * The outer AppShell yields to any gesture starting inside `[data-swipe-zone]`.
	 */
	let {
		routes,
		parentRoot,
		children
	}: {
		routes: string[];
		parentRoot?: TabName;
		children: import('svelte').Snippet;
	} = $props();

	let start: { x: number; y: number; id: number } | null = null;

	function onPointerDown(e: PointerEvent) {
		if (!e.isPrimary) return;
		if (e.pointerType === 'mouse' && e.button !== 0) return;
		start = { x: e.clientX, y: e.clientY, id: e.pointerId };
	}

	function onPointerUp(e: PointerEvent) {
		if (!start || e.pointerId !== start.id) return;
		const dx = e.clientX - start.x;
		const dy = e.clientY - start.y;
		start = null;
		if (tabHistory.inFlight) return;
		if (Math.abs(dx) < SWIPE_MIN_X || Math.abs(dy) > SWIPE_MAX_Y) return;

		const dir = dx < 0 ? 1 : -1;
		const idx = routes.indexOf(page.url.pathname);
		const inner = idx === -1 ? undefined : routes[idx + dir];
		if (inner) {
			switchInnerTab(routes, inner, page.url.pathname);
			return;
		}
		// At the edge: escape to the neighboring main tab (no wrap).
		if (parentRoot) {
			const outer = adjacentTab(parentRoot, dir);
			if (outer) switchTab(outer, page.url.pathname);
		}
	}

	function onPointerCancel(e: PointerEvent) {
		if (start?.id === e.pointerId) start = null;
	}
</script>

<div
	data-swipe-zone
	class="swipe-zone"
	role="presentation"
	onpointerdown={onPointerDown}
	onpointerup={onPointerUp}
	onpointercancel={onPointerCancel}
>
	{@render children()}
</div>

<style>
	.swipe-zone {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 100%;
	}
</style>
