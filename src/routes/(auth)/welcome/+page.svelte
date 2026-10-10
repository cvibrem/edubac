<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { afterPress } from '$lib/core/shell/press';
	import { initRipple } from '$lib/core/shell/ripple';
	import { SUPPORTED_LOCALES, type LocaleCode } from '$lib/config/i18n';
	import { getLocale, setLocale, t } from '$lib/i18n/index.svelte';
	import { getTheme, setTheme } from '$lib/theme/mode.svelte';
	import { completeGuest, getDraft, getProfile, saveDraft, type Grade } from '$lib/profile/store';
	import '$lib/auth/auth.css';

	let name = $state('');
	// NS4 is the default grade: the only gate left is the (mandatory) name.
	let grade = $state<Grade>('ns4');
	let nameError = $state(false);
	let langOpen = $state(false);
	let nameInput: HTMLInputElement | undefined = $state();

	onMount(() => {
		initRipple();
		// One-time setup: completed profiles never see this screen.
		if (getProfile()) {
			void goto(resolve('/home'), { replaceState: true });
			return;
		}
		const draft = getDraft();
		name = draft.name;
		grade = draft.grade ?? 'ns4';
	});

	const currentFlag = $derived(
		SUPPORTED_LOCALES.find((l) => l.code === getLocale())?.flag ?? '/lg-fr.svg'
	);

	function closeLang() {
		langOpen = false;
	}

	function onWindowKey(e: KeyboardEvent) {
		if (e.key === 'Escape') closeLang();
	}

	function pickLocale(code: LocaleCode) {
		setLocale(code);
		closeLang();
	}

	// CTAs are always enabled: tapping with an empty name shows where to
	// type instead of swallowing the press (the old disabled state).
	function needName(): boolean {
		if (name.trim().length > 0) {
			nameError = false;
			return false;
		}
		nameError = true;
		nameInput?.focus();
		return true;
	}

	function goGuest() {
		if (needName()) return;
		const answers = { name, grade };
		void afterPress(() => {
			completeGuest(answers);
			void goto(resolve('/home'), { replaceState: true });
		});
	}

	function goAccount() {
		if (needName()) return;
		const answers = { name, grade };
		void afterPress(() => {
			// Keep the answers: login completes the same profile as account.
			saveDraft(answers);
			void goto(resolve('/login'));
		});
	}
</script>

<svelte:window onkeydown={onWindowKey} />

