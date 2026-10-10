<script lang="ts">
	import { fade } from 'svelte/transition';
	import { motionMs } from '$lib/core/shell/reducedMotion';
	import Logo from '$lib/design/Logo.svelte';

	let { onFinished, minDuration = 1200 }: { onFinished: () => void; minDuration?: number } =
		$props();

	// The static boot splash (app.html) already branded the hydration wait,
	// so only top up to a full presentation — otherwise the web feels like
	// two splash screens back to back. performance.now() ≈ time since
	// navigation start ≈ boot display time. The floor keeps the handoff
	// from flashing by on fast loads.
	const TOP_UP_FLOOR_MS = 300;
	const bootMs = typeof performance === 'undefined' ? 0 : performance.now();

	$effect(() => {
		const waitMs = Math.max(TOP_UP_FLOOR_MS, minDuration - bootMs);
		const timer = setTimeout(() => onFinished(), waitMs);
		return () => clearTimeout(timer);
	});
</script>

<div class="splash" out:fade={{ duration: motionMs(250) }}>
	<div class="logo-wrap">
		<Logo />
	</div>
	<p class="app-name">Edubac Haiti</p>
</div>

<style>
	.splash {
		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		/* Lift the mark above dead-center: the bottom padding shifts the
		   centered logo up, leaving its center at ~40% viewport height. */
		padding-bottom: 30vh;
		background: var(--surface);
		/* Logo follows the theme blue (navy light, steel blue dark). */
		color: var(--primary);
		z-index: 9999;
	}
	.logo-wrap {
		display: flex;
		justify-content: center;
		width: 35%;
	}
	.app-name {
		position: absolute;
		right: 0;
		bottom: max(2rem, env(safe-area-inset-bottom, 0px));
		left: 0;
		margin: 0;
		text-align: center;
		color: var(--ink-3);
		font-size: var(--fs-h1);
		font-weight: var(--fw-medium);
	}
</style>
