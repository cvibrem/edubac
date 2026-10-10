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

	onMount(() => initRipple());

	const emailOk = $derived(EMAIL_RE.test(email.trim()));
	const showEmailHint = $derived(email.length > 0 && !emailOk);
	const canConnect = $derived(emailOk && password.length > 0);

	// Back returns to welcome mid-flow, home when revisiting as a member.
	function back() {
		void afterPress(() => goBack(asResolved(hasProfile() ? '/home' : '/welcome')));
	}

	function connect() {
		if (!canConnect) return;
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
				<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<path
						d="M15 5l-7 7 7 7"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
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
				<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<rect
						x="3"
						y="5"
						width="18"
						height="14"
						rx="2"
						stroke="currentColor"
						stroke-width="1.8"
					/>
					<path
						d="M3.5 7l8.5 6 8.5-6"
						stroke="currentColor"
						stroke-width="1.8"
						stroke-linecap="round"
						stroke-linejoin="round"
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
					aria-invalid={showEmailHint}
					aria-describedby={showEmailHint ? 'login-email-hint' : undefined}
					bind:value={email}
				/>
			</div>
			{#if showEmailHint}
				<p class="field-error" id="login-email-hint" role="alert">{t('login.badEmail')}</p>
			{/if}
		</div>

		<div class="field">
			<label for="login-password">{t('login.password')}</label>
			<div class="input">
				<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<rect
						x="5"
						y="10"
						width="14"
						height="10"
						rx="2"
						stroke="currentColor"
						stroke-width="1.8"
					/>
					<path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="1.8" />
				</svg>
				<input
					id="login-password"
					data-testid="login-password"
					type={showPw ? 'text' : 'password'}
					autocomplete="current-password"
					maxlength={120}
					placeholder="••••••••"
					bind:value={password}
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
						<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
							<path
								d="M3 3l18 18"
								stroke="currentColor"
								stroke-width="1.8"
								stroke-linecap="round"
							/>
							<path
								d="M10.6 5.2A9.8 9.8 0 0 1 12 5c5 0 9 4.5 10 7-.3.8-1.1 2-2.4 3.3M6.6 6.6C4 8.2 2.5 10.7 2 12c1 2.5 5 7 10 7 1.5 0 2.9-.4 4.1-1"
								stroke="currentColor"
								stroke-width="1.8"
								stroke-linecap="round"
							/>
						</svg>
					{:else}
						<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
							<path
								d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
								stroke="currentColor"
								stroke-width="1.8"
								stroke-linejoin="round"
							/>
							<circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8" />
						</svg>
					{/if}
				</button>
			</div>
		</div>

		<div class="auth-ctas">
			<button
				type="button"
				class="btn btn-primary btn-block auth-cta ripple"
				data-testid="login-submit"
				disabled={!canConnect}
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
