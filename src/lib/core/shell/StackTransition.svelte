<script lang="ts">
	import { page } from '$app/state';
	import { scale, fade } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	let { children } = $props();
</script>

{#key page.url.pathname}
	<div
		class="stack-page"
		in:scale={{ start: 0.96, duration: 200, easing: quintOut }}
		out:fade={{ duration: 120 }}
	>
		{@render children()}
	</div>
{/key}

<style>
	.stack-page {
		position: absolute;
		inset: 0;
		overflow-y: auto;
	}
</style>
