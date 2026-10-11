<script lang="ts">
	import { onMount } from 'svelte';
	import { afterPress } from '$lib/core/shell/press';
	import { initRipple } from '$lib/core/shell/ripple';
	import { goBack } from '$lib/core/navigation/back';
	import { asResolved } from '$lib/core/navigation/paths';
	import { t } from '$lib/i18n/index.svelte';
	import '$lib/auth/auth.css';

	onMount(() => initRipple());
</script>

<main class="auth-page">
	<div class="auth-wrap">
		<div class="auth-topbar">
			<button
				type="button"
				class="auth-back ripple"
				aria-label={t('login.back')}
				onclick={() => void afterPress(() => goBack(asResolved('/welcome')))}
			>
				<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
				</svg>
			</button>
		</div>

		<header class="auth-head">
			<h1>{t('privacy.title')}</h1>
		</header>

		<p class="auth-sub">{t('privacy.p1')}</p>
		<p class="auth-sub">{t('privacy.p2')}</p>
		<p class="auth-sub">{t('privacy.p3')}</p>
	</div>
</main>
