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
	// framework7-icons glyph names (font ligatures).
	const ICON: Record<TabName, string> = {
		home: 'house_fill',
		search: 'search',
		notifications: 'bell_fill',
		profile: 'person_fill'
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

<!-- F7 Toolbar/Tabbar markup (CSS only — no F7 router/Views involved). -->
<!-- eslint-disable svelte/no-navigation-without-resolve -- hrefs are pre-resolved via asResolved() -->
<div class="toolbar tabbar toolbar-bottom">
	<div class="toolbar-inner">
		{#each tabs as tab (tab.name)}
			<a
				href={tab.href}
				onclick={(e) => selectTab(e, tab)}
				class="tab-link"
				class:tab-link-active={page.url.pathname.startsWith(tab.href)}
			>
				<i class="icon f7-icons">{tab.icon}</i>
				<span class="tabbar-label">{tab.label}</span>
			</a>
		{/each}
	</div>
</div>
<!-- eslint-enable svelte/no-navigation-without-resolve -->