<main class="auth-page">
	<div class="auth-wrap">
		<div class="auth-topbar">
			<span class="topbar-spacer"></span>
			<div class="lang-wrap">
				<button
					type="button"
					class="pill ripple"
					data-testid="pill-lang"
					aria-haspopup="menu"
					aria-expanded={langOpen}
					aria-label={t('welcome.langLabel')}
					onclick={() => (langOpen = !langOpen)}
				>
					<img class="flag" src={currentFlag} alt="" />
					<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
						<path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6-1.41-1.41z" />
					</svg>
				</button>
				{#if langOpen}
					<button
						type="button"
						class="menu-scrim"
						aria-label={t('overlay.dismiss')}
						onclick={closeLang}
					></button>
					<div class="lang-menu" role="menu" data-testid="lang-menu">
						{#each SUPPORTED_LOCALES as l (l.code)}
							<button
								type="button"
								role="menuitemradio"
								aria-checked={getLocale() === l.code}
								class="lang-option ripple"
								data-testid="lang-option-{l.code}"
								onclick={() => pickLocale(l.code)}
							>
								<img class="flag" src={l.flag} alt="" />
								<span>{l.label}</span>
								<svg class="check" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
									<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
								</svg>
							</button>
						{/each}
					</div>
				{/if}
			</div>
			<div class="pill theme-pill" role="group" aria-label={t('welcome.themeLabel')}>
				<button
					type="button"
					class="ripple"
					data-testid="theme-system"
					aria-pressed={getTheme() === 'system'}
					aria-label={t('welcome.themeSystem')}
					onclick={() => setTheme('system')}
				>
					<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
						<path
							d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"
						/>
					</svg>
				</button>
				<button
					type="button"
					class="ripple"
					data-testid="theme-light"
					aria-pressed={getTheme() === 'light'}
					aria-label={t('welcome.themeLight')}
					onclick={() => setTheme('light')}
				>
					<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
						<path
							d="M12,9c1.65,0,3,1.35,3,3s-1.35,3-3,3s-3-1.35-3-3S10.35,9,12,9 M12,7c-2.76,0-5,2.24-5,5s2.24,5,5,5s5-2.24,5-5 S14.76,7,12,7L12,7z M2,13l2,0c0.55,0,1-0.45,1-1s-0.45-1-1-1l-2,0c-0.55,0-1,0.45-1,1S1.45,13,2,13z M20,13l2,0c0.55,0,1-0.45,1-1 s-0.45-1-1-1l-2,0c-0.55,0-1,0.45-1,1S19.45,13,20,13z M11,2v2c0,0.55,0.45,1,1,1s1-0.45,1-1V2c0-0.55-0.45-1-1-1S11,1.45,11,2z M11,20v2c0,0.55,0.45,1,1,1s1-0.45,1-1v-2c0-0.55-0.45-1-1-1C11.45,19,11,19.45,11,20z M5.99,4.58c-0.39-0.39-1.03-0.39-1.41,0 c-0.39,0.39-0.39,1.03,0,1.41l1.06,1.06c0.39,0.39,1.03,0.39,1.41,0s0.39-1.03,0-1.41L5.99,4.58z M18.36,16.95 c-0.39-0.39-1.03-0.39-1.41,0c-0.39,0.39-0.39,1.03,0,1.41l1.06,1.06c0.39,0.39,1.03,0.39,1.41,0c0.39-0.39,0.39-1.03,0-1.41 L18.36,16.95z M19.42,5.99c0.39-0.39,0.39-1.03,0-1.41c-0.39-0.39-1.03-0.39-1.41,0l-1.06,1.06c-0.39,0.39-0.39,1.03,0,1.41 s1.03,0.39,1.41,0L19.42,5.99z M7.05,18.36c0.39-0.39,0.39-1.03,0-1.41c-0.39-0.39-1.03-0.39-1.41,0l-1.06,1.06 c-0.39,0.39-0.39,1.03,0,1.41s1.03,0.39,1.41,0L7.05,18.36z"
						/>
					</svg>
				</button>
				<button
					type="button"
					class="ripple"
					data-testid="theme-dark"
					aria-pressed={getTheme() === 'dark'}
					aria-label={t('welcome.themeDark')}
					onclick={() => setTheme('dark')}
				>
					<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
						<path
							d="M9.37,5.51C9.19,6.15,9.1,6.82,9.1,7.5c0,4.08,3.32,7.4,7.4,7.4c0.68,0,1.35-0.09,1.99-0.27C17.45,17.19,14.93,19,12,19 c-3.86,0-7-3.14-7-7C5,9.07,6.81,6.55,9.37,5.51z M12,3c-4.97,0-9,4.03-9,9s4.03,9,9,9s9-4.03,9-9c0-0.46-0.04-0.92-0.1-1.36 c-0.98,1.37-2.58,2.26-4.4,2.26c-2.98,0-5.4-2.42-5.4-5.4c0-1.81,0.89-3.42,2.26-4.4C12.92,3.04,12.46,3,12,3L12,3z"
						/>
					</svg>
				</button>
			</div>
		</div>

		<header class="auth-head">
			<h1>{t('welcome.title')}</h1>
			<p class="auth-sub">{t('welcome.subtitle')}</p>
		</header>

		<div class="field">
			<label for="welcome-name">{t('welcome.nameLabel')}</label>
			<div class="input">
				<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path
						d="M12 6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2m0 10c2.7 0 5.8 1.29 6 2H6c.23-.72 3.31-2 6-2m0-12C9.79 4 8 5.79 8 8s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 10c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
					/>
				</svg>
				<input
					id="welcome-name"
					data-testid="welcome-name"
					type="text"
					autocomplete="given-name"
					maxlength={40}
					placeholder={t('welcome.namePlaceholder')}
					aria-invalid={nameError}
					aria-describedby={nameError ? 'welcome-name-error' : undefined}
					bind:this={nameInput}
					bind:value={name}
					oninput={() => (nameError = false)}
				/>
			</div>
			{#if nameError}
				<p class="field-error" id="welcome-name-error" role="alert">
					{t('welcome.nameRequired')}
				</p>
			{/if}
		</div>

		<div class="field">
			<label for="grade-select">{t('welcome.gradeLabel')}</label>
			<div class="input select-wrap">
				<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path
						d="M12 3 1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"
					/>
				</svg>
				<select id="grade-select" data-testid="grade-select" bind:value={grade}>
					<option value="ns4">{t('welcome.gradeNs')}</option>
					<option value="9eme">{t('welcome.grade9')}</option>
				</select>
				<svg class="chev" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6-1.41-1.41z" />
				</svg>
			</div>
		</div>

		<div class="auth-ctas">
			<button
				type="button"
				class="btn btn-primary btn-block auth-cta ripple"
				data-testid="welcome-account"
				onclick={goAccount}
			>
				{t('welcome.account')}
			</button>
			<button
				type="button"
				class="btn btn-outline btn-block ripple"
				data-testid="welcome-guest"
				onclick={goGuest}
			>
				{t('welcome.guest')}
			</button>
			<p class="guest-warning" role="note">
				<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
				</svg>
				<span>{t('welcome.guestWarning')}</span>
			</p>
		</div>

		<p class="terms">{t('auth.terms')}</p>
	</div>
</main>
