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

	// Onboarding first, then the welcome step: eyebrow over the
	// time-based greeting, name slot unknown.
	await page.locator('.onboarding .cta').click();
	await expect(page).toHaveURL(/\/welcome$/);
	await expect(page.locator('.eyebrow')).toHaveText("Faisons connaissance d'abord");
	const dayGreeting =
		new Date().getHours() >= 6 && new Date().getHours() < 18 ? 'Bonjour,' : 'Bonsoir,';
	await expect(page.locator('.hi-day')).toHaveText(dayGreeting);
	await expect(page.locator('.hi-who')).toHaveText("L'inconnu !");

	// Desktop arrival lands focused (no keyboard to pop); the caret blinks
	// while empty, focused or not — it rests only on blur-with-text.
	expect(
		await page.evaluate(() => (document.activeElement as HTMLElement | null)?.dataset?.testid)
	).toBe('welcome-name');
	await expect(page.locator('.caret')).toBeVisible();
	await page.locator('.hi-day').click();
	await expect(page.locator('.caret')).toBeVisible();

	// CTAs are always enabled: tapping with an empty name shows the error
	// instead of swallowing the press.
	await page.locator('[data-testid="welcome-guest"]').click();
	await expect(page.locator('#welcome-name-error')).toHaveText('Entre ton prénom pour continuer');
	await expect(page).toHaveURL(/\/welcome$/);

	await page.locator('[data-testid="welcome-name"]').fill('Marie');
	// The header slot follows the typing live.
	await expect(page.locator('.hi-who')).toHaveText('Marie !');
	await expect(page.locator('.caret')).toBeVisible();
	await page.locator('.hi-day').click();
	await expect(page.locator('.caret')).toHaveCount(0);

	// Guest warning: one short line.
	await expect(page.locator('.guest-warning')).toHaveText("En invité, rien n'est sauvegardé.");
	const warnLines = await page.evaluate(() => {
		const el = document.querySelector('.guest-warning') as HTMLElement;
		return el.scrollHeight / parseFloat(getComputedStyle(el).lineHeight);
	});
	expect(warnLines).toBeLessThanOrEqual(2);

	// NS4 is preselected; switching proves the dropdown writes through.
	await expect(page.locator('[data-testid="grade-select"]')).toHaveValue('ns4');
	await page.locator('[data-testid="grade-select"]').selectOption('ns4');

	// Separator reads "ou" and both CTAs share one height.
	await expect(page.locator('.auth-ctas .or-row')).toHaveText('ou');
	const ctaHeights = await page.evaluate(() => [
		document.querySelector('[data-testid="welcome-account"]')?.getBoundingClientRect().height ?? 0,
		document.querySelector('[data-testid="welcome-guest"]')?.getBoundingClientRect().height ?? 0
	]);
	expect(ctaHeights[0]).toBe(ctaHeights[1]);
	expect(ctaHeights[0]).toBeGreaterThan(0);

	// Pills share one height; the flag pill is square, theme glyphs smaller.
	const pillBox = await page.evaluate(() => {
		const lang = document.querySelector('[data-testid="pill-lang"]')?.getBoundingClientRect();
		const theme = document.querySelector('.theme-pill')?.getBoundingClientRect();
		return {
			langW: lang?.width ?? 0,
			langH: lang?.height ?? 0,
			themeH: theme?.height ?? 0
		};
	});
	expect(pillBox.langW).toBe(pillBox.langH);
	expect(pillBox.langH).toBe(pillBox.themeH);

	// Theme pins immediately (dark class on <html>).
	await page.locator('[data-testid="theme-dark"]').click();
	expect(await page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(true);

	// Language pill opens the flag menu; picking applies live.
	await page.locator('[data-testid="pill-lang"]').click();
	await expect(page.locator('[data-testid="lang-menu"]')).toBeVisible();
	await page.locator('[data-testid="lang-option-ht-HT"]').click();
	await expect(page.locator('.eyebrow')).toHaveText('Ann fè konesans dabò');

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
	// The push holds both pages until the outro settles.
	await expect(page.locator('.auth-stack')).toHaveCount(1);
	await expect(page.locator('.hi-day')).toHaveText(/Bon(jour|soir),/);
	await expect(page.locator('.hi-who')).toHaveText('Jean !');
	// Plain action line now — the title carries the name.
	await expect(page.locator('.auth-sub')).toHaveText('Connecte-toi pour continuer');

	// Back returns to welcome with the answers intact (draft restore).
	await page.locator('[data-testid="login-back"]').click();
	await expect(page).toHaveURL(/\/welcome$/);
	await expect(page.locator('.auth-stack')).toHaveCount(1);
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

test('login social buttons are placeholders', async ({ page }) => {
	const errors = trackErrors(page);
	await page.addInitScript(() => localStorage.setItem('edubac.onboarded', '1'));
	await page.goto('/login', { waitUntil: 'networkidle' });
	await page.waitForSelector('.splash', { state: 'detached', timeout: 15000 }).catch(() => {});

	// Social logins are UI-only v1: a toast, no navigation.
	await page.locator('[data-testid="social-google"]').click();
	await expect(page.locator('.toast')).toBeVisible({ timeout: 5000 });
	await expect(page).toHaveURL(/\/login$/);

	// No guest escape here: it lives on welcome only, so account
	// creation stays the obvious path.
	await expect(page.locator('[data-testid="login-guest"]')).toHaveCount(0);

	expect(errors).toEqual([]);
});

test('auth screens push left forward and pop back', async ({ page }) => {
	const errors = trackErrors(page);
	await page.addInitScript(() => localStorage.setItem('edubac.onboarded', '1'));
	await page.goto('/welcome', { waitUntil: 'networkidle' });
	await page.waitForSelector('.splash', { state: 'detached', timeout: 15000 }).catch(() => {});
	await page.locator('[data-testid="welcome-name"]').fill('Marie');

	// Sample the incoming stack mid-flight: forward push slides it in
	// from the right (positive tx), back pop from the left (negative).
	async function incomingTx(sign: 1 | -1): Promise<number> {
		return page.evaluate(
			(s) =>
				new Promise<number>((resolveTx) => {
					const t0 = Date.now();
					const tick = () => {
						const stacks = [...document.querySelectorAll('.auth-stack')];
						const el = stacks[stacks.length - 1] as HTMLElement | undefined;
						const m = el ? getComputedStyle(el).transform.match(/matrix\(([^)]+)\)/) : null;
						const tx = parseFloat(m?.[1]?.split(',')[4] ?? '');
						if (Number.isFinite(tx) && (s === 1 ? tx > 2 : tx < -2)) {
							resolveTx(tx);
							return;
						}
						if (Date.now() - t0 > 3000) {
							resolveTx(NaN);
							return;
						}
						requestAnimationFrame(tick);
					};
					tick();
				}),
			sign
		);
	}

	await page.locator('[data-testid="welcome-account"]').click();
	expect(await incomingTx(1)).toBeGreaterThan(2);
	await expect(page).toHaveURL(/\/login$/);

	await page.locator('[data-testid="login-back"]').click();
	expect(await incomingTx(-1)).toBeLessThan(-2);
	await expect(page).toHaveURL(/\/welcome$/);

	expect(errors).toEqual([]);
});

