<script lang="ts">
	import { fade } from 'svelte/transition';

	let { onFinished, minDuration = 1200 }: { onFinished: () => void; minDuration?: number } =
		$props();

	$effect(() => {
		const timer = setTimeout(() => onFinished(), minDuration);
		return () => clearTimeout(timer);
	});
</script>

<div class="splash" out:fade={{ duration: 250 }}>
	<img src="/assets/imgs/icon.svg" alt="App logo" class="logo" />
</div>

<style>
	.splash {
		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-splash-bg);
		z-index: 9999;
	}
	.logo {
		width: 96px;
		height: 96px;
	}
</style>
