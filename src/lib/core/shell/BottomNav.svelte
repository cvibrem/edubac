<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { TABS, type TabName } from '$lib/config/tabs';
	import { tabHistory } from '$lib/core/navigation/state.svelte';
	import { tabRootOf } from '$lib/core/navigation/helpers';
	import { asResolved, type ResolvedPath } from '$lib/core/navigation/paths';

	// Presentation lives here in the UI — the router config only knows name/href.
	const LABEL: Record<TabName, string> = {
		home: 'Home',
		search: 'Search',
		notifications: 'Alerts',
		profile: 'Profile'
	};
	const ICON: Record<TabName, string> = {
		home: '🏠',
		search: '🔍',
		notifications: '🔔',
		profile: '👤'
	};

	const tabs: { name: TabName; href: ResolvedPath; label: string; icon: string }[] = TABS.map(
		(t) => ({
			name: t.name,
			href: asResolved(t.href),
			label: LABEL[t.name],
			icon: ICON[t.name]
		})
	);

	// Local throttle: blocks double-taps issued before SvelteKit's
	// onNavigate/afterNavigate round-trip updates `inFlight`.
	let tapping = $state(false);

	function selectTab(e: MouseEvent, tab: (typeof tabs)[number]) {
		if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
		e.preventDefault();
		if (tapping || tabHistory.inFlight) return;

		const currentPath = page.url.pathname;
		const currentRoot = tabRootOf(currentPath);

		// Same tab: no-op at root, otherwise pop back to root (Pattern B).
		if (currentRoot === tab.name) {
			if (currentPath === tab.href) return;
			const steps = tabHistory.stepsToRoot();
			if (steps > 0) {
				tapping = true;
				tabHistory.inFlight = true;
				window.history.go(-steps);
				setTimeout(() => (tapping = false), 400);
			} else {
				// eslint-disable-next-line svelte/no-navigation-without-resolve
				goto(tab.href);
			}
			return;
		}

		// Different tab: pop to its root href if visited, else push.
		const steps = tabHistory.stepsToHref(tab.href);
		if (steps > 0) {
			tapping = true;
			tabHistory.inFlight = true;
			window.history.go(-steps);
			setTimeout(() => (tapping = false), 400);
		} else {
			// eslint-disable-next-line svelte/no-navigation-without-resolve
			goto(tab.href);
		}
	}
</script>

<nav class="bottom-nav">
	<!-- eslint-disable svelte/no-navigation-without-resolve -- hrefs are pre-resolved via asResolved() -->
	{#each tabs as tab (tab.name)}
		<a
			href={tab.href}
			onclick={(e) => selectTab(e, tab)}
			class="nav-item"
			class:active={page.url.pathname.startsWith(tab.href)}
		>
			<span class="icon">{tab.icon}</span>
			<span class="label">{tab.label}</span>
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
