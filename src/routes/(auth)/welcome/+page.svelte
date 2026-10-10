<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { afterPress } from '$lib/core/shell/press';
	import { initRipple } from '$lib/core/shell/ripple';
	import { SUPPORTED_LOCALES } from '$lib/config/i18n';
	import { getLocale, setLocale, t } from '$lib/i18n/index.svelte';
	import { getTheme, setTheme } from '$lib/theme/mode.svelte';
	import { completeGuest, getDraft, getProfile, saveDraft, type Grade } from '$lib/profile/store';
	import '$lib/auth/auth.css';

	const THEMES = [
		{ value: 'system', labelKey: 'welcome.themeSystem' },
		{ value: 'light', labelKey: 'welcome.themeLight' },
		{ value: 'dark', labelKey: 'welcome.themeDark' }
	] as const;

	let name = $state('');
	let grade = $state<Grade | null>(null);

	onMount(() => {
		initRipple();
		// One-time setup: completed profiles never see this screen.
		if (getProfile()) {
			void goto(resolve('/home'), { replaceState: true });
			return;
		}
		const draft = getDraft();
		name = draft.name;
		grade = draft.grade;
	});

	const valid = $derived(name.trim().length > 0 && grade !== null);

	function goGuest() {
		if (!valid) return;
		const answers = { name, grade };
		void afterPress(() => {
			completeGuest(answers);
			void goto(resolve('/home'), { replaceState: true });
		});
	}

	function goAccount() {
		if (!valid) return;
		const answers = { name, grade };
		void afterPress(() => {
			// Keep the answers: login completes the same profile as account.
			saveDraft(answers);
			void goto(resolve('/login'));
		});
	}
</script>

<main class="auth-page">
	<div class="auth-wrap">
		<header class="auth-head">
			<h1>{t('welcome.title')}</h1>
			<p class="auth-sub">{t('welcome.subtitle')}</p>
		</header>

		<div class="field">
			<label for="welcome-name">{t('welcome.nameLabel')}</label>
			<div class="input">
				<input
					id="welcome-name"
					data-testid="welcome-name"
					type="text"
					autocomplete="given-name"
					maxlength={40}
					placeholder={t('welcome.namePlaceholder')}
					bind:value={name}
				/>
			</div>
		</div>

		<fieldset class="field">
			<legend>{t('welcome.gradeLabel')}</legend>
			<div class="seg">
				<label>
					<input
						type="radio"
						name="grade"
						data-testid="grade-9eme"
						checked={grade === '9eme'}
						onchange={() => (grade = '9eme')}
					/>
					{t('welcome.grade9')}
				</label>
				<label>
					<input
						type="radio"
						name="grade"
						data-testid="grade-ns4"
						checked={grade === 'ns4'}
						onchange={() => (grade = 'ns4')}
					/>
					{t('welcome.gradeNs')}
				</label>
			</div>
		</fieldset>

		<fieldset class="field">
			<legend>{t('welcome.langLabel')}</legend>
			<div class="seg">
				{#each SUPPORTED_LOCALES as l (l.code)}
					<label>
						<input
							type="radio"
							name="welcome-language"
							data-testid="lang-{l.code}"
							checked={getLocale() === l.code}
							onchange={() => setLocale(l.code)}
						/>
						{l.label}
					</label>
				{/each}
			</div>
		</fieldset>

		<fieldset class="field">
			<legend>{t('welcome.themeLabel')}</legend>
			<div class="seg">
				{#each THEMES as th (th.value)}
					<label>
						<input
							type="radio"
							name="welcome-theme"
							data-testid="theme-{th.value}"
							checked={getTheme() === th.value}
							onchange={() => setTheme(th.value)}
						/>
						{t(th.labelKey)}
					</label>
				{/each}
			</div>
		</fieldset>

		<div class="auth-ctas">
			<button
				type="button"
				class="btn btn-primary btn-block auth-cta ripple"
				data-testid="welcome-account"
				disabled={!valid}
				onclick={goAccount}
			>
				{t('welcome.account')}
			</button>
			<button
				type="button"
				class="btn btn-outline btn-block ripple"
				data-testid="welcome-guest"
				disabled={!valid}
				onclick={goGuest}
			>
				{t('welcome.guest')}
			</button>
			<p class="guest-warning" role="note">
				<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
					<path
						d="M8 1.5 15 13.5H1L8 1.5Z"
						stroke="currentColor"
						stroke-width="1.5"
						stroke-linejoin="round"
					/>
					<path d="M8 6v3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
					<circle cx="8" cy="11.5" r="0.9" fill="currentColor" />
				</svg>
				<span>{t('welcome.guestWarning')}</span>
			</p>
		</div>

		<p class="terms">{t('auth.terms')}</p>
	</div>
</main>
