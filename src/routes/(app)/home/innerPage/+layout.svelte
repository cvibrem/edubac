<script lang="ts">
	import { page } from '$app/state';
	import { onNavigate } from '$app/navigation';
	import { goBack } from '$lib/core/navigation/back';
	import { asResolved } from '$lib/core/navigation/paths';
	import { switchInnerTab } from '$lib/core/navigation/state.svelte';
	import { HOME_DETAIL_HREFS } from '$lib/config/tabs';
	import { STICKY_SWIPE_INNER_TAB } from '$lib/config/motion';
	import { slideIn, slideOut } from '$lib/core/shell/transitions';
	import { t, type TIKey } from '$lib/i18n/index.svelte';
	import SwipeZone from '$lib/core/shell/SwipeZone.svelte';

	let { children } = $props();

	const KEY: Record<string, TIKey> = {
		'/home/innerPage': 'inner.overview',
		'/home/innerPage/details': 'inner.details',
		'/home/innerPage/activity': 'inner.activity'
	};
	const innerTabs = $derived(
		HOME_DETAIL_HREFS.map((href) => ({
			label: t(KEY[href] ?? 'inner.overview'),
			href: asResolved(href)
		}))
	);
	const innerHrefs = HOME_DETAIL_HREFS;

	function selectInner(e: MouseEvent, href: string) {
		if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
		e.preventDefault();
		switchInnerTab(innerHrefs, href, page.url.pathname);
	}

	// Sticky-slide direction, same pattern as the global navDirection:
	// onNavigate runs before the key block re-renders, so the slide
	// always starts toward the incoming route — taps, swipes and back.
	let innerDir = $state(1);
	onNavigate((navigation) => {
		const hrefs: readonly string[] = innerHrefs;
		const from = navigation.from?.url.pathname ?? '';
		const to = navigation.to?.url.pathname ?? '';
		const a = hrefs.indexOf(from);
		const b = hrefs.indexOf(to);
		if (a !== -1 && b !== -1 && a !== b) innerDir = b > a ? 1 : -1;
	});
</script>

<SwipeZone routes={innerHrefs} parentRoot="home">
	<div class="inner-header">
		<button
			type="button"
			class="back-btn ripple ripple-light"
			onclick={() => goBack(asResolved('/home'))}>←</button
		>
		<span class="inner-title">{t('inner.title')}</span>
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
	<div class="inner-body" class:inner-body-sticky={STICKY_SWIPE_INNER_TAB} data-swipe-body>
		{#if STICKY_SWIPE_INNER_TAB}
			{#key page.url.pathname}
				<div
					class="sticky-inner-page"
					in:slideIn={{ direction: innerDir }}
					out:slideOut={{ direction: innerDir }}
				>
					{@render children()}
				</div>
			{/key}
		{:else}
			{@render children()}
		{/if}
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
	/* Sticky mode: slide pages overlap absolutely, body clips them. */
	.inner-body-sticky {
		position: relative;
		overflow: hidden;
	}
	.sticky-inner-page {
		position: absolute;
		inset: 0;
		overflow-y: auto;
		touch-action: pan-y;
	}
</style>
