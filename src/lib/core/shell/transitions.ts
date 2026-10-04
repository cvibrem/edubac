import { f7MdForward } from '$lib/core/shell/easing';

/**
 * Shared tab-slide transitions (outer AppShell + sticky inner groups).
 * slideOut starts from the live drag offset (0 when released without
 * dragging), so a drag release continues from under the finger.
 */
export function slideIn(_node: HTMLElement, { direction = 1, duration = 240 } = {}) {
	return {
		duration,
		easing: f7MdForward,
		css: (t: number) => `transform: translateX(${(1 - t) * 100 * direction}%)`
	};
}

// Side-by-side: outgoing slides out while incoming slides in, same
// duration/easing, no opacity fade (the fade is what flashed white).
export function slideOut(node: HTMLElement, { direction = 1, duration = 240 } = {}) {
	let startPx = 0;
	try {
		startPx = new DOMMatrixReadOnly(getComputedStyle(node).transform).m41;
	} catch {
		startPx = 0;
	}
	return {
		duration,
		easing: f7MdForward,
		css: (t: number) =>
			`transform: translateX(calc(${(1 - t) * -100 * direction}% + ${startPx * t}px))`
	};
}

const SPRING_BACK_MS = 180;

/** Animate a dragged page back to rest, then clear the inline styles. */
export function springBack(el: HTMLElement) {
	el.style.transition = `transform ${SPRING_BACK_MS}ms cubic-bezier(0, 0.8, 0.3, 1)`;
	el.style.transform = 'translateX(0px)';
	const done = () => {
		el.removeEventListener('transitionend', done);
		if (el.style.transform === 'translateX(0px)') {
			el.style.transition = '';
			el.style.transform = '';
		}
	};
	el.addEventListener('transitionend', done);
	// Fallback if transitionend never fires; guarded so a newer drag is untouched.
	setTimeout(() => {
		if (el.isConnected && el.style.transform === 'translateX(0px)') {
			el.style.transition = '';
			el.style.transform = '';
		}
	}, SPRING_BACK_MS + 120);
}
