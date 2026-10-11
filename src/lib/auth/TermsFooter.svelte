<script lang="ts">
	import { resolve } from '$app/paths';
	import { pressLink } from '$lib/core/shell/press';
	import { t } from '$lib/i18n/index.svelte';
</script>

<p class="terms" data-testid="terms-footer">
	{t('auth.termsPre')}<a use:pressLink href={resolve('/terms')} data-testid="terms-link"
		>{t('auth.termsLink')}</a
	>{t('auth.termsMid')}<a use:pressLink href={resolve('/privacy')} data-testid="privacy-link"
		>{t('auth.termsPrivacy')}</a
	>{t('auth.termsPost')}
</p>
