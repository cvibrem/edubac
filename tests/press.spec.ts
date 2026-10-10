import { expect, test } from '@playwright/test';
import { openDialog, systemBack, trackErrors, waitForApp } from './helpers';

// Native-style press gate: the transition waits out the ripple expand
// phase (~200ms) instead of firing synchronously in the click handler.
test('tab tap lets the press wave finish before switching', async ({ page }) => {
	const errors = trackErrors(page);
	await waitForApp(page);

	const link = page.locator('.bottom-nav a[href$="/search"]');
	const clickedAt = Date.now();
	await link.click();
	// Wave is up while the URL is still the old one.
	await expect
		.poll(() => link.locator('.ripple-wave').count(), { timeout: 500 })
		.toBeGreaterThan(0);
	await expect(page).toHaveURL(/\/search$/, { timeout: 5000 });
	const waitedMs = Date.now() - clickedAt;
	expect(waitedMs).toBeGreaterThanOrEqual(120);

	expect(errors).toEqual([]);
});

test('dialog action button resolves after the press gate', async ({ page }) => {
	const errors = trackErrors(page);
	await waitForApp(page);

	await openDialog(page, {
		title: 'Press?',
		actions: [{ label: 'Go', value: 'go' }]
	});
	await expect(page.getByRole('dialog')).toBeVisible();
	await page.click('button:has-text("Go")');
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await expect
		.poll(() =>
			page.evaluate(() => (window as unknown as Record<string, unknown>).__lastDialogResult)
		)
		.toBe('go');

	expect(errors).toEqual([]);
});

// pressLink in isolation: a plain anchor navigates after the gate, while
// data-no-press skips it. Synthetic anchors keep this green in both repos.
// (Module URL via a string const — a literal would make TS resolve it as a
// module, same pattern as the overlay helpers above.)
const PRESS_MOD: string = '/src/lib/core/shell/press.ts';

test('pressLink delays plain anchors; data-no-press opts out', async ({ page }) => {
	const errors = trackErrors(page);
	await waitForApp(page);

	const gatedMs = await page.evaluate((mod: string) => {
		const t0 = Date.now();
		return import(mod).then((m) => {
			const a = document.createElement('a');
			a.href = '/search';
			document.body.appendChild(a);
			m.pressLink(a);
			a.click();
			return new Promise<number>((resolve) => {
				const iv = setInterval(() => {
					if (window.location.pathname.endsWith('/search')) {
						clearInterval(iv);
						a.remove();
						resolve(Date.now() - t0);
					}
				}, 20);
				setTimeout(() => {
					clearInterval(iv);
					a.remove();
					resolve(-1);
				}, 5000);
			});
		});
	}, PRESS_MOD);
	expect(gatedMs).toBeGreaterThanOrEqual(120);

	await systemBack(page);
	await expect(page).toHaveURL(/\/home$/);

	const instantMs = await page.evaluate((mod: string) => {
		const t0 = Date.now();
		return import(mod).then((m) => {
			const a = document.createElement('a');
			a.href = '/search';
			a.setAttribute('data-no-press', '');
			document.body.appendChild(a);
			m.pressLink(a);
			a.click();
			return new Promise<number>((resolve) => {
				const iv = setInterval(() => {
					if (window.location.pathname.endsWith('/search')) {
						clearInterval(iv);
						a.remove();
						resolve(Date.now() - t0);
					}
				}, 20);
				setTimeout(() => {
					clearInterval(iv);
					a.remove();
					resolve(-1);
				}, 5000);
			});
		});
	}, PRESS_MOD);
	expect(instantMs).toBeGreaterThanOrEqual(0);
	expect(instantMs).toBeLessThan(120);

	expect(errors).toEqual([]);
});
