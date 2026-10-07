
import { DEFAULT_LOCALE, STORAGE_KEY, SUPPORTED_LOCALES, type LocaleCode } from '$lib/config/i18n';
import { catalogs, defaultCatalog } from './catalogs';

/**
 * Minimal JSON i18n for the tab-shell base. Flat dotted keys; every locale
 * must carry the exact key set of the default locale — a missing or extra
 * key is a compile error (see catalogs.ts), not a runtime surprise.
 */
export type TIKey = keyof typeof defaultCatalog;

const all: Record<LocaleCode, Record<TIKey, string>> = catalogs;

class LocaleState {
	current = $state<LocaleCode>(DEFAULT_LOCALE);
}

export const localeState = new LocaleState();

function resolveLocale(code: string | null | undefined): LocaleCode {
	if (code && code in all) return code as LocaleCode;
	if (code) {
		const prefix = code.split('-')[0]?.toLowerCase() ?? '';
		const match = SUPPORTED_LOCALES.find((l) => l.code.toLowerCase().startsWith(prefix));
		if (match) return match.code;
	}
	return DEFAULT_LOCALE;
}

function applyDocumentLang(): void {
	if (typeof document !== 'undefined') document.documentElement.lang = localeState.current;
}

/** Stored choice → browser locale (exact, then language prefix) → default. */
function initI18n(): void {
	let stored: string | null = null;
	try {
		stored = localStorage.getItem(STORAGE_KEY);
	} catch {
		// Storage unavailable: fall through to detection.
	}
	const detected = typeof navigator !== 'undefined' ? navigator.language : null;
	localeState.current = resolveLocale(stored ?? detected);
	applyDocumentLang();
}

// Runs at import: client first paint already uses the right locale.
// During SSR/prerender the guards keep the default.
initI18n();

export function getLocale(): LocaleCode {
	return localeState.current;
}

export function setLocale(code: LocaleCode): void {
	localeState.current = code;
	try {
		localStorage.setItem(STORAGE_KEY, code);
	} catch {
		// Non-fatal — choice simply won't persist.
	}
	applyDocumentLang();
}

/** Reactive: re-renders automatically on setLocale. Falls back to default, then the key. */
export function t(key: TIKey): string {
	const hit = all[localeState.current][key] ?? all[DEFAULT_LOCALE][key] ?? key;
	if (hit === key && import.meta.env.DEV) {
		console.warn(`[i18n] missing key "${key}" for locale "${localeState.current}"`);
	}
	return hit;
}
