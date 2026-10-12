<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { afterPress, pressFeedback, releasePress, tryClaimPress } from '$lib/core/shell/press';
	import { motionMs } from '$lib/core/shell/reducedMotion';
	import { initRipple } from '$lib/core/shell/ripple';
	import { goBack } from '$lib/core/navigation/back';
	import { asResolved } from '$lib/core/navigation/paths';
	import { overlay } from '$lib/core/overlay/state.svelte';
	import { t } from '$lib/i18n/index.svelte';
	import { dayPartKey } from '$lib/auth/greeting';
	import { completeAccount, getDraft, hasProfile } from '$lib/profile/store';
	import TermsFooter from '$lib/auth/TermsFooter.svelte';
	import '$lib/auth/auth.css';

	const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	let email = $state('');
	let password = $state('');
	let showPw = $state(false);
	let emailError = $state(false);
	let pwError = $state(false);
	let emailInput: HTMLInputElement | undefined = $state();
	let pwInput: HTMLInputElement | undefined = $state();
	// Exit slide to home (connect): press wave, slide left, replace.
	// LEAVE_MS must match `.auth-page.leaving` in auth.css.
	const LEAVE_MS = 240;
	let leaving = $state(false);

	// Known from the welcome draft: greet by name when we have it.
	const draftName = getDraft().name.trim();

	onMount(() => initRipple());

	const emailLiveHint = $derived(email.length > 0 && !EMAIL_RE.test(email.trim()));
	const emailInvalid = $derived(emailError || emailLiveHint);

	// Back returns to welcome mid-flow, home when revisiting as a member.
	function back() {
		void afterPress(() => goBack(asResolved(hasProfile() ? '/home' : '/welcome')));
	}

	// Always enabled: tapping with invalid input shows where to fix
	// instead of swallowing the press. Success slides the page left
	// (same gesture as the guest exit) before home replaces it.
	async function connect() {
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
		if (leaving) return;
		if (!tryClaimPress()) return;
		try {
			await pressFeedback();
			leaving = true;
			await new Promise<void>((r) => setTimeout(r, motionMs(LEAVE_MS)));
			completeAccount(getDraft());
			await goto(resolve('/home'), { replaceState: true });
		} finally {
			releasePress();
		}
	}

	function socialSoon() {
		void afterPress(() =>
			overlay.openToast({ title: t('login.soon'), message: t('login.soonMessage') })
		);
	}
</script>

