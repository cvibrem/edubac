// Motion curves shared by all shell transitions.
// F7 Material forward slide: cubic-bezier(0, 0.8, 0.3, 1) — a decelerate
// curve (fast start, soft landing), the same family Android uses for
// forward navigation. Deliberately NOT symmetric ease-in-out, which
// reads as laggy on tab taps.

function calcBezier(t: number, a1: number, a2: number): number {
	return ((1 - 3 * a2 + 3 * a1) * t + (3 * a2 - 6 * a1)) * t * t + 3 * a1 * t;
}

function getSlope(t: number, a1: number, a2: number): number {
	return 3 * (1 - 3 * a2 + 3 * a1) * t * t + 2 * (3 * a2 - 6 * a1) * t + 3 * a1;
}

/** Standard CSS cubic-bezier solver (Newton-Raphson + bisection fallback). */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
	if (!(x1 >= 0 && x1 <= 1 && x2 >= 0 && x2 <= 1)) {
		throw new Error(`cubicBezier x values must be in [0, 1], got ${x1}, ${x2}`);
	}
	if (x1 === y1 && x2 === y2) return (t: number) => t;

	const TABLE_SIZE = 11;
	const STEP = 1 / (TABLE_SIZE - 1);
	const samples = new Float32Array(TABLE_SIZE);
	for (let i = 0; i < TABLE_SIZE; i++) samples[i] = calcBezier(i * STEP, x1, x2);

	function tForX(x: number): number {
		let start = 0;
		let i = 1;
		while (i < TABLE_SIZE - 1 && samples[i] <= x) {
			start += STEP;
			i++;
		}
		const span = samples[i] - samples[i - 1];
		let guess = span === 0 ? start : start + ((x - samples[i - 1]) / span) * STEP;
		const slope = getSlope(guess, x1, x2);
		if (slope >= 0.001) {
			for (let n = 0; n < 4; n++) {
				const s = getSlope(guess, x1, x2);
				if (s === 0) break;
				guess -= (calcBezier(guess, x1, x2) - x) / s;
			}
			return guess;
		}
		if (slope === 0) return guess;
		let a = start;
		let b = start + STEP;
		let current = guess;
		for (let n = 0; n < 10; n++) {
			current = (a + b) / 2;
			const err = calcBezier(current, x1, x2) - x;
			if (Math.abs(err) < 1e-7) break;
			if (err > 0) b = current;
			else a = current;
		}
		return current;
	}

	return (t: number) => {
		if (t <= 0) return 0;
		if (t >= 1) return 1;
		return calcBezier(tForX(t), y1, y2);
	};
}

/** F7 Material forward-slide curve. Use for tab slides and drill pushes. */
export const f7MdForward: (t: number) => number = cubicBezier(0, 0.8, 0.3, 1);
