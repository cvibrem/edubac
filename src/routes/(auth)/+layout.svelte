<script lang="ts">
	import { onMount } from 'svelte';
	import { onNavigate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { slideIn, slideOut } from '$lib/core/shell/transitions';

	// Auth drill depth: welcome is the root, everything else pushes over it.
	// Same depth (login <-> terms) pushes too — slide-left everywhere except
	// the way back to welcome.
	const DEPTH: Map<string, number> = new Map([
		[resolve('/welcome'), 0],
		[resolve('/login'), 1],
		[resolve('/terms'), 1],
		[resolve('/privacy'), 1]
	]);

	const PUSH_MS = 240;

	let { children } = $props();
	let direction = $state(1);
	// First mount never animates in: welcome is revealed by the onboarding
	// exit (or the page cold-loads) — the push only plays between screens.
	let entered = $state(false);

	onMount(() => {
		entered = true;
	});

	onNavigate((navigation) => {
		const to = navigation.to?.url.pathname;
		const from = navigation.from?.url.pathname;
		if (!to || !from) return;
		const dTo = DEPTH.get(to) ?? 0;
		const dFrom = DEPTH.get(from) ?? 0;
		direction = dTo >= dFrom ? 1 : -1;
	});
</script>

<div class="auth-motion">
	{#key page.url.pathname}
		<div
			class="auth-stack"
			in:slideIn={{ direction, duration: entered ? PUSH_MS : 0 }}
			out:slideOut={{ direction, duration: PUSH_MS }}
		>
			{@render children()}
		</div>
	{/key}
</div>

<style>
	/* Push stage (mirrors AppShell's tab-viewport/tab-page split): the
	   keyed stacks overlap absolutely so outgoing + incoming slide
	   together with no layout jump. Each auth page keeps its own
	   internal scroll (height: 100dvh fills the stack exactly). */
	.auth-motion {
		position: relative;
		height: 100dvh;
		overflow: hidden;
	}
	.auth-stack {
		position: absolute;
		inset: 0;
	}
</style>