<main class="auth-page" class:leaving>
	<div class="auth-wrap balance">
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

		<div class="auth-core">
			<header class="auth-head">
				<h1>
					<span class="hi-day">{t(dayPartKey())}</span>
					{#if draftName}
						<span class="hi-who">{draftName} !</span>
					{:else}
						<span class="hi-who unknown">{t('welcome.stranger')}</span>
					{/if}
				</h1>
				<p class="auth-sub">{t('login.subtitle')}</p>
			</header>

			<div class="field">
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
						aria-label={t('login.email')}
						placeholder={t('login.emailPlaceholder')}
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
						aria-label={t('login.password')}
						placeholder={t('login.passwordPlaceholder')}
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
					class="social-btn ripple"
					data-testid="social-google"
					aria-label={t('login.google')}
					onclick={socialSoon}
				>
					<svg viewBox="0 0 16 16" aria-hidden="true">
						<path
							fill="#4285F4"
							d="M14.9 8.161c0-.476-.039-.954-.121-1.422h-6.64v2.695h3.802a3.24 3.24 0 01-1.407 2.127v1.75h2.269c1.332-1.22 2.097-3.02 2.097-5.15z"
						/>
						<path
							fill="#34A853"
							d="M8.14 15c1.898 0 3.499-.62 4.665-1.69l-2.268-1.749c-.631.427-1.446.669-2.395.669-1.836 0-3.393-1.232-3.952-2.888H1.85v1.803A7.044 7.044 0 008.14 15z"
						/>
						<path
							fill="#FBBC04"
							d="M4.187 9.342a4.17 4.17 0 010-2.68V4.859H1.849a6.97 6.97 0 000 6.286l2.338-1.803z"
						/>
						<path
							fill="#EA4335"
							d="M8.14 3.77a3.837 3.837 0 012.7 1.05l2.01-1.999a6.786 6.786 0 00-4.71-1.82 7.042 7.042 0 00-6.29 3.858L4.186 6.66c.556-1.658 2.116-2.89 3.952-2.89z"
						/>
					</svg>
				</button>
				<button
					type="button"
					class="social-btn ripple"
					data-testid="social-facebook"
					aria-label={t('login.facebook')}
					onclick={socialSoon}
				>
					<svg viewBox="0 0 16 16" aria-hidden="true">
						<path
							fill="#1877F2"
							d="M15 8a7 7 0 00-7-7 7 7 0 00-1.094 13.915v-4.892H5.13V8h1.777V6.458c0-1.754 1.045-2.724 2.644-2.724.766 0 1.567.137 1.567.137v1.723h-.883c-.87 0-1.14.54-1.14 1.093V8h1.941l-.31 2.023H9.094v4.892A7.001 7.001 0 0015 8z"
						/>
						<path
							fill="#ffffff"
							d="M10.725 10.023L11.035 8H9.094V6.687c0-.553.27-1.093 1.14-1.093h.883V3.87s-.801-.137-1.567-.137c-1.6 0-2.644.97-2.644 2.724V8H5.13v2.023h1.777v4.892a7.037 7.037 0 002.188 0v-4.892h1.63z"
						/>
					</svg>
				</button>
				<button
					type="button"
					class="social-btn ripple"
					data-testid="social-tiktok"
					aria-label={t('login.tiktok')}
					onclick={socialSoon}
				>
					<svg viewBox="0 0 32 32" aria-hidden="true">
						<path
							fill="#EE1D52"
							d="M8.45095 19.7926C8.60723 18.4987 9.1379 17.7743 10.1379 17.0317C11.5688 16.0259 13.3561 16.5948 13.3561 16.5948V13.2197C13.7907 13.2085 14.2254 13.2343 14.6551 13.2966V17.6401C14.6551 17.6401 12.8683 17.0712 11.4375 18.0775C10.438 18.8196 9.90623 19.5446 9.7505 20.8385C9.74562 21.5411 9.87747 22.4595 10.4847 23.2536C10.3345 23.1766 10.1815 23.0889 10.0256 22.9905C8.68807 22.0923 8.44444 20.7449 8.45095 19.7926ZM22.0352 6.97898C21.0509 5.90039 20.6786 4.81139 20.5441 4.04639H21.7823C21.7823 4.04639 21.5354 6.05224 23.3347 8.02482L23.3597 8.05134C22.8747 7.7463 22.43 7.38624 22.0352 6.97898ZM28 10.0369V14.293C28 14.293 26.42 14.2312 25.2507 13.9337C23.6179 13.5176 22.5685 12.8795 22.5685 12.8795C22.5685 12.8795 21.8436 12.4245 21.785 12.3928V21.1817C21.785 21.6711 21.651 22.8932 21.2424 23.9125C20.709 25.246 19.8859 26.1212 19.7345 26.3001C19.7345 26.3001 18.7334 27.4832 16.9672 28.28C15.3752 28.9987 13.9774 28.9805 13.5596 28.9987C13.5596 28.9987 11.1434 29.0944 8.96915 27.6814C8.49898 27.3699 8.06011 27.0172 7.6582 26.6277L7.66906 26.6355C9.84383 28.0485 12.2595 27.9528 12.2595 27.9528C12.6779 27.9346 14.0756 27.9528 15.6671 27.2341C17.4317 26.4374 18.4344 25.2543 18.4344 25.2543C18.5842 25.0754 19.4111 24.2001 19.9423 22.8662C20.3498 21.8474 20.4849 20.6247 20.4849 20.1354V11.3475C20.5435 11.3797 21.2679 11.8347 21.2679 11.8347C21.2679 11.8347 22.3179 12.4734 23.9506 12.8889C25.1204 13.1864 26.7 13.2483 26.7 13.2483V9.91314C27.2404 10.0343 27.7011 10.0671 28 10.0369Z"
						/>
						<path
							fill="#000000"
							d="M26.7009 9.91314V13.2472C26.7009 13.2472 25.1213 13.1853 23.9515 12.8879C22.3188 12.4718 21.2688 11.8337 21.2688 11.8337C21.2688 11.8337 20.5444 11.3787 20.4858 11.3464V20.1364C20.4858 20.6258 20.3518 21.8484 19.9432 22.8672C19.4098 24.2012 18.5867 25.0764 18.4353 25.2553C18.4353 25.2553 17.4337 26.4384 15.668 27.2352C14.0765 27.9539 12.6788 27.9357 12.2604 27.9539C12.2604 27.9539 9.84473 28.0496 7.66995 26.6366L7.6591 26.6288C7.42949 26.4064 7.21336 26.1717 7.01177 25.9257C6.31777 25.0795 5.89237 24.0789 5.78547 23.7934C5.78529 23.7922 5.78529 23.791 5.78547 23.7898C5.61347 23.2937 5.25209 22.1022 5.30147 20.9482C5.38883 18.9122 6.10507 17.6625 6.29444 17.3494C6.79597 16.4957 7.44828 15.7318 8.22233 15.0919C8.90538 14.5396 9.6796 14.1002 10.5132 13.7917C11.4144 13.4295 12.3794 13.2353 13.3565 13.2197V16.5948C13.3565 16.5948 11.5691 16.028 10.1388 17.0317C9.13879 17.7743 8.60812 18.4987 8.45185 19.7926C8.44534 20.7449 8.68897 22.0923 10.0254 22.991C10.1813 23.0898 10.3343 23.1775 10.4845 23.2541C10.7179 23.5576 11.0021 23.8221 11.3255 24.0368C12.631 24.8632 13.7249 24.9209 15.1238 24.3842C16.0565 24.0254 16.7586 23.2167 17.0842 22.3206C17.2888 21.7611 17.2861 21.1978 17.2861 20.6154V4.04639H20.5417C20.6763 4.81139 21.0485 5.90039 22.0328 6.97898C22.4276 7.38624 22.8724 7.7463 23.3573 8.05134C23.5006 8.19955 24.2331 8.93231 25.1734 9.38216C25.6596 9.61469 26.1722 9.79285 26.7009 9.91314Z"
						/>
						<path
							fill="#69C9D0"
							d="M4.48926 22.7568V22.7594L4.57004 22.9784C4.56076 22.9529 4.53074 22.8754 4.48926 22.7568Z"
						/>
						<path
							fill="#69C9D0"
							d="M10.5128 13.7916C9.67919 14.1002 8.90498 14.5396 8.22192 15.0918C7.44763 15.7332 6.79548 16.4987 6.29458 17.354C6.10521 17.6661 5.38897 18.9168 5.30161 20.9528C5.25223 22.1068 5.61361 23.2983 5.78561 23.7944C5.78543 23.7956 5.78543 23.7968 5.78561 23.798C5.89413 24.081 6.31791 25.0815 7.01191 25.9303C7.2135 26.1763 7.42963 26.4111 7.65924 26.6334C6.92357 26.1457 6.26746 25.5562 5.71236 24.8839C5.02433 24.0451 4.60001 23.0549 4.48932 22.7626C4.48919 22.7605 4.48919 22.7584 4.48932 22.7564V22.7527C4.31677 22.2571 3.95431 21.0651 4.00477 19.9096C4.09213 17.8736 4.80838 16.6239 4.99775 16.3108C5.4985 15.4553 6.15067 14.6898 6.92509 14.0486C7.608 13.4961 8.38225 13.0567 9.21598 12.7484C9.73602 12.5416 10.2778 12.3891 10.8319 12.2934C11.6669 12.1537 12.5198 12.1415 13.3588 12.2575V13.2196C12.3808 13.2349 11.4148 13.4291 10.5128 13.7916Z"
						/>
						<path
							fill="#69C9D0"
							d="M20.5438 4.04635H17.2881V20.6159C17.2881 21.1983 17.2881 21.76 17.0863 22.3211C16.7575 23.2167 16.058 24.0253 15.1258 24.3842C13.7265 24.923 12.6326 24.8632 11.3276 24.0368C11.0036 23.823 10.7187 23.5594 10.4844 23.2567C11.5962 23.8251 12.5913 23.8152 13.8241 23.341C14.7558 22.9821 15.4563 22.1734 15.784 21.2774C15.9891 20.7178 15.9864 20.1546 15.9864 19.5726V3H20.4819C20.4819 3 20.4315 3.41188 20.5438 4.04635ZM26.7002 8.99104V9.9131C26.1725 9.79263 25.6609 9.61447 25.1755 9.38213C24.2352 8.93228 23.5026 8.19952 23.3594 8.0513C23.5256 8.1559 23.6981 8.25106 23.8759 8.33629C25.0192 8.88339 26.1451 9.04669 26.7002 8.99104Z"
						/>
					</svg>
				</button>
			</div>
		</div>

		<TermsFooter />
	</div>
</main>
