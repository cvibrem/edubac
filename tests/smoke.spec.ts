import { expect, test } from '@playwright/test';
import { tabLabels, trackErrors, waitForApp } from './helpers';

// Shell smoke: boots through splash (+ onboarding on fresh profiles),
// French tab bar up, no errors, lang set.
test('boots to home with tab bar and clean console', async ({ page }) => {
	const errors = trackErrors(page);
	await waitForApp(page);

	await expect(page).toHaveURL(/\/home$/);
	expect(await tabLabels(page)).toEqual(['Accueil', 'Recherche', 'Alertes', 'Profil']);
	expect(await page.evaluate(() => document.documentElement.lang)).toBe('fr-FR');
	expect(errors).toEqual([]);
});
