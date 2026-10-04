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

/** Main tab hrefs as a group — the outer navigator runs on this. */
export const MAIN_TAB_HREFS: readonly (typeof TABS)[number]['href'][] = TABS.map((t) => t.href);

// Inner tab groups live here too, same treatment as main tabs.
// New drill section = add its hrefs here, wrap its layout in <SwipeZone>.
export const HOME_DETAIL_TABS = [
	'/home/innerPage',
	'/home/innerPage/details',
	'/home/innerPage/activity'
] as const;

export const HOME_DETAIL_HREFS: readonly (typeof HOME_DETAIL_TABS)[number][] = [
	...HOME_DETAIL_TABS
];
