<script lang="ts">
	import { resolve } from '$app/paths';
	import { t } from '$lib/i18n/index.svelte';
	import { overlay } from '$lib/core/overlay/state.svelte';
	import { handleDeepLink } from '$lib/core/navigation/deepLinks';
	import { afterPress, pressLink } from '$lib/core/shell/press';

	// Demo lab for the shell overlays (manual device testing).
	async function demoDialog() {
		const pick = await overlay.openDialog({
			title: t('demo.dlg.title'),
			message: t('demo.dlg.message'),
			actions: [
				{ label: t('demo.dlg.download'), value: 'dl' },
				{ label: t('demo.dlg.cancel'), value: 'cancel', style: 'soft' }
			]
		});
		overlay.openToast({ title: t('demo.dlg.result'), message: pick ?? '—' });
	}

	async function demoSheet() {
		const pick = await overlay.openSheet({
			title: t('demo.sheet.title'),
			actions: [
				{ label: t('demo.sheet.recent'), value: 'recent' },
				{ label: t('demo.sheet.oldest'), value: 'oldest', style: 'soft' }
			]
		});
		overlay.openToast({ title: t('demo.dlg.result'), message: pick ?? '—' });
	}

	function demoToast() {
		overlay.openToast({ title: t('demo.toast.title'), message: t('demo.toast.message') });
	}

	function demoDeepLink() {
		void handleDeepLink('edubac://notifications');
	}
</script>

<div class="demo-page" style="background:#2563eb;">
	<h1>{t('demo.home.title')}</h1>
	<p>{t('demo.home.text')}</p>
	<a class="ripple ripple-light" use:pressLink href={resolve('/home/innerPage')}
		>{t('demo.home.openInner')}</a
	>
	<a class="ripple ripple-light" use:pressLink href={resolve('/login')}>{t('demo.home.goLogin')}</a>

	<hr />
	<p class="lab-title">{t('demo.home.overlayLab')}</p>
	<div class="lab">
		<button
			type="button"
			class="btn btn-soft ripple"
			onclick={() => void afterPress(() => void demoDialog())}
		>
			{t('demo.home.dlgBtn')}
		</button>
		<button
			type="button"
			class="btn btn-soft ripple"
			onclick={() => void afterPress(() => void demoSheet())}
		>
			{t('demo.home.sheetBtn')}
		</button>
		<button
			type="button"
			class="btn btn-soft ripple"
			onclick={() => void afterPress(() => demoToast())}
		>
			{t('demo.home.toastBtn')}
		</button>
		<button
			type="button"
			class="btn btn-soft ripple"
			onclick={() => void afterPress(() => demoDeepLink())}
		>
			{t('demo.home.linkBtn')}
		</button>
	</div>
</div>

<style>
	.demo-page {
		min-height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		padding: var(--pad-page);
		color: #fff;
	}
	.demo-page a {
		color: #fff;
	}
	hr {
		width: min(100%, 20rem);
		border: none;
		border-top: 1px solid rgba(255, 255, 255, 0.35);
		margin: var(--sp-2) 0 0;
	}
	.lab-title {
		margin: 0;
		font-size: var(--fs-small);
		opacity: 0.9;
	}
	.lab {
		display: flex;
		flex-direction: column;
		gap: var(--sp-2);
		width: min(100%, 20rem);
	}
</style>
