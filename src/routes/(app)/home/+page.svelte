<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<div class="demo-page" style="background:#2563eb;">
	<h1>Home</h1>
	<p>Tab root · blue</p>
	<a href={resolve('/home/innerPage')}>Open inner page →</a>
	<a href={resolve('/login')}>Go to Login (sibling group) →</a>
</div>

<style>
	.demo-page {
		min-height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		color: #fff;
	}
	.demo-page a {
		color: #fff;
	}
</style>
