// Central reduced-motion helpers. Two layers honor the OS setting:
// 1. CSS (`app.css` media query) kills CSS transitions/animations.
// 2. JS here zeroes Svelte-transition durations + skips ripple/drag-follow,
//    which are rAF-driven and invisible to the CSS kill-switch.

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export function isReducedMotion(): boolean {
	if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
	try {
		return window.matchMedia(REDUCED_MOTION_QUERY).matches;
	} catch {
		return false;
	}
}

/** Full duration normally, 0 when the user asked for reduced motion. */
export function motionMs(fullMs: number): number {
	return isReducedMotion() ? 0 : fullMs;
}
