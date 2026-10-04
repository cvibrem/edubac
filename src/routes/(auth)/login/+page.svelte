<script lang="ts">
	import { goBack } from '$lib/core/navigation/back';
	import { asResolved } from '$lib/core/navigation/paths';
</script>

<div class="demo-page" style="background:#334155;">
	<h1>Login</h1>
	<p>Sibling group (no tab bar) · slate</p>
	<button type="button" onclick={() => goBack(asResolved('/home'))}>← Back</button>
</div>

<style>
	.demo-page {
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		color: #fff;
	}
	.demo-page button {
		padding: 0.5rem 1rem;
		font-size: 1rem;
	}
</style>
