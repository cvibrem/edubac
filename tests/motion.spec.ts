import { expect, test } from '@playwright/test';
import { navClick, trackErrors, waitForApp } from './helpers';

// Reduced motion: navigation still works (transitions run at duration 0),
// the media query is honored, and nothing errors.
test.use({ reducedMotion: 'reduce' });

test('app works with prefers-reduced-motion', async ({ page }) => {
	const errors = trackErrors(page);
	await waitForApp(page);

	expect(
		await page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
	).toBe(true);

	await navClick(page, '.bottom-nav a[href$="/search"]', /\/search$/);
	await navClick(page, '.bottom-nav a[href$="/home"]', /\/home$/);
	await navClick(page, 'a[href$="/home/innerPage"]', /\/home\/innerPage$/);

	expect(errors).toEqual([]);
});
