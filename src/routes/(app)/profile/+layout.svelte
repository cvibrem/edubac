<script lang="ts">
	import StackTransition from '$lib/core/shell/StackTransition.svelte';
	let { children } = $props();
</script>

<StackTransition>
	{@render children()}
</StackTransition>