test('back from a legal page pops right instead of pushing', async ({ page }) => {
	const errors = trackErrors(page);
	await page.addInitScript(() => localStorage.setItem('edubac.onboarded', '1'));
	await page.goto('/login', { waitUntil: 'networkidle' });
	await page.waitForSelector('.splash', { state: 'detached', timeout: 15000 }).catch(() => {});

	await page.locator('[data-testid="terms-link"]').click();
	await expect(page).toHaveURL(/\/terms$/);
	await expect(page.locator('.auth-stack')).toHaveCount(1);

	// Lateral back (same depth): the login stack must enter from the left.
	await page.goBack();
	const tx = await page.evaluate(
		() =>
			new Promise<number>((resolveTx) => {
				const t0 = Date.now();
				const tick = () => {
					const stacks = [...document.querySelectorAll('.auth-stack')];
					const el = stacks[stacks.length - 1] as HTMLElement | undefined;
					const m = el ? getComputedStyle(el).transform.match(/matrix\(([^)]+)\)/) : null;
					const v = parseFloat(m?.[1]?.split(',')[4] ?? '');
					if (Number.isFinite(v) && v < -2) {
						resolveTx(v);
						return;
					}
					if (Date.now() - t0 > 3000) {
						resolveTx(NaN);
						return;
					}
					requestAnimationFrame(tick);
				};
				tick();
			})
	);
	expect(tx).toBeLessThan(-2);
	await expect(page).toHaveURL(/\/login$/);

	expect(errors).toEqual([]);
});

test('footer vouvoie and links open the legal pages', async ({ page }) => {
	const errors = trackErrors(page);
	await page.addInitScript(() => localStorage.setItem('edubac.onboarded', '1'));
	await page.goto('/welcome', { waitUntil: 'networkidle' });
	await page.waitForSelector('.splash', { state: 'detached', timeout: 15000 }).catch(() => {});

	// Bottom copy uses "vous"; both legal links render.
	await expect(page.locator('[data-testid="terms-footer"]')).toContainText('vous acceptez');
	await expect(page.locator('[data-testid="terms-link"]')).toHaveText("conditions d'utilisation");
	await expect(page.locator('[data-testid="privacy-link"]')).toHaveText(
		'politique de confidentialité'
	);

	// Legal pages are readable mid-flow (no profile yet) and link back.
	await page.locator('[data-testid="terms-link"]').click();
	await expect(page).toHaveURL(/\/terms$/);
	await expect(page.locator('.auth-stack')).toHaveCount(1);
	await expect(page.locator('.auth-head h1')).toHaveText("Conditions d'utilisation");
	await page.goBack();
	await expect(page).toHaveURL(/\/welcome$/);

	await page.locator('[data-testid="privacy-link"]').click();
	await expect(page).toHaveURL(/\/privacy$/);
	await expect(page.locator('.auth-stack')).toHaveCount(1);
	await expect(page.locator('.auth-head h1')).toHaveText('Politique de confidentialité');

	expect(errors).toEqual([]);
});
