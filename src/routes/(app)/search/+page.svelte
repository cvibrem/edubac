<script lang="ts">
	import { t } from '$lib/i18n/index.svelte';
</script>

<div class="demo-page" style="background:#16a34a;">
	<h1>{t('demo.search.title')}</h1>
	<p>{t('demo.search.text')}</p>
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
</style>
