<script lang="ts">
	import { SUPPORTED_LOCALES } from '$lib/config/i18n';
	import { getLocale, setLocale, t } from '$lib/i18n/index.svelte';
</script>

<div class="settings">
	<h1>{t('settings.title')}</h1>
	<section class="card">
		<h2>{t('settings.language')}</h2>
		{#each SUPPORTED_LOCALES as l (l.code)}
			<label class="lang-row ripple">
				<input
					type="radio"
					name="app-language"
					checked={getLocale() === l.code}
					onchange={() => setLocale(l.code)}
				/>
				<span class="lang-label">{l.label}</span>
				{#if getLocale() === l.code}
					<span class="lang-check" aria-hidden="true">✓</span>
				{/if}
			</label>
		{/each}
		<p class="hint">{t('settings.languageHint')}</p>
	</section>
</div>

<style>
	.settings {
		display: flex;
		flex-direction: column;
		gap: var(--sp-4);
		padding: var(--pad-page);
	}
	.settings h1 {
		margin: 0;
	}
	.card h2 {
		margin-bottom: var(--sp-2);
	}
	.lang-row {
		display: flex;
		align-items: center;
		gap: var(--sp-3);
		padding: var(--sp-3) var(--sp-2);
		border-top: 1px solid var(--line);
		cursor: pointer;
	}
	.lang-row input {
		width: 1.1rem;
		height: 1.1rem;
		accent-color: var(--primary);
	}
	.lang-label {
		flex: 1;
		font-weight: var(--fw-medium);
	}
	.lang-check {
		color: var(--primary);
		font-weight: var(--fw-bold);
	}
	.hint {
		margin: var(--sp-2) 0 0;
		color: var(--ink-2);
		font-size: var(--fs-small);
	}
</style>
