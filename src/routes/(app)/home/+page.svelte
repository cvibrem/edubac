<script lang="ts">
	import { resolve } from '$app/paths';
	import { t } from '$lib/i18n/index.svelte';
</script>

<div class="demo-page" style="background:#2563eb;">
	<h1>{t('demo.home.title')}</h1>
	<p>{t('demo.home.text')}</p>
	<a class="ripple ripple-light" href={resolve('/home/innerPage')}>{t('demo.home.openInner')}</a>
	<a class="ripple ripple-light" href={resolve('/login')}>{t('demo.home.goLogin')}</a>
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
