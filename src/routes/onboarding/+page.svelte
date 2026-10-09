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

	const ARTS = ['art-discover', 'art-practice', 'art-improve'] as const;
	const TITLE_KEYS = ['ob.s1title', 'ob.s2title', 'ob.s3title'] as const satisfies readonly TIKey[];
	const TEXT_KEYS = ['ob.s1text', 'ob.s2text', 'ob.s3text'] as const satisfies readonly TIKey[];

	const SLIDE_MS = 4000;

	let index = $state(0);

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
</script>

<section class="onboarding" aria-label="Présentation">
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
			{#key index}
				<div
					class="copy"
					in:fade={{ duration: 350 }}
					out:fade={{ duration: 350 }}
					aria-live="polite"
				>
					<h1>{t(TITLE_KEYS[index])}</h1>
					<p>{t(TEXT_KEYS[index])}</p>
				</div>
			{/key}
		</div>
		<button type="button" class="btn btn-block ripple cta" onclick={finish}>
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
	/* Full-bleed slide layers, crossfading. Placeholder art (token navy,
	   theme-independent like photos) until real imagery lands. */
	.art {
		position: absolute;
		inset: 0;
	}
	.art-discover {
		background:
			radial-gradient(circle at 82% 18%, rgba(255, 255, 255, 0.22), transparent 34%),
			radial-gradient(circle at 12% 78%, rgba(143, 179, 234, 0.5), transparent 42%),
			linear-gradient(165deg, #0b1e42 0%, #1c4da3 62%, #3b78dd 100%);
	}
	.art-discover::after {
		content: '';
		position: absolute;
		right: -22%;
		bottom: 6%;
		width: 78%;
		aspect-ratio: 1;
		border: 2px solid rgba(255, 255, 255, 0.28);
		border-radius: 50%;
	}
	.art-practice {
		background:
			radial-gradient(circle at 15% 15%, rgba(255, 255, 255, 0.2), transparent 36%),
			radial-gradient(circle, rgba(255, 255, 255, 0.22) 2px, transparent 2.6px),
			linear-gradient(165deg, #0b1e42 0%, #1c4da3 62%, #3b78dd 100%);
		background-size:
			auto,
			28px 28px,
			auto;
	}
	.art-practice::after {
		content: '';
		position: absolute;
		top: 12%;
		left: -18%;
		width: 64%;
		aspect-ratio: 1;
		background: radial-gradient(circle, rgba(255, 255, 255, 0.22), transparent 68%);
	}
	.art-improve {
		background:
			radial-gradient(circle at 85% 80%, rgba(255, 255, 255, 0.18), transparent 38%),
			linear-gradient(165deg, #0b1e42 0%, #1c4da3 62%, #3b78dd 100%);
	}
	.art-improve::before {
		content: '';
		position: absolute;
		bottom: -12%;
		left: 8%;
		width: 34%;
		height: 72%;
		transform: rotate(24deg);
		background: linear-gradient(to top, rgba(255, 255, 255, 0.28), transparent);
		border-radius: var(--r-full);
	}
	.art-improve::after {
		content: '';
		position: absolute;
		top: 10%;
		right: 8%;
		width: 30%;
		aspect-ratio: 1;
		border: 2px solid rgba(255, 255, 255, 0.32);
		border-radius: 50%;
	}
	/* Contrast scrim: transparent high up, opaque brand navy at the bottom
	   so copy + button stay readable in both themes. */
	.scrim {
		position: absolute;
		top: 25%;
		right: 0;
		bottom: 0;
		left: 0;
		background: linear-gradient(to bottom, transparent, #1c4da3 72%);
	}
	@media (prefers-color-scheme: dark) {
		.scrim {
			background: linear-gradient(to bottom, transparent, #0b1a36 72%);
		}
	}
	:global(.dark) .scrim {
		background: linear-gradient(to bottom, transparent, #0b1a36 72%);
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
		width: 2rem;
		height: auto;
	}
	.brand span {
		font-size: var(--fs-h3);
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
	.copy h1 {
		margin: 0 0 var(--sp-2);
		font-size: clamp(2.5rem, 11vw, 3.5rem);
		line-height: 1.05;
		color: #f7f9fd;
	}
	.copy p {
		margin: 0 0 var(--sp-6);
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
		font-size: var(--fs-body);
		font-weight: var(--fw-medium);
		border-radius: var(--r-lg);
		background: #f7f9fd;
		color: #1c4da3;
	}
</style>
