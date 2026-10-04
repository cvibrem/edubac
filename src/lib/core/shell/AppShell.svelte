<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { onNavigate } from '$app/navigation';
	import { f7MdForward } from '$lib/core/shell/easing';
	import { navDirection, switchTab, tabHistory } from '$lib/core/navigation/state.svelte';
	import { adjacentTab, SWIPE_MAX_Y, SWIPE_MIN_X, tabRootOf } from '$lib/core/navigation/helpers';
	import { TAB_ORDER } from '$lib/config/tabs';
	import { initRipple } from '$lib/core/shell/ripple';
	import BottomNav from './BottomNav.svelte';

	let { children } = $props();

	onMount(() => {
		navDirection.seed(page.url.pathname);
		return initRipple();
	});

	onNavigate((navigation) => {
		if (navigation.to?.url) navDirection.update(navigation.to.url.pathname);
	});

	let tabRoot = $derived(tabRootOf(page.url.pathname) ?? TAB_ORDER[0]);

	let viewport: HTMLDivElement | null = null;

	// Swipe between tabs (release-to-navigate; the slide plays on release).
	// Vertical scrolling is untouched — only mostly-horizontal drags switch tabs.
	// Gestures starting inside a nested [data-swipe-zone] belong to it.
	let swipeStart: { x: number; y: number; id: number } | null = null;

	// Interactive drag (experiment): past a small slop the current tab follows
	// the finger. Release past the swipe threshold hands off to the normal
	// key-block slide; short releases spring back. Dragging toward no neighbor
	// meets resistance and always springs back.
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
	const SPRING_BACK_MS = 180;

	function insideInnerZone(e: PointerEvent): boolean {
		return !!(e.target as HTMLElement | null)?.closest?.('[data-swipe-zone]');
	}

	function onPointerDown(e: PointerEvent) {
		if (!e.isPrimary) return;
		if (e.pointerType === 'mouse' && e.button !== 0) return;
		if (insideInnerZone(e)) return;
		swipeStart = { x: e.clientX, y: e.clientY, id: e.pointerId };
		drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, dx: 0, engaged: false, el: null };
	}

	function onPointerMove(e: PointerEvent) {
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
			drag.el = viewport?.querySelector<HTMLElement>('.tab-page') ?? null;
			if (!drag.el) {
				drag = null;
				return;
			}
		}
		drag.dx = dx;
		const el = drag.el;
		if (!el) return;
		const width = viewport?.clientWidth ?? 0;
		const clamped = Math.max(-width, Math.min(width, dx));
		const target = adjacentTab(tabRootOf(page.url.pathname), dx < 0 ? 1 : -1);
		const effective = target ? clamped : clamped * EDGE_RESISTANCE;
		el.style.transform = `translateX(${effective}px)`;
	}

	function springBack(el: HTMLElement) {
		el.style.transition = `transform ${SPRING_BACK_MS}ms cubic-bezier(0, 0.8, 0.3, 1)`;
		el.style.transform = 'translateX(0px)';
		const done = () => {
			el.removeEventListener('transitionend', done);
			if (el.style.transform === 'translateX(0px)') {
				el.style.transition = '';
				el.style.transform = '';
			}
		};
		el.addEventListener('transitionend', done);
		// Fallback if transitionend never fires; guarded so a newer drag is untouched.
		setTimeout(() => {
			if (el.isConnected && el.style.transform === 'translateX(0px)') {
				el.style.transition = '';
				el.style.transform = '';
			}
		}, SPRING_BACK_MS + 120);
	}

	function onPointerUp(e: PointerEvent) {
		const d = drag && e.pointerId === drag.id ? drag : null;
		drag = null;
		if (!swipeStart || e.pointerId !== swipeStart.id) {
			swipeStart = null;
			if (d?.engaged && d.el) springBack(d.el);
			return;
		}
		// Engaged drags use the tracked distance; quick flicks (no move events)
		// fall back to the release coordinates, exactly as before.
		const dx = d?.engaged ? d.dx : e.clientX - swipeStart.x;
		const dy = e.clientY - swipeStart.y;
		swipeStart = null;
		if (tabHistory.inFlight) {
			if (d?.engaged && d.el) springBack(d.el);
			return;
		}
		if (Math.abs(dx) < SWIPE_MIN_X || Math.abs(dy) > SWIPE_MAX_Y) {
			if (d?.engaged && d.el) springBack(d.el);
			return;
		}
		const target = adjacentTab(tabRootOf(page.url.pathname), dx < 0 ? 1 : -1);
		if (!target) {
			if (d?.engaged && d.el) springBack(d.el);
			return;
		}
		// Engaged release: leave the live offset in place — slideOut picks it up
		// as its starting point, so the page continues from under the finger.
		switchTab(target, page.url.pathname);
	}

	function onPointerCancel(e: PointerEvent) {
		if (swipeStart?.id === e.pointerId) swipeStart = null;
		if (drag && e.pointerId === drag.id) {
			const el = drag.el;
			drag = null;
			// Gesture aborted (e.g. browser took over for scroll): reset instantly.
			if (el) {
				el.style.transition = '';
				el.style.transform = '';
			}
		}
	}

	function slideIn(_node: HTMLElement, { direction = 1, duration = 240 } = {}) {
		return {
			duration,
			easing: f7MdForward,
			css: (t: number) => `transform: translateX(${(1 - t) * 100 * direction}%)`
		};
	}

	// Side-by-side: outgoing slides out while incoming slides in, same
	// duration/easing, no opacity fade (the fade is what flashed white).
	// Starts from the live drag offset (0 when released without dragging),
	// so a drag release continues from under the finger instead of jumping.
	function slideOut(node: HTMLElement, { direction = 1, duration = 240 } = {}) {
		let startPx = 0;
		try {
			startPx = new DOMMatrixReadOnly(getComputedStyle(node).transform).m41;
		} catch {
			startPx = 0;
		}
		return {
			duration,
			easing: f7MdForward,
			css: (t: number) =>
				`transform: translateX(calc(${(1 - t) * -100 * direction}% + ${startPx * t}px))`
		};
	}
</script>

<div class="app-shell">
	<div
		bind:this={viewport}
		class="tab-viewport"
		role="presentation"
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
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
