<script lang="ts">
	import { t } from '$lib/i18n/index.svelte';
</script>

<div class="demo-page" style="background:#f59e0b;">
	<h1>{t('demo.notifications.title')}</h1>
	<p>{t('demo.notifications.text')}</p>
</div>

<style>
	.demo-page {
		min-height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		color: #1c1917;
	}
</style>
