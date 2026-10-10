// App theme choice (per device, localStorage).
// `system` follows the OS via the prefers-color-scheme queries in
// tokens.css; `light`/`dark` pin a scheme with the manual `.light`/`.dark`
// overrides (loaded after the media query, so they win either way).
// Applies at import — before first paint — like i18n.

export type ThemeChoice = 'system' | 'light' | 'dark';

const KEY = 'edubac.theme';
const CHOICES: readonly ThemeChoice[] = ['system', 'light', 'dark'];

class ThemeState {
	current = $state<ThemeChoice>('system');
}

export const themeState = new ThemeState();

function isChoice(value: unknown): value is ThemeChoice {
	return value === 'system' || value === 'light' || value === 'dark';
}

function apply(choice: ThemeChoice): void {
	if (typeof document === 'undefined') return;
	document.documentElement.classList.toggle('dark', choice === 'dark');
	document.documentElement.classList.toggle('light', choice === 'light');
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
