import { expect, test } from '@playwright/test';
import { trackErrors, waitForApp } from './helpers';

// Deep links: same parser the native bridge feeds with appUrlOpen urls.
// Unknown schemes/hosts/paths are rejected (null = not ours, stay put).
const DEEP_MOD = '/src/lib/core/navigation/deepLinks.ts';

test('parseDeepLink accepts ours, rejects the rest', async ({ page }) => {
	const errors = trackErrors(page);
	await waitForApp(page);

	const cases: Array<[string, string | null]> = [
		['edubac://search', '/search'],
		['edubac:///search', '/search'],
		['edubac://home/innerPage/details', '/home/innerPage/details'],
		['https://edubac.app/notifications', '/notifications'],
		['/search', '/search'],
		['/login', '/login'],
		['/onboarding', '/onboarding'],
		['/', '/home'],
		['otherapp://search', null],
		['https://evil.com/search', null],
		['edubac://nope', null],
		['not a url', null]
	];
	for (const [raw, expected] of cases) {
		const got = await page.evaluate(([mod, r]) => import(mod).then((m) => m.parseDeepLink(r)), [
			DEEP_MOD,
			raw
		] as const);
		expect(got, raw).toBe(expected);
	}

	expect(errors).toEqual([]);
});

test('handleDeepLink routes through the tab router', async ({ page }) => {
	const errors = trackErrors(page);
	await waitForApp(page);

	const handled = await page.evaluate(
		(mod) => import(mod).then((m) => m.handleDeepLink('edubac://notifications')),
		DEEP_MOD
	);
	expect(handled).toBe(true);
	await expect(page).toHaveURL(/\/notifications$/);

	const miss = await page.evaluate(
		(mod) => import(mod).then((m) => m.handleDeepLink('otherapp://search')),
		DEEP_MOD
	);
	expect(miss).toBe(false);
	await expect(page).toHaveURL(/\/notifications$/);

	expect(errors).toEqual([]);
});
