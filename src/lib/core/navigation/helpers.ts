import { TAB_ORDER, type TabName } from '$lib/config/tabs';
import { TAB_HREF } from '$lib/config/tabs';

export function tabRootOf(pathname: string): TabName | undefined {
	const seg = pathname.split('/').filter(Boolean)[0];
	return (TAB_ORDER as readonly string[]).includes(seg ?? '') ? (seg as TabName) : undefined;
}

export function tabHref(name: TabName): string {
	return TAB_HREF[name];
}
