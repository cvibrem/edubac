import { expect, test } from '@playwright/test';
import { navClick, tabLabels, trackErrors, waitForApp } from './helpers';

// Tab contract: tap switches, same-tab tap pops drills to root, no dupes.
test('tab taps switch and pop back to root', async ({ page }) => {
	const errors = trackErrors(page);
	await waitForApp(page);

	await navClick(page, '.bottom-nav a[href$="/search"]', /\/search$/);
	expect(await tabLabels(page)).toEqual(['Accueil', 'Recherche', 'Alertes', 'Profil']);

	await navClick(page, '.bottom-nav a[href$="/notifications"]', /\/notifications$/);

	// Drill under home, then same-tab tap pops to root (Pattern B).
	await navClick(page, '.bottom-nav a[href$="/home"]', /\/home$/);
	await navClick(page, 'a[href$="/home/innerPage"]', /\/home\/innerPage$/);
	await navClick(page, '.bottom-nav a[href$="/home"]', /\/home$/);

	expect(errors).toEqual([]);
});

test('inner tabs switch without stacking duplicates', async ({ page }) => {
	const errors = trackErrors(page);
	await waitForApp(page);

	await navClick(page, 'a[href$="/home/innerPage"]', /\/home\/innerPage$/);
	await navClick(page, 'a:has-text("Détails")', /\/home\/innerPage\/details$/);
	await navClick(page, 'a:has-text("Activité")', /\/home\/innerPage\/activity$/);
	// Revisit pops, so one back step returns to Details (not a dupe).
	await page.goBack();
	await expect(page).toHaveURL(/\/home\/innerPage\/details$/);

	expect(errors).toEqual([]);
});
