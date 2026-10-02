import { goto } from '$app/navigation';
import { sessionDepth } from '$lib/stores/navigation.svelte';
import { asResolved, type ResolvedPath } from '$lib/utils/resolvePath';

const homeHref = asResolved('/home');

export function goBack(fallback: ResolvedPath = homeHref) {
	if (sessionDepth.depth > 0) {
		history.back();
	} else {
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		goto(fallback);
	}
}