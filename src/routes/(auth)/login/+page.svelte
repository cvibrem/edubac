<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { afterPress } from '$lib/core/shell/press';
	import { initRipple } from '$lib/core/shell/ripple';
	import { goBack } from '$lib/core/navigation/back';
	import { asResolved } from '$lib/core/navigation/paths';
	import { overlay } from '$lib/core/overlay/state.svelte';
	import { t } from '$lib/i18n/index.svelte';
	import { completeAccount, completeGuest, getDraft, hasProfile } from '$lib/profile/store';
	import '$lib/auth/auth.css';

	const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	let email = $state('');
	let password = $state('');
	let showPw = $state(false);
	let emailError = $state(false);
	let pwError = $state(false);
	let emailInput: HTMLInputElement | undefined = $state();
	let pwInput: HTMLInputElement | undefined = $state();

	onMount(() => initRipple());

	const emailLiveHint = $derived(email.length > 0 && !EMAIL_RE.test(email.trim()));
	const emailInvalid = $derived(emailError || emailLiveHint);

	// Back returns to welcome mid-flow, home when revisiting as a member.
	function back() {
		void afterPress(() => goBack(asResolved(hasProfile() ? '/home' : '/welcome')));
	}

	// Always enabled: tapping with invalid input shows where to fix
	// instead of swallowing the press.
	function connect() {
		const okEmail = EMAIL_RE.test(email.trim());
		const okPw = password.length > 0;
		emailError = !okEmail;
		pwError = !okPw;
		if (!okEmail) {
			emailInput?.focus();
			return;
		}
		if (!okPw) {
			pwInput?.focus();
			return;
		}
		void afterPress(() => {
			completeAccount(getDraft());
			void goto(resolve('/home'), { replaceState: true });
		});
	}

	function continueAsGuest() {
		void afterPress(() => {
			completeGuest(getDraft());
			void goto(resolve('/home'), { replaceState: true });
		});
	}

	function socialSoon() {
		void afterPress(() =>
			overlay.openToast({ title: t('login.soon'), message: t('login.soonMessage') })
		);
	}
</script>

