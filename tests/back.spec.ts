import { expect, test } from '@playwright/test';
import { navClick, trackErrors, waitForApp } from './helpers';

// Back contract: drill pages walk back one level at a time; the sibling
// group (login, no tab bar) returns to where it came from.
test('browser back walks drills and sibling pages', async ({ page }) => {
	const errors = trackErrors(page);
	await waitForApp(page);

	await navClick(page, 'a[href$="/home/innerPage"]', /\/home\/innerPage$/);
	await navClick(page, 'a:has-text("Détails")', /\/home\/innerPage\/details$/);

	await page.goBack();
	await expect(page).toHaveURL(/\/home\/innerPage$/);
	await page.goBack();
	await expect(page).toHaveURL(/\/home$/);

	// Sibling group round-trip.
	await navClick(page, 'a[href$="/login"]', /\/login$/);
	await expect(page.locator('.bottom-nav')).toHaveCount(0);
	await page.goBack();
	await expect(page).toHaveURL(/\/home$/);
	await expect(page.locator('.bottom-nav')).toBeVisible();

	expect(errors).toEqual([]);
});
