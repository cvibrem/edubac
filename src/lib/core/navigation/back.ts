import { goto } from '$app/navigation';
import { tabHistory } from './state.svelte';
import { asResolved, type ResolvedPath } from './paths';
import { TAB_HREF } from '$lib/config/tabs';

const homeHref = asResolved(TAB_HREF.home);

export function goBack(fallback: ResolvedPath = homeHref) {
	if (tabHistory.inFlight) return;
	if (tabHistory.canGoBack) {
		history.back();
	} else {
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		goto(fallback);
	}
}
