import { TAB_HREF, TAB_ORDER, type TabName } from '$lib/config/tabs';

export function tabRootOf(pathname: string): TabName | undefined {
	const seg = pathname.split('/').filter(Boolean)[0];
	return (TAB_ORDER as readonly string[]).includes(seg ?? '') ? (seg as TabName) : undefined;
}

export function tabHref(name: TabName): string {
	return TAB_HREF[name];
}

/** Neighbor tab in swipe direction. No wrap-around: undefined at either end. */
export function adjacentTab(root: TabName | undefined, dir: 1 | -1): TabName | undefined {
	if (!root) return undefined;
	const next = TAB_ORDER.indexOf(root) + dir;
	return next < 0 || next >= TAB_ORDER.length ? undefined : TAB_ORDER[next];
}
