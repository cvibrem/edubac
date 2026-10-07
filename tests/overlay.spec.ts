import { expect, test } from '@playwright/test';
import {
	lastDialogResult,
	navClick,
	openDialog,
	openSheet,
	openToast,
	systemBack,
	trackErrors,
	waitForApp
} from './helpers';

// Overlay back contract: the topmost dialog/sheet dismisses INSTEAD of
// navigating; toasts never consume back. Action taps resolve the promise.
test('system back dismisses dialog instead of navigating', async ({ page }) => {
	const errors = trackErrors(page);
	await waitForApp(page);

	// Build depth so a back press is meaningful.
	await navClick(page, '.bottom-nav a[href$="/search"]', /\/search$/);

	await openDialog(page, {
		title: 'Delete this?',
		message: 'This cannot be undone.',
		actions: [
			{ label: 'Delete', value: 'delete' },
			{ label: 'Cancel', value: 'cancel' }
		]
	});
	await expect(page.getByRole('dialog')).toBeVisible();

	// Back dismisses the dialog; the route does not move.
	await systemBack(page);
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await expect(page).toHaveURL(/\/search$/);
	expect(await lastDialogResult(page)).toBeNull();

	// …and the history entry is intact: another back really navigates.
	await page.goBack();
	await expect(page).toHaveURL(/\/home$/);

	expect(errors).toEqual([]);
});

test('sheet action resolves, toast never blocks back', async ({ page }) => {
	const errors = trackErrors(page);
	await waitForApp(page);

	await openSheet(page, {
		title: 'Pick one',
		actions: [
			{ label: 'First', value: 'first' },
			{ label: 'Second', value: 'second' }
		]
	});
	await expect(page.getByRole('dialog')).toBeVisible();
	await page.click('button:has-text("Second")');
	await expect(page.getByRole('dialog')).toHaveCount(0);
	expect(await lastDialogResult(page)).toBe('second');

	// Toasts float above without owning back.
	await navClick(page, '.bottom-nav a[href$="/search"]', /\/search$/);
	await openToast(page, { title: 'Saved', message: 'offline copy ready', durationMs: 5000 });
	await expect(page.getByRole('status')).toBeVisible();
	await systemBack(page);
	await expect(page).toHaveURL(/\/home$/);

	expect(errors).toEqual([]);
});

test('escape and scrim dismiss the dialog', async ({ page }) => {
	const errors = trackErrors(page);
	await waitForApp(page);

	await openDialog(page, { title: 'Hi', message: 'press escape' });
	await expect(page.getByRole('dialog')).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(page.getByRole('dialog')).toHaveCount(0);

	await openDialog(page, { title: 'Tap outside' });
	await expect(page.getByRole('dialog')).toBeVisible();
	// Scrim is the full-screen layer behind the panel — tap a corner the
	// centered panel doesn't cover.
	await page.locator('.overlay .scrim').click({ position: { x: 5, y: 5 } });
	await expect(page.getByRole('dialog')).toHaveCount(0);

	expect(errors).toEqual([]);
});
