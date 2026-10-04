<script lang="ts">
	import AppShell from '$lib/core/shell/AppShell.svelte';

	let { children } = $props();
</script>

<AppShell>
	{@render children()}
</AppShell>
