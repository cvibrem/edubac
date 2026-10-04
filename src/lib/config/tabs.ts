// Routes only — no labels, icons or presentation here. UI owns that.
// New project = edit hrefs below (and add/remove entries).
export const TAB_HREF = {
	home: '/home',
	search: '/search',
	notifications: '/notifications',
	profile: '/profile'
} as const;

export const TABS = [
	{ name: 'home', href: TAB_HREF.home },
	{ name: 'search', href: TAB_HREF.search },
	{ name: 'notifications', href: TAB_HREF.notifications },
	{ name: 'profile', href: TAB_HREF.profile }
] as const;

export type TabName = (typeof TABS)[number]['name'];

export const TAB_ORDER: readonly TabName[] = TABS.map((t) => t.name);

export const DEFAULT_TAB_HREF: (typeof TABS)[number]['href'] = TABS[0].href;
