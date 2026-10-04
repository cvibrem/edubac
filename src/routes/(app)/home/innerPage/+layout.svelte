<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { goBack } from '$lib/core/navigation/back';
	import { asResolved } from '$lib/core/navigation/paths';
	import SwipeZone from '$lib/core/shell/SwipeZone.svelte';

	let { children } = $props();

	const innerTabs = [
		{ label: 'Overview', href: resolve('/home/innerPage') },
		{ label: 'Details', href: resolve('/home/innerPage/details') },
		{ label: 'Activity', href: resolve('/home/innerPage/activity') }
	];
	const innerHrefs = ['/home/innerPage', '/home/innerPage/details', '/home/innerPage/activity'];
</script>

<SwipeZone routes={innerHrefs} parentRoot="home">
	<div class="inner-header">
		<button type="button" class="back-btn" onclick={() => goBack(asResolved('/home'))}>←</button>
		<span class="inner-title">Home detail</span>
	</div>
	<nav class="inner-tabs">
		{#each innerTabs as t (t.href)}
			<a href={t.href} class="inner-tab" class:active={page.url.pathname === t.href}>
				{t.label}
			</a>
		{/each}
	</nav>
	<div class="inner-body">
		{@render children()}
	</div>
</SwipeZone>

<style>
	.inner-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.6rem 0.75rem;
		color: #fff;
		background: #1c1917;
	}
	.back-btn {
		font-size: 1.1rem;
		padding: 0.25rem 0.6rem;
		border-radius: 8px;
		border: none;
		background: rgba(255, 255, 255, 0.2);
		color: #fff;
	}
	.inner-title {
		font-weight: 700;
	}
	.inner-tabs {
		position: sticky;
		top: 0;
		z-index: 2;
		display: flex;
		gap: 0.25rem;
		padding: 0.6rem 0.75rem;
		background: #1c1917;
	}
	.inner-tab {
		flex: 1;
		text-align: center;
		padding: 0.5rem 0.25rem;
		border-radius: 8px;
		color: #fff;
		text-decoration: none;
		font-size: 0.85rem;
		background: rgba(255, 255, 255, 0.15);
	}
	.inner-tab.active {
		background: #fff;
		color: #111;
		font-weight: 700;
	}
	.inner-body {
		flex: 1;
		display: flex;
		flex-direction: column;
	}
</style>
