<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { initRipple } from '$lib/core/shell/ripple';
	import { isReducedMotion } from '$lib/core/shell/reducedMotion';
	import { markOnboardingSeen } from '$lib/onboarding/seen';
	import { t, type TIKey } from '$lib/i18n/index.svelte';
	import Logo from '$lib/design/Logo.svelte';
	import TitleMorph from './TitleMorph.svelte';
	import { motionMs } from '$lib/core/shell/reducedMotion';
	import { pressFeedback, releasePress, tryClaimPress } from '$lib/core/shell/press';

	const ARTS = ['art-discover', 'art-practice', 'art-improve'] as const;
	const TITLE_KEYS = ['ob.s1title', 'ob.s2title', 'ob.s3title'] as const satisfies readonly TIKey[];
	const TEXT_KEYS = ['ob.s1text', 'ob.s2text', 'ob.s3text'] as const satisfies readonly TIKey[];

	const SLIDE_MS = 4000;
	/** Exit slide duration — must match the `.leaving` transition below. */
	const LEAVE_MS = 280;

	let index = $state(0);
	let leaving = $state(false);

	onMount(() => initRipple());

	// Auto-play only (no gestures): advances every SLIDE_MS, skips ticks
	// while the tab is hidden so the cycle never jumps a slide.
	// Reduced motion: no autoplay — the user advances by tapping Commencer.
	$effect(() => {
		if (isReducedMotion()) return;
		const timer = setInterval(() => {
			if (!document.hidden) index = (index + 1) % ARTS.length;
		}, SLIDE_MS);
		return () => clearInterval(timer);
	});

	function finish() {
		markOnboardingSeen();
		goto(resolve('/home'), { replaceState: true });
	}

	// Native-style exit: press wave finishes, then the whole page slides
	// right off (motionMs → instant under reduced motion). Guarded against
	// double-taps like every other press gate.
	async function start() {
		if (leaving || !tryClaimPress()) return;
		try {
			await pressFeedback();
			leaving = true;
			await new Promise<void>((r) => setTimeout(r, motionMs(LEAVE_MS)));
			finish();
		} finally {
			releasePress();
		}
	}
</script>

<svelte:head>
	<link rel="preload" as="image" href="/onboarding/ob-1.jpg" />
</svelte:head>

<section class="onboarding" class:leaving aria-label="Présentation">
	{#key index}
		<div class="art {ARTS[index]}" in:fade={{ duration: 600 }} out:fade={{ duration: 600 }}></div>
	{/key}
	<div class="scrim"></div>

	<header class="brand">
		<Logo />
		<span>Edubac</span>
	</header>

	<div class="content">
		<div class="copy-stack">
			<div class="copy" aria-live="polite">
				<h1><TitleMorph text={t(TITLE_KEYS[index])} /></h1>
				<div class="p-stack">
					{#key index}
						<p in:fade={{ duration: 350 }} out:fade={{ duration: 350 }}>
							{t(TEXT_KEYS[index])}
						</p>
					{/key}
				</div>
			</div>
		</div>
		<button type="button" class="btn btn-block ripple cta" onclick={start}>
			{t('ob.start')}
		</button>
	</div>
</section>

<style>
	.onboarding {
		position: relative;
		height: 100dvh;
		overflow: hidden;
		background: var(--bg);
	}
	/* Exit: the whole page slides right off (F7 forward curve, LEAVE_MS).
	   The app kill-switch makes this instant under reduced motion. */
	.onboarding.leaving {
		transform: translateX(102%);
		transition: transform 280ms cubic-bezier(0, 0.8, 0.3, 1);
	}
	/* Full-bleed photo per slide, crossfading. */
	.art {
		position: absolute;
		inset: 0;
		background-size: cover;
		background-position: center;
		background-color: var(--bg);
	}
	.art-discover {
		background-image: url('/onboarding/ob-1.jpg');
	}
	.art-practice {
		background-image: url('/onboarding/ob-2.jpg');
	}
	.art-improve {
		background-image: url('/onboarding/ob-3.jpg');
	}
	/* Contrast scrim: a top shade keeps the white brand header readable
	   over the light photos, transparent in the middle to show the
	   illustration, opaque brand navy at the bottom for copy + button
	   (both themes). */
	.scrim {
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;
		background:
			linear-gradient(to bottom, rgba(11, 30, 66, 0.5), transparent 26%),
			linear-gradient(to bottom, transparent 42%, #1c4da3 78%);
	}
	@media (prefers-color-scheme: dark) {
		.scrim {
			background:
				linear-gradient(to bottom, rgba(11, 30, 66, 0.55), transparent 26%),
				linear-gradient(to bottom, transparent 42%, #0b1a36 78%);
		}
	}
	:global(.dark) .scrim {
		background:
			linear-gradient(to bottom, rgba(11, 30, 66, 0.55), transparent 26%),
			linear-gradient(to bottom, transparent 42%, #0b1a36 78%);
	}
	.brand {
		position: absolute;
		top: 0;
		right: 0;
		left: 0;
		display: flex;
		align-items: center;
		gap: var(--sp-2);
		padding: max(var(--sp-4), env(safe-area-inset-top, 0px)) var(--pad-page) 0;
		color: #f7f9fd;
	}
	.brand :global(svg) {
		width: 2.25rem;
		height: auto;
	}
	.brand span {
		font-size: var(--fs-h2);
		font-weight: var(--fw-bold);
	}
	.content {
		position: absolute;
		right: 0;
		bottom: 0;
		left: 0;
		display: flex;
		flex-direction: column;
		gap: var(--sp-4);
		padding: var(--pad-page);
		padding-bottom: max(var(--sp-6), env(safe-area-inset-bottom, 0px));
	}
	.copy-stack {
		display: grid;
	}
	.copy {
		grid-area: 1 / 1;
	}
	/* Grid-stacked description crossfade: old + new <p> overlap instead of
	   stacking in flow (which would grow .copy and shove the h1 upward).
	   Reserved 3-line height so the h1 never moves when descriptions wrap
	   to different line counts (body lh 1.5 + the <p> bottom margin). */
	.p-stack {
		display: grid;
		min-height: calc(4.5em + var(--sp-6));
	}
	.p-stack p {
		grid-area: 1 / 1;
	}
	.copy h1 {
		margin: 0 0 var(--sp-2);
		font-size: clamp(2.25rem, 10vw, 3.25rem);
		line-height: 1.15;
		color: #f7f9fd;
	}
	.copy p {
		margin: 0 0 var(--sp-6) var(--sp-1);
		font-size: var(--fs-body);
		color: rgba(247, 249, 253, 0.85);
	}
	/* Visible press wave on the white CTA: the default blurred button
	   variant is imperceptible on near-white, so use a solid navy wash. */
	.cta :global(.ripple-wave) {
		background-image: none;
		background-color: rgba(28, 77, 163, 0.18);
		animation: ripple-in 200ms forwards;
	}
	/* White CTA on the navy scrim (both themes): full content width, tall. */
	.cta {
		width: 100%;
		min-height: 3.75rem;
		font-size: var(--fs-h3);
		font-weight: var(--fw-medium);
		border-radius: var(--r-lg);
		background: #f7f9fd;
		color: #1c4da3;
	}
</style>
