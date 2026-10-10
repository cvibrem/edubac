<!-- Onboarding-only experiment: letter-diff title morph. Common prefix/suffix
  stay put; only the changed middle rolls out (up+blur) and in (from below).
  Reduced motion (or its CSS kill-switch) degrades to an instant swap. -->
<script lang="ts">
	import { isReducedMotion } from '$lib/core/shell/reducedMotion';

	let { text }: { text: string } = $props();

	const OUT_MS = 160;
	const IN_MS = 300;
	const STAGGER_OUT = 15;
	const STAGGER_IN = 22;

	let prefix = $state('');
	let mid = $state('');
	let suffix = $state('');
	let midState = $state<'idle' | 'out' | 'in'>('idle');
	let stageMid = $state('');
	let seq = 0;
	let firstRun = true;
	let timer: ReturnType<typeof setTimeout> | undefined;

	function diff(a: string, b: string) {
		const A = [...a];
		const B = [...b];
		let p = 0;
		while (p < A.length && p < B.length && A[p] === B[p]) p++;
		let s = 0;
		while (s < A.length - p && s < B.length - p && A[A.length - 1 - s] === B[B.length - 1 - s]) s++;
		return {
			pre: A.slice(0, p).join(''),
			oldMid: A.slice(p, A.length - s).join(''),
			newMid: B.slice(p, B.length - s).join(''),
			suf: A.slice(A.length - s).join('')
		};
	}

	$effect(() => {
		const next = text;
		if (next === prefix + mid + suffix) return;
		const my = ++seq;
		clearTimeout(timer);
		if (firstRun || isReducedMotion()) {
			firstRun = false;
			prefix = next;
			mid = '';
			suffix = '';
			midState = 'idle';
			return;
		}
		const d = diff(prefix + mid + suffix, next);
		prefix = d.pre;
		suffix = d.suf;
		stageMid = d.oldMid;
		midState = 'out';
		timer = setTimeout(
			() => {
				if (my !== seq) return;
				stageMid = d.newMid;
				midState = 'in';
				timer = setTimeout(
					() => {
						if (my !== seq) return;
						mid = d.newMid;
						stageMid = '';
						midState = 'idle';
					},
					IN_MS + [...d.newMid].length * STAGGER_IN + 50
				);
			},
			OUT_MS + [...d.oldMid].length * STAGGER_OUT + 50
		);
		return () => clearTimeout(timer);
	});
</script>

<!-- Full text for screen readers; the animated spans are presentational. -->
<span class="sr-only">{text}</span>
<span class="morph" aria-hidden="true"
	><span class="stable">{prefix}</span>{#if midState === 'out'}<span class="mid"
			>{#each [...stageMid] as ch, i (i)}<span
					class="mchar out"
					style="animation-delay:{i * STAGGER_OUT}ms">{ch}</span
				>{/each}</span
		>{:else if midState === 'in'}<span class="mid"
			>{#each [...stageMid] as ch, i (i)}<span
					class="mchar in"
					style="animation-delay:{i * STAGGER_IN}ms">{ch}</span
				>{/each}</span
		>{:else}<span class="mid">{mid}</span>{/if}<span class="stable">{suffix}</span></span
>

<style>
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
	.morph {
		white-space: pre;
	}
	.mchar {
		display: inline-block;
		will-change: transform, opacity;
	}
	.mchar.out {
		animation: morph-out var(--morph-out-ms, 160ms) cubic-bezier(0.5, 0, 0.8, 0.4) forwards;
	}
	.mchar.in {
		/* Framework7 Material forward curve, like the rest of the shell. */
		animation: morph-in var(--morph-in-ms, 300ms) cubic-bezier(0, 0.8, 0.3, 1) backwards;
	}
	@keyframes morph-out {
		to {
			transform: translateY(-0.45em);
			opacity: 0;
			filter: blur(5px);
		}
	}
	@keyframes morph-in {
		from {
			transform: translateY(0.5em);
			opacity: 0;
			filter: blur(5px);
		}
		to {
			transform: none;
			opacity: 1;
			filter: none;
		}
	}
</style>