<main class="auth-page">
	<div class="auth-wrap">
		<div class="auth-topbar">
			<button
				type="button"
				class="auth-back ripple"
				data-testid="login-back"
				aria-label={t('login.back')}
				onclick={back}
			>
				<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
				</svg>
			</button>
		</div>

		<header class="auth-head">
			<h1>{t('login.title')}</h1>
			<p class="auth-sub">{t('login.subtitle')}</p>
		</header>

		<div class="field">
			<label for="login-email">{t('login.email')}</label>
			<div class="input">
				<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path
						d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z"
					/>
				</svg>
				<input
					id="login-email"
					data-testid="login-email"
					type="email"
					autocomplete="email"
					inputmode="email"
					maxlength={120}
					placeholder="marie@exemple.ht"
					aria-invalid={emailInvalid}
					aria-describedby={emailInvalid ? 'login-email-hint' : undefined}
					bind:this={emailInput}
					bind:value={email}
					oninput={() => (emailError = false)}
				/>
			</div>
			{#if emailInvalid}
				<p class="field-error" id="login-email-hint" role="alert">{t('login.badEmail')}</p>
			{/if}
		</div>

		<div class="field">
			<label for="login-password">{t('login.password')}</label>
			<div class="input">
				<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path
						d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"
					/>
				</svg>
				<input
					id="login-password"
					data-testid="login-password"
					type={showPw ? 'text' : 'password'}
					autocomplete="current-password"
					maxlength={120}
					placeholder="••••••••"
					aria-invalid={pwError}
					aria-describedby={pwError ? 'login-password-hint' : undefined}
					bind:this={pwInput}
					bind:value={password}
					oninput={() => (pwError = false)}
				/>
				<button
					type="button"
					class="icon-btn"
					data-testid="login-pw-toggle"
					aria-pressed={showPw}
					aria-label={t(showPw ? 'login.hidePassword' : 'login.showPassword')}
					onclick={() => (showPw = !showPw)}
				>
					{#if showPw}
						<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
							<path
								d="M12 6c3.79 0 7.17 2.13 8.82 5.5-.59 1.22-1.42 2.27-2.41 3.12l1.41 1.41c1.39-1.23 2.49-2.77 3.18-4.53C21.27 7.11 17 4 12 4c-1.27 0-2.49.2-3.64.57l1.65 1.65C10.66 6.09 11.32 6 12 6zm-1.07 1.14L13 9.21c.57.25 1.03.71 1.28 1.28l2.07 2.07c.08-.34.14-.7.14-1.07C16.5 9.01 14.48 7 12 7c-.37 0-.72.05-1.07.14zM2.01 3.87l2.68 2.68C3.06 7.83 1.77 9.53 1 11.5 2.73 15.89 7 19 12 19c1.52 0 2.98-.29 4.32-.82l3.42 3.42 1.41-1.41L3.42 2.45 2.01 3.87zm7.5 7.5l2.61 2.61c-.04.01-.08.02-.12.02-1.38 0-2.5-1.12-2.5-2.5 0-.05.01-.08.01-.13zm-3.4-3.4l1.75 1.75c-.23.55-.36 1.15-.36 1.78 0 2.48 2.02 4.5 4.5 4.5.63 0 1.23-.13 1.77-.36l.98.98c-.88.24-1.8.38-2.75.38-3.79 0-7.17-2.13-8.82-5.5.7-1.43 1.72-2.61 2.93-3.53z"
							/>
						</svg>
					{:else}
						<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
							<path
								d="M12 6c3.79 0 7.17 2.13 8.82 5.5C19.17 14.87 15.79 17 12 17s-7.17-2.13-8.82-5.5C4.83 8.13 8.21 6 12 6m0-2C7 4 2.73 7.11 1 11.5 2.73 15.89 7 19 12 19s9.27-3.11 11-7.5C21.27 7.11 17 4 12 4zm0 5c1.38 0 2.5 1.12 2.5 2.5S13.38 14 12 14s-2.5-1.12-2.5-2.5S10.62 9 12 9m0-2c-2.48 0-4.5 2.02-4.5 4.5S9.52 16 12 16s4.5-2.02 4.5-4.5S14.48 7 12 7z"
							/>
						</svg>
					{/if}
				</button>
			</div>
			{#if pwError}
				<p class="field-error" id="login-password-hint" role="alert">
					{t('login.passwordRequired')}
				</p>
			{/if}
		</div>

		<div class="auth-ctas">
			<button
				type="button"
				class="btn btn-primary btn-block auth-cta ripple"
				data-testid="login-submit"
				onclick={connect}
			>
				{t('login.submit')}
			</button>
		</div>

		<div class="or-row" role="separator"><span>{t('login.or')}</span></div>
		<p class="social-label">{t('login.socialLabel')}</p>
		<div class="social-row">
			<button
				type="button"
				class="social-btn social-g ripple"
				data-testid="social-google"
				aria-label={t('login.google')}
				onclick={socialSoon}
			>
				<span aria-hidden="true">G</span>
			</button>
			<button
				type="button"
				class="social-btn social-f ripple"
				data-testid="social-facebook"
				aria-label={t('login.facebook')}
				onclick={socialSoon}
			>
				<span aria-hidden="true">f</span>
			</button>
			<button
				type="button"
				class="social-btn ripple"
				data-testid="social-tiktok"
				aria-label={t('login.tiktok')}
				onclick={socialSoon}
			>
				<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path
						d="M16.6 3c.4 2.3 1.9 3.8 4.4 4v3.1c-1.6 0-3-.5-4.4-1.4v6.5c0 3.9-2.7 6.3-6.1 6.3-3.3 0-5.9-2.5-5.9-5.9 0-3.5 2.7-6 6.3-5.7v3.2c-1.7-.4-3.1.8-3.1 2.5 0 1.5 1.2 2.7 2.7 2.7 1.7 0 2.9-1.2 2.9-3.1V3h3.2Z"
					/>
				</svg>
			</button>
		</div>

		<button
			type="button"
			class="guest-link ripple"
			data-testid="login-guest"
			onclick={continueAsGuest}
		>
			{t('welcome.guest')}
		</button>

		<p class="terms">{t('auth.terms')}</p>
	</div>
</main>
