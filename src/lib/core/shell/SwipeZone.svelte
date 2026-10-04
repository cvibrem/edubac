<script lang="ts">
	import { page } from '$app/state';
	import { switchInnerTab, switchTab, tabHistory } from '$lib/core/navigation/state.svelte';
	import { adjacentTab, SWIPE_MAX_Y, SWIPE_MIN_X } from '$lib/core/navigation/helpers';
	import { STICKY_SWIPE_INNER_TAB } from '$lib/config/motion';
	import { springBack } from '$lib/core/shell/transitions';
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
		routes: readonly string[];
		parentRoot?: TabName;
		children: import('svelte').Snippet;
	} = $props();

	let start: { x: number; y: number; id: number } | null = null;
	let zone: HTMLDivElement | null = null;

	// Sticky drag (gated by STICKY_SWIPE_INNER_TAB): only the body content
	// follows the finger — layouts mark it with [data-swipe-body] so fixed
	// chrome (headers, tab bars) stays put. Falls back to the zone root.
	let drag: {
		id: number;
		x0: number;
		y0: number;
		dx: number;
		engaged: boolean;
		el: HTMLElement | null;
	} | null = null;
	const DRAG_SLOP_PX = 12;
	const EDGE_RESISTANCE = 0.35;

	function onPointerDown(e: PointerEvent) {
		if (!e.isPrimary) return;
		if (e.pointerType === 'mouse' && e.button !== 0) return;
		start = { x: e.clientX, y: e.clientY, id: e.pointerId };
		drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, dx: 0, engaged: false, el: null };
	}

	function onPointerMove(e: PointerEvent) {
		if (!STICKY_SWIPE_INNER_TAB) return;
		if (!drag || e.pointerId !== drag.id) return;
		const dx = e.clientX - drag.x0;
		const dy = e.clientY - drag.y0;
		if (!drag.engaged) {
			if (Math.abs(dx) < DRAG_SLOP_PX || Math.abs(dx) <= Math.abs(dy)) return;
			if (tabHistory.inFlight) {
				drag = null;
				return;
			}
			drag.engaged = true;
			drag.el =
				zone?.querySelector<HTMLElement>('[data-swipe-body]') ?? (zone as HTMLElement | null);
			if (!drag.el) {
				drag = null;
				return;
			}
		}
		drag.dx = dx;
		const el = drag.el;
		if (!el) return;
		const width = zone?.clientWidth ?? 0;
		const clamped = Math.max(-width, Math.min(width, dx));
		const dir = dx < 0 ? 1 : -1;
		const idx = routes.indexOf(page.url.pathname);
		const hasInner = idx !== -1 && routes[idx + dir] !== undefined;
		const effective = hasInner ? clamped : clamped * EDGE_RESISTANCE;
		el.style.transform = `translateX(${effective}px)`;
	}

	function onPointerUp(e: PointerEvent) {
		const d = drag && e.pointerId === drag.id ? drag : null;
		drag = null;
		if (!start || e.pointerId !== start.id) {
			start = null;
			if (d?.engaged && d.el) springBack(d.el);
			return;
		}
		// Engaged drags use the tracked distance; quick flicks (no move events)
		// fall back to the release coordinates, exactly as before.
		const dx = d?.engaged ? d.dx : e.clientX - start.x;
		const dy = e.clientY - start.y;
		start = null;
		if (tabHistory.inFlight) {
			if (d?.engaged && d.el) springBack(d.el);
			return;
		}
		if (Math.abs(dx) < SWIPE_MIN_X || Math.abs(dy) > SWIPE_MAX_Y) {
			if (d?.engaged && d.el) springBack(d.el);
			return;
		}

		const dir = dx < 0 ? 1 : -1;
		const idx = routes.indexOf(page.url.pathname);
		const inner = idx === -1 ? undefined : routes[idx + dir];
		if (inner) {
			// Engaged release: leave the live offset — the sticky inner slide
			// picks it up as its starting point (no-op when the flag is off,
			// since no offset was ever applied).
			switchInnerTab(routes, inner, page.url.pathname);
			return;
		}
		// At the edge: escape to the neighboring main tab (no wrap).
		if (parentRoot) {
			const outer = adjacentTab(parentRoot, dir);
			if (outer) {
				if (d?.engaged && d.el) springBack(d.el);
				switchTab(outer, page.url.pathname);
				return;
			}
		}
		if (d?.engaged && d.el) springBack(d.el);
	}

	function onPointerCancel(e: PointerEvent) {
		if (start?.id === e.pointerId) start = null;
		if (drag && e.pointerId === drag.id) {
			const el = drag.el;
			drag = null;
			if (el) {
				el.style.transition = '';
				el.style.transform = '';
			}
		}
	}
</script>

<div
	bind:this={zone}
	data-swipe-zone
	class="swipe-zone"
	role="presentation"
	onpointerdown={onPointerDown}
	onpointermove={onPointerMove}
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
