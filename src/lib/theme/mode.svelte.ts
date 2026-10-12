// App theme choice (per device, localStorage).
// `system` tracks the OS via matchMedia('(prefers-color-scheme: dark)') and
// pins an explicit `.light`/`.dark` class on <html> — deliberately NOT
// relying on the bare CSS media query alone. The Capacitor WebView sits
// behind an `uiMode` configChanges path where the media query does not
// re-fire reliably on live OS toggles, so JS drives the class instead
// (and stays observable/testable). `light`/`dark` pin a scheme with the
// manual `.light`/`.dark` overrides in tokens.css (loaded after the media
// query, so they win either way).
// Applies at import — before first paint — like i18n.

export type ThemeChoice = 'system' | 'light' | 'dark';

const KEY = 'edubac.theme';
const CHOICES: readonly ThemeChoice[] = ['system', 'light', 'dark'];
const MQ = '(prefers-color-scheme: dark)';

class ThemeState {
	current = $state<ThemeChoice>('system');
}

export const themeState = new ThemeState();

function isChoice(value: unknown): value is ThemeChoice {
	return value === 'system' || value === 'light' || value === 'dark';
}

function osIsDark(): boolean {
	try {
		if (typeof window === 'undefined') return false;
		return !!window.matchMedia?.(MQ).matches;
	} catch {
		return false;
	}
}

function apply(choice: ThemeChoice): void {
	if (typeof document === 'undefined') return;
	const dark = choice === 'dark' || (choice === 'system' && osIsDark());
	document.documentElement.classList.toggle('dark', dark);
	document.documentElement.classList.toggle('light', !dark);
	try {
		// Keep form controls/scrollbars in sync (tokens.css also declares
		// color-scheme per class; this covers any pre-stylesheet paint).
		document.documentElement.style.colorScheme = choice === 'system' ? 'light dark' : choice;
	} catch {
		// Non-fatal.
	}
}

function initTheme(): void {
	let stored: ThemeChoice = 'system';
	try {
		const raw = localStorage.getItem(KEY);
		if (isChoice(raw)) stored = raw;
	} catch {
		// Storage unavailable: fall through to system.
	}
	themeState.current = stored;
	apply(stored);
	// Live OS changes while on `system`: re-pin the class from the query.
	if (typeof window === 'undefined') return;
	try {
		const mql = window.matchMedia(MQ);
		const onChange = () => {
			if (themeState.current === 'system') apply('system');
		};
		if (typeof mql.addEventListener === 'function') mql.addEventListener('change', onChange);
		else mql.addListener(onChange);
	} catch {
		// Older WebViews: the static init above still applies.
	}
}

// Runs at import: client first paint already uses the right theme.
// During SSR/prerender the guards keep the default.
initTheme();

export function getTheme(): ThemeChoice {
	return themeState.current;
}

export function setTheme(choice: ThemeChoice): void {
	if (!CHOICES.includes(choice)) return;
	themeState.current = choice;
	try {
		localStorage.setItem(KEY, choice);
	} catch {
		// Non-fatal — choice simply won't persist.
	}
	apply(choice);
}
