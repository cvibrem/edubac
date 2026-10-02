<script lang="ts">
	import StackTransition from '$lib/components/StackTransition.svelte';
	let { children } = $props();
</script>

<StackTransition>
	{@render children()}
</StackTransition>