/**
 * F7 Material-style touch ripple, delegated.
 *
 * Any `.ripple` element gets a press wave; add `.ripple-light` on dark
 * backgrounds. One global install from AppShell — new buttons just add
 * the class, no per-component code. Math and timings cloned from
 * Framework7's touch-ripple (200ms in, 250ms fade out).
 */

interface ActiveRipple {
	wave: HTMLDivElement;
	x0: number;
	y0: number;
	outCalled: boolean;
	fallback: ReturnType<typeof setTimeout>;
}

/** Finger drift before the press counts as a scroll/swipe, not a tap. */
const MOVE_TOLERANCE_PX = 10;

/** Safety net so a wave can never stick around if events go missing. */
const MAX_WAVE_LIFETIME_MS = 1500;

function createWave(host: HTMLElement, x: number, y: number): HTMLDivElement | null {
	const rect = host.getBoundingClientRect();
	if (rect.width === 0 && rect.height === 0) return null;
	const cx = x - rect.left;
	const cy = y - rect.top;
	const diameter = Math.max(Math.hypot(rect.width, rect.height), 48);
	let transform: string;
	if (getComputedStyle(host).overflow === 'hidden') {
		const dist = Math.hypot(cx - rect.width / 2, cy - rect.height / 2);
		const scale = (diameter / 2 + dist) / (diameter / 2);
		transform = `translate3d(0px, 0px, 0) scale(${scale * 2})`;
	} else {
		transform = `translate3d(${-cx + rect.width / 2}px, ${-cy + rect.height / 2}px, 0) scale(1)`;
	}
	const wave = document.createElement('div');
	wave.className = 'ripple-wave';
	wave.style.width = `${diameter}px`;
	wave.style.height = `${diameter}px`;
	wave.style.marginTop = `${-diameter / 2}px`;
	wave.style.marginLeft = `${-diameter / 2}px`;
	wave.style.left = `${cx}px`;
	wave.style.top = `${cy}px`;
	wave.style.setProperty('--ripple-transform', transform);
	host.prepend(wave);
	return wave;
}

function removeRipple(active: Map<number, ActiveRipple>, id: number, r: ActiveRipple): void {
	clearTimeout(r.fallback);
	r.wave.remove();
	active.delete(id);
}

/** Start the 250ms fade-out; immediate skips it (gesture cancelled). */
function finishRipple(
	active: Map<number, ActiveRipple>,
	id: number,
	r: ActiveRipple,
	immediate: boolean
): void {
	if (immediate) {
		removeRipple(active, id, r);
		return;
	}
	if (r.outCalled) return;
	r.outCalled = true;
	r.wave.classList.add('ripple-wave-out');
}

/** Install document-level ripple delegation. Returns a cleanup function. */
export function initRipple(): () => void {
	const noop = () => {};
	// Reduced motion: no press waves at all (the .ripple class is harmless).
	if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
		try {
			if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return noop;
		} catch {
			// Fall through to normal ripple.
		}
	}
	const active = new Map<number, ActiveRipple>();

	function onPointerDown(e: PointerEvent): void {
		if (!e.isPrimary) return;
		if (e.pointerType === 'mouse' && e.button !== 0) return;
		const host = (e.target as HTMLElement | null)?.closest?.('.ripple') as HTMLElement | null;
		if (!host) return;
		const wave = createWave(host, e.clientX, e.clientY);
		if (!wave) return;
		const id = e.pointerId;
		const ripple: ActiveRipple = {
			wave,
			x0: e.clientX,
			y0: e.clientY,
			outCalled: false,
			fallback: setTimeout(() => {
				const pending = active.get(id);
				if (pending) removeRipple(active, id, pending);
			}, MAX_WAVE_LIFETIME_MS)
		};
		wave.addEventListener('animationend', () => {
			if (wave.classList.contains('ripple-wave-out')) removeRipple(active, id, ripple);
		});
		active.set(id, ripple);
	}

	function onPointerMove(e: PointerEvent): void {
		const r = active.get(e.pointerId);
		if (!r || r.outCalled) return;
		if (Math.hypot(e.clientX - r.x0, e.clientY - r.y0) > MOVE_TOLERANCE_PX) {
			finishRipple(active, e.pointerId, r, false);
		}
	}

	function onPointerUp(e: PointerEvent): void {
		const r = active.get(e.pointerId);
		if (r) finishRipple(active, e.pointerId, r, false);
	}

	function onPointerCancel(e: PointerEvent): void {
		const r = active.get(e.pointerId);
		if (r) finishRipple(active, e.pointerId, r, true);
	}

	document.addEventListener('pointerdown', onPointerDown, { passive: true });
	document.addEventListener('pointermove', onPointerMove, { passive: true });
	document.addEventListener('pointerup', onPointerUp, { passive: true });
	document.addEventListener('pointercancel', onPointerCancel, { passive: true });

	return () => {
		document.removeEventListener('pointerdown', onPointerDown);
		document.removeEventListener('pointermove', onPointerMove);
		document.removeEventListener('pointerup', onPointerUp);
		document.removeEventListener('pointercancel', onPointerCancel);
	};
}
