import { goto } from '$app/navigation';
import { tabHistory } from './state.svelte';
import { overlay } from '$lib/core/overlay/state.svelte';
import { asResolved, type ResolvedPath } from './paths';
import { TAB_HREF } from '$lib/config/tabs';

const homeHref = asResolved(TAB_HREF.home);

export function goBack(fallback: ResolvedPath = homeHref) {
	// Modal overlays own the back button: dismiss first, navigate never.
	if (overlay.dismissTop()) return;
	if (tabHistory.inFlight) return;
	if (tabHistory.canGoBack) {
		history.back();
	} else {
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		goto(fallback);
	}
}

/**
 * Single system-back entry point (native back button via the native bridge,
 * browser back via `beforeNavigate` in the root layout which cancels the
 * popstate and calls `overlay.dismissTop()` itself).
 * Returns true when the press was consumed: overlay dismissed, history step
 * taken, or a transition swallowing a double-press. False = nothing to go
 * back to — the native shell should exit, the web shell does nothing.
 */
export function handleSystemBack(): boolean {
	if (overlay.dismissTop()) return true;
	if (tabHistory.inFlight) return true;
	if (tabHistory.canGoBack) {
		history.back();
		return true;
	}
	return false;
}
