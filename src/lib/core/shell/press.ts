/**
 * Native-style press feedback gate.
 *
 * On native Android, tapping a button plays the ripple first and the new
 * activity/modal transition only starts once the press wave has finished —
 * the feedback is never cut off by the navigation. This module brings that
 * behavior to the shell: every press-driven navigation or overlay action
 * waits out the ripple expand phase before firing.
 *
 * Parameterizable three ways (cheapest first):
 * 1. Per call: `afterPress(fn, 120)` / `pressFeedback(0)`.
 * 2. Runtime: `configurePress({ ms, enabled })` — e.g. zero it on web with
 *    `if (!isNativePlatform()) configurePress({ ms: 0 })`.
 * 3. Per element: `data-no-press` on an anchor opts out of `pressLink`.
 * Defaults live in `src/lib/config/motion.ts`. Reduced motion always
 * resolves instantly (same contract as `motionMs()`).
 *
 * Deliberately NOT applied to: swipe releases, system back (hardware or
 * browser), scrim/Escape dismiss, and programmatic overlay opens — those
 * involve no press, so gating them would only add dead time.
 */

import { goto } from '$app/navigation';
import { PRESS_FEEDBACK_ENABLED, PRESS_FEEDBACK_MS } from '$lib/config/motion';
import { isReducedMotion } from './reducedMotion';

let msOverride: number | undefined;
let enabledOverride: boolean | undefined;

/** Runtime tuning for the press gate (see header for the layers). */
export function configurePress(opts: { ms?: number; enabled?: boolean }): void {
	if (opts.ms !== undefined) msOverride = opts.ms;
	if (opts.enabled !== undefined) enabledOverride = opts.enabled;
}

/** Effective gate delay. Zero under reduced motion or when disabled. */
export function pressDelayMs(perCallMs?: number): number {
	if (isReducedMotion()) return 0;
	if (!(enabledOverride ?? PRESS_FEEDBACK_ENABLED)) return 0;
	return perCallMs ?? msOverride ?? PRESS_FEEDBACK_MS;
}

/** Wait out the press wave. Resolves immediately when the gate is off. */
export function pressFeedback(perCallMs?: number): Promise<void> {
	const ms = pressDelayMs(perCallMs);
	if (ms <= 0) return Promise.resolve();
	return new Promise((resolve) => setTimeout(resolve, ms));
}

let pressClaimed = false;

/**
 * Claim the press gate. False = another press is still inside its feedback
 * window — the tap is absorbed (native drops it the same way mid-transition).
 */
export function tryClaimPress(): boolean {
	if (pressClaimed) return false;
	pressClaimed = true;
	return true;
}

export function releasePress(): void {
	pressClaimed = false;
}

/**
 * Run `fn` after the press wave finishes. The claim covers the feedback
 * wait only — `fn` fires and the gate releases, so a long-lived result
 * (e.g. an overlay promise) never wedges later presses.
 */
export async function afterPress(fn: () => void, perCallMs?: number): Promise<void> {
	if (!tryClaimPress()) return;
	try {
		await pressFeedback(perCallMs);
		fn();
	} finally {
		releasePress();
	}
}

/**
 * Svelte action for plain `<a href>` links: lets the wave finish, then
 * navigates via the router. Element-level (target phase) so it runs before
 * SvelteKit's document listener, which bails on `defaultPrevented`.
 * Skips modifier clicks, non-self targets, downloads, `rel=external`,
 * cross-origin hrefs, and `data-no-press` opt-outs.
 */
export function pressLink(node: HTMLAnchorElement) {
	const onClick = (e: MouseEvent) => {
		if (e.defaultPrevented || e.button !== 0) return;
		if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
		if (node.hasAttribute('download') || node.hasAttribute('data-no-press')) return;
		if (node.getAttribute('rel')?.split(/\s+/).includes('external')) return;
		const target = node.getAttribute('target');
		if (target && target !== '_self') return;
		const raw = node.getAttribute('href');
		if (!raw) return;
		let url: URL;
		try {
			url = new URL(raw, window.location.href);
		} catch {
			return;
		}
		if (url.origin !== window.location.origin) return;
		e.preventDefault();
		void afterPress(() => {
			// eslint-disable-next-line svelte/no-navigation-without-resolve -- runtime URL from the anchor itself; nothing static to resolve
			void goto(url.pathname + url.search + url.hash);
		});
	};
	node.addEventListener('click', onClick);
	return {
		destroy() {
			node.removeEventListener('click', onClick);
		}
	};
}
