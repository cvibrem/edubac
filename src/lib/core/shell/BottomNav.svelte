<script lang="ts">
	import { page } from '$app/state';
	import { TABS, type TabName } from '$lib/config/tabs';
	import { switchTab, tabHistory } from '$lib/core/navigation/state.svelte';
	import { asResolved, type ResolvedPath } from '$lib/core/navigation/paths';
	import { afterPress } from '$lib/core/shell/press';
	import { t, type TIKey } from '$lib/i18n/index.svelte';

	// Presentation lives here in the UI — the router config only knows name/href.
	const ICON: Record<TabName, string> = {
		home: '🏠',
		search: '🔍',
		notifications: '🔔',
		profile: '👤'
	};

	const tabs: { name: TabName; href: ResolvedPath; key: TIKey; icon: string }[] = TABS.map((t) => ({
		name: t.name,
		href: asResolved(t.href),
		key: `tabs.${t.name}` as TIKey,
		icon: ICON[t.name]
	}));

	// Local throttle: blocks double-taps issued before SvelteKit's
	// onNavigate/afterNavigate round-trip updates `inFlight`.
	let tapping = $state(false);

	function selectTab(e: MouseEvent, tab: (typeof tabs)[number]) {
		if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
		e.preventDefault();
		if (tapping || tabHistory.inFlight) return;

		tapping = true;
		setTimeout(() => (tapping = false), 400);
		// Native-style: the tab switches once the press wave has finished.
		void afterPress(() => switchTab(tab.name, page.url.pathname));
	}
</script>

<nav class="bottom-nav">
	<!-- eslint-disable svelte/no-navigation-without-resolve -- hrefs are pre-resolved via asResolved() -->
	{#each tabs as tab (tab.name)}
		<a
			href={tab.href}
			onclick={(e) => selectTab(e, tab)}
			class="nav-item ripple"
			class:active={page.url.pathname.startsWith(tab.href)}
		>
			<span class="icon">{tab.icon}</span>
			<span class="label">{t(tab.key)}</span>
		</a>
	{/each}
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
</nav>

<style>
	.bottom-nav {
		display: flex;
		justify-content: space-around;
		align-items: center;
		background: transparent;
		/* background: var(--color-surface); */
		border-top: 1px solid rgba(0, 0, 0, 0.08);
		padding-top: 0.5rem;
		padding-bottom: var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px));
	}
	.nav-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		font-size: 0.7rem;
		color: #888;
		text-decoration: none;
		padding: 0.25rem 0.75rem;
	}
	.nav-item.active {
		color: var(--color-accent);
	}
	.icon {
		font-size: 1.25rem;
	}
</style>
