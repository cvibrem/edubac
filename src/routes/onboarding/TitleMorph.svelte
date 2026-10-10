<!-- Onboarding-only experiment: typewriter title morph. The common
  prefix/suffix never move; the changed middle is backspaced out
  (right-to-left) then typed in (left-to-right) behind a caret.
  Reduced motion (or its CSS kill-switch) degrades to an instant swap. -->
<script lang="ts">
	import { onDestroy, untrack } from 'svelte';
	import { isReducedMotion } from '$lib/core/shell/reducedMotion';

	let { text }: { text: string } = $props();

	const DEL_MS = 35;
	const TYPE_MS = 55;

	let prefix = $state('');
	let mid = $state('');
	let suffix = $state('');
	let phase = $state<'idle' | 'delete' | 'type'>('idle');
	let stageMid = $state('');
	let stageCount = $state(0);
	let seq = 0;
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

	// Last target text (plain field, deliberately non-reactive). The effect
	// below subscribes to `text` only — all state reads happen inside
	// untrack() so the morph's own writes can never retrigger it mid-flight
	// and corrupt the diff.
	let lastTarget = '';

	function startMorph(next: string) {
		const shown = prefix + mid + suffix;
		if (next === shown) return;
		const my = ++seq;
		clearTimeout(timer);
		if (isReducedMotion()) {
			prefix = next;
			mid = '';
			suffix = '';
			phase = 'idle';
			return;
		}
		const d = diff(shown, next);
		prefix = d.pre;
		suffix = d.suf;
		// Phase 1: backspace the old middle, right-to-left.
		stageMid = d.oldMid;
		stageCount = [...d.oldMid].length;
		phase = 'delete';
		const tickDel = () => {
			if (my !== seq) return;
			if (stageCount <= 0) {
				// Phase 2: type the new middle, left-to-right.
				stageMid = d.newMid;
				stageCount = 0;
				phase = 'type';
				const tickType = () => {
					if (my !== seq) return;
					if (stageCount >= [...d.newMid].length) {
						mid = d.newMid;
						stageMid = '';
						phase = 'idle';
						return;
					}
					stageCount += 1;
					timer = setTimeout(tickType, TYPE_MS);
				};
				timer = setTimeout(tickType, TYPE_MS);
				return;
			}
			stageCount -= 1;
			timer = setTimeout(tickDel, DEL_MS);
		};
		timer = setTimeout(tickDel, DEL_MS);
	}

	onDestroy(() => clearTimeout(timer));

	$effect(() => {
		const next = text;
		if (next === lastTarget) return;
		lastTarget = next;
		untrack(() => startMorph(next));
	});
</script>

<!-- Full text for screen readers; the animated spans are presentational. -->
<span class="sr-only">{text}</span>
<span class="morph" aria-hidden="true"
	><span class="stable">{prefix}</span>{#if phase === 'delete'}<span class="mid"
			>{[...stageMid].slice(0, stageCount).join('')}</span
		><span class="caret"></span>{:else if phase === 'type'}<span class="mid"
			>{[...stageMid].slice(0, stageCount).join('')}</span
		><span class="caret"></span>{:else}<span class="mid">{mid}</span>{/if}<span class="stable"
		>{suffix}</span
	></span
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
	.caret {
		display: inline-block;
		width: 0.09em;
		height: 1em;
		margin-bottom: -0.12em;
		margin-left: 0.04em;
		background: currentColor;
		animation: caret-blink 0.9s steps(2, start) infinite;
	}
	@keyframes caret-blink {
		50% {
			opacity: 0;
		}
	}
</style>
