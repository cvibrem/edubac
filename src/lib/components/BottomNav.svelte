<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { tabStack, type TabName } from '$lib/stores/navigation.svelte';
	import { asResolved, type ResolvedPath } from '$lib/utils/resolvePath';

	const tabs: { name: TabName; href: ResolvedPath; label: string; icon: string }[] = [
		{ name: 'home', href: asResolved('/home'), label: 'Home', icon: '🏠' },
		{ name: 'search', href: asResolved('/search'), label: 'Search', icon: '🔍' },
		{ name: 'notifications', href: asResolved('/notifications'), label: 'Alerts', icon: '🔔' },
		{ name: 'profile', href: asResolved('/profile'), label: 'Profile', icon: '👤' }
	];

	function selectTab(e: MouseEvent, tab: (typeof tabs)[number]) {
		if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
		e.preventDefault();

		if (tabStack.stack.at(-1) === tab.name) return; // already here
		
		const steps = tabStack.distanceTo(tab.name);
		
		if (steps > 0) {
			window.history.go(-steps);
		} else {
			// eslint-disable-next-line svelte/no-navigation-without-resolve
			goto(tab.href);
		}
	}
</script>

<nav class="bottom-nav">
	{#each tabs as tab (tab.name)}
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
		<a href={tab.href}
			onclick={(e) => selectTab(e, tab)}
			class="nav-item"
			class:active={page.url.pathname.startsWith(tab.href)}
		>
			<span class="icon">{tab.icon}</span>
			<span class="label">{tab.label}</span>
		</a>
	{/each}
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