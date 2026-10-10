import { expect, test, type Page } from '@playwright/test';
import { trackErrors } from './helpers';

// Connection phase: onboarding → welcome → (guest → home | account → login → home).
// Fresh contexts boot through splash + onboarding; addInitScript seeds the
// onboarding flag when a test wants to start mid-flow.

async function throughSplash(page: Page) {
	await page.goto('/', { waitUntil: 'networkidle' });
	await page.waitForSelector('.splash', { state: 'detached', timeout: 15000 }).catch(() => {});
}

test('welcome collects answers and continues as guest', async ({ page }) => {
	const errors = trackErrors(page);
	await throughSplash(page);

	// Onboarding first, then the welcome step.
	await page.locator('.onboarding .cta').click();
	await expect(page).toHaveURL(/\/welcome$/);
	await expect(page.locator('.auth-head h1')).toHaveText('Hello Stranger !');

	// CTAs are always enabled: tapping with an empty name shows the error
	// instead of swallowing the press.
	await page.locator('[data-testid="welcome-guest"]').click();
	await expect(page.locator('#welcome-name-error')).toHaveText('Entre ton prénom pour continuer');
	await expect(page).toHaveURL(/\/welcome$/);

	await page.locator('[data-testid="welcome-name"]').fill('Marie');
	// NS4 is preselected; switching proves the dropdown writes through.
	await expect(page.locator('[data-testid="grade-select"]')).toHaveValue('ns4');
	await page.locator('[data-testid="grade-select"]').selectOption('ns4');

	// Theme pins immediately (dark class on <html>).
	await page.locator('[data-testid="theme-dark"]').click();
	expect(await page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(true);

	// Language pill opens the flag menu; picking applies live.
	await page.locator('[data-testid="pill-lang"]').click();
	await expect(page.locator('[data-testid="lang-menu"]')).toBeVisible();
	await page.locator('[data-testid="lang-option-ht-HT"]').click();
	await expect(page.locator('.auth-sub')).toHaveText('Ann fè konesans dabò');

	await page.locator('[data-testid="welcome-guest"]').click();
	await expect(page).toHaveURL(/\/home$/);
	await expect(page.locator('.bottom-nav')).toBeVisible();

	const profile = await page.evaluate(() => localStorage.getItem('edubac.profile'));
	expect(JSON.parse(profile ?? '{}')).toMatchObject({
		name: 'Marie',
		grade: 'ns4',
		mode: 'guest'
	});

	// Completion persists across reloads: no second welcome.
	await page.reload({ waitUntil: 'networkidle' });
	await expect(page).toHaveURL(/\/home$/);

	expect(errors).toEqual([]);
});

test('account path keeps the draft, back returns, connect finishes', async ({ page }) => {
	const errors = trackErrors(page);
	await page.addInitScript(() => localStorage.setItem('edubac.onboarded', '1'));
	await page.goto('/welcome', { waitUntil: 'networkidle' });
	await page.waitForSelector('.splash', { state: 'detached', timeout: 15000 }).catch(() => {});

	await page.locator('[data-testid="welcome-name"]').fill('Jean');
	await page.locator('[data-testid="grade-select"]').selectOption('9eme');
	await page.locator('[data-testid="welcome-account"]').click();
	await expect(page).toHaveURL(/\/login$/);
	await expect(page.locator('.auth-head h1')).toHaveText('Hello Stranger !');

	// Back returns to welcome with the answers intact (draft restore).
	await page.locator('[data-testid="login-back"]').click();
	await expect(page).toHaveURL(/\/welcome$/);
	await expect(page.locator('[data-testid="welcome-name"]')).toHaveValue('Jean');
	await expect(page.locator('[data-testid="grade-select"]')).toHaveValue('9eme');

	// Forward again, then validate the login form.
	await page.locator('[data-testid="welcome-account"]').click();
	await expect(page).toHaveURL(/\/login$/);

	// Empty submit flags both fields and stays put.
	await page.locator('[data-testid="login-submit"]').click();
	await expect(page.getByRole('alert').first()).toBeVisible();
	await expect(page).toHaveURL(/\/login$/);

	await page.locator('[data-testid="login-email"]').fill('pas-un-mail');
	await page.locator('[data-testid="login-submit"]').click();
	await expect(page.locator('#login-email-hint')).toHaveText('Adresse e-mail invalide');
	await expect(page).toHaveURL(/\/login$/);

	await page.locator('[data-testid="login-email"]').fill('jean@exemple.ht');
	// Password eye toggles the field type.
	await expect(page.locator('[data-testid="login-password"]')).toHaveAttribute('type', 'password');
	await page.locator('[data-testid="login-pw-toggle"]').click();
	await expect(page.locator('[data-testid="login-password"]')).toHaveAttribute('type', 'text');

	await page.locator('[data-testid="login-password"]').fill('secret123');
	await expect(page.locator('[data-testid="login-submit"]')).toBeEnabled();
	await page.locator('[data-testid="login-submit"]').click();
	await expect(page).toHaveURL(/\/home$/);

	const profile = await page.evaluate(() => localStorage.getItem('edubac.profile'));
	expect(JSON.parse(profile ?? '{}')).toMatchObject({
		name: 'Jean',
		grade: '9eme',
		mode: 'account'
	});

	expect(errors).toEqual([]);
});

test('login guest escape and social placeholders', async ({ page }) => {
	const errors = trackErrors(page);
	await page.addInitScript(() => localStorage.setItem('edubac.onboarded', '1'));
	await page.goto('/login', { waitUntil: 'networkidle' });
	await page.waitForSelector('.splash', { state: 'detached', timeout: 15000 }).catch(() => {});

	// Social logins are UI-only v1: a toast, no navigation.
	await page.locator('[data-testid="social-google"]').click();
	await expect(page.locator('.toast')).toBeVisible({ timeout: 5000 });
	await expect(page).toHaveURL(/\/login$/);

	// The escape hatch still lets guests in from the second screen.
	await page.locator('[data-testid="login-guest"]').click();
	await expect(page).toHaveURL(/\/home$/);
	await expect(page.locator('.bottom-nav')).toBeVisible();

	expect(errors).toEqual([]);
});
