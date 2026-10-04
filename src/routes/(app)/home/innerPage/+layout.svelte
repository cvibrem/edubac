<script lang="ts">
	import { page } from '$app/state';
	import { goBack } from '$lib/core/navigation/back';
	import { asResolved } from '$lib/core/navigation/paths';
	import { switchInnerTab } from '$lib/core/navigation/state.svelte';
	import { HOME_DETAIL_HREFS } from '$lib/config/tabs';
	import SwipeZone from '$lib/core/shell/SwipeZone.svelte';

	let { children } = $props();

	const LABEL: Record<string, string> = {
		'/home/innerPage': 'Overview',
		'/home/innerPage/details': 'Details',
		'/home/innerPage/activity': 'Activity'
	};
	const innerTabs = HOME_DETAIL_HREFS.map((href) => ({
		label: LABEL[href] ?? href,
		href: asResolved(href)
	}));
	const innerHrefs = HOME_DETAIL_HREFS;

	function selectInner(e: MouseEvent, href: string) {
		if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
		e.preventDefault();
		switchInnerTab(innerHrefs, href, page.url.pathname);
	}
</script>

<SwipeZone routes={innerHrefs} parentRoot="home">
	<div class="inner-header">
		<button
			type="button"
			class="back-btn ripple ripple-light"
			onclick={() => goBack(asResolved('/home'))}>←</button
		>
		<span class="inner-title">Home detail</span>
	</div>
	<nav class="inner-tabs">
		<!-- eslint-disable svelte/no-navigation-without-resolve -- hrefs are declared app paths -->
		{#each innerTabs as t (t.href)}
			<a
				href={t.href}
				onclick={(e) => selectInner(e, t.href)}
				class="inner-tab ripple ripple-light"
				class:active={page.url.pathname === t.href}
			>
				{t.label}
			</a>
		{/each}
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
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
