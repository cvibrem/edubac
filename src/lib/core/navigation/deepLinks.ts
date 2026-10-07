import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { DEFAULT_TAB_HREF, TAB_ORDER } from '$lib/config/tabs';
import { APP_HOSTS, APP_SCHEMES, EXTRA_LINK_PATHS } from '$lib/config/links';

/**
 * Deep links, framework-side. Pure string parsing (no Capacitor here) so the
 * same code runs on web and native — the native adapter in
 * `src/lib/native/bridge.ts` just forwards `appUrlOpen` urls to
 * `handleDeepLink()`. Accepted forms:
 *   tabshell://search            (host or path style: tabshell:///search too)
 *   tabshell://home/innerPage/details
 *   https://tabshell.app/search  (host must be in APP_HOSTS)
 *   /search                      (plain in-app path)
 * Anything else (unknown scheme/host/path) returns null = not ours.
 */
export function parseDeepLink(raw: string): string | null {
	const trimmed = raw.trim();
	if (!trimmed) return null;
	if (trimmed.startsWith('/')) return sanitizePath(trimmed);
	if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) return null;

	let url: URL;
	try {
		url = new URL(trimmed);
	} catch {
		return null;
	}
	const scheme = url.protocol.replace(/:$/, '').toLowerCase();

	if (scheme === 'http' || scheme === 'https') {
		if (!(APP_HOSTS as readonly string[]).includes(url.hostname.toLowerCase())) return null;
		return sanitizePath(url.pathname);
	}
	if (!(APP_SCHEMES as readonly string[]).includes(scheme)) return null;

	// Custom scheme: the target may sit in the host (`app://search`) or in
	// the path (`app:///search`, `app://x/home`). Rejoin both halves.
	const host = url.hostname.toLowerCase();
	const combined = host ? `/${host}${url.pathname}` : url.pathname || '/';
	return sanitizePath(combined);
}

/** Keep the pathname only (links never carry query state here) and only if it names a real screen. */
function sanitizePath(pathAndMore: string): string | null {
	const pathname = pathAndMore.split(/[?#]/)[0] || '/';
	if (!pathname.startsWith('/')) return null;
	if (pathname === '/') return DEFAULT_TAB_HREF;
	const seg = pathname.split('/').filter(Boolean)[0] ?? '';
	if ((TAB_ORDER as readonly string[]).includes(seg)) return pathname;
	if ((EXTRA_LINK_PATHS as readonly string[]).includes(pathname)) return pathname;
	return null;
}

/** Route a deep-link url through the tab router. Returns false when not ours. */
export async function handleDeepLink(raw: string): Promise<boolean> {
	const path = parseDeepLink(raw);
	if (!path) return false;
	try {
		// Cast: resolve() is string-based at runtime; the literal union is compile-time only.
		await goto(resolve(path as '/home'));
		return true;
	} catch {
		return false;
	}
}
