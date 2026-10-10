<script lang="ts">
	import { goBack } from '$lib/core/navigation/back';
	import { asResolved } from '$lib/core/navigation/paths';
	import { afterPress } from '$lib/core/shell/press';
	import { t } from '$lib/i18n/index.svelte';
</script>

<div class="demo-page" style="background:#334155;">
	<h1>{t('demo.login.title')}</h1>
	<p>{t('demo.login.text')}</p>
	<button
		type="button"
		class="ripple ripple-light"
		onclick={() => void afterPress(() => goBack(asResolved('/home')))}>←</button
	>
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
