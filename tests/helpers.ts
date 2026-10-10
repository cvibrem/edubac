import { expect, type Page } from '@playwright/test';

/** Boot to a ready tab screen: through the web splash (+ onboarding and
 *  the welcome step on fresh profiles), onto the home tab. */
export async function waitForApp(page: Page) {
	await page.goto('/', { waitUntil: 'networkidle' });
	// Web splash covers first paint (native hides the system drawable instead).
	await page.waitForSelector('.splash', { state: 'detached', timeout: 15000 }).catch(() => {});
	// Fresh profile lands on onboarding — pass through it once.
	const cta = page.locator('.onboarding .cta');
	if (await cta.isVisible().catch(() => false)) {
		await cta.click();
		// The CTA plays its press wave + slide-left exit before routing.
		await page.waitForURL(/\/welcome$/, { timeout: 10000 });
	}
	// Onboarded but no connection profile lands on welcome — go in as guest.
	const guestName = page.locator('[data-testid="welcome-name"]');
	if (await guestName.isVisible().catch(() => false)) {
		await guestName.fill('Test');
		await page.locator('[data-testid="grade-select"]').selectOption('9eme');
		await page.locator('[data-testid="welcome-guest"]').click();
	}
	await expect(page.locator('.bottom-nav')).toBeVisible({ timeout: 10000 });
}

/** Attach before navigation; returns the live error bucket. */
export function trackErrors(page: Page): string[] {
	const errors: string[] = [];
	page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
	page.on('console', (m) => {
		if (m.type() === 'error') errors.push(`console: ${m.text()}`);
	});
	return errors;
}

export function tabLabels(page: Page): Promise<(string | null)[]> {
	return page.evaluate(() =>
		[...document.querySelectorAll('.bottom-nav .label')].map((e) => e.textContent)
	);
}

/** Drive the real overlay store inside the running app (same module instance).
 *  Fire-and-forget: the evaluate returns void immediately — the dialog
 *  promise only resolves when the test later dismisses/chooses. */
const OVERLAY_MOD = '/src/lib/core/overlay/state.svelte.ts';

export function openDialog(
	page: Page,
	opts: { title: string; message?: string; actions?: { label: string; value: string }[] }
) {
	return page.evaluate(
		([mod, o]) => {
			void import(mod).then((m) => {
				void m.overlay.openDialog(o).then((v: unknown) => {
					(window as unknown as Record<string, unknown>).__lastDialogResult = v;
				});
			});
		},
		[OVERLAY_MOD, opts] as const
	);
}

export function openSheet(
	page: Page,
	opts: { title: string; actions: { label: string; value: string }[] }
) {
	return page.evaluate(
		([mod, o]) => {
			void import(mod).then((m) => {
				void m.overlay.openSheet(o).then((v: unknown) => {
					(window as unknown as Record<string, unknown>).__lastDialogResult = v;
				});
			});
		},
		[OVERLAY_MOD, opts] as const
	);
}

export function openToast(
	page: Page,
	opts: { title: string; message?: string; durationMs?: number }
) {
	return page.evaluate(
		([mod, o]) => {
			void import(mod).then((m) => m.overlay.openToast(o));
		},
		[OVERLAY_MOD, opts] as const
	);
}

export function lastDialogResult(page: Page): Promise<unknown> {
	return page.evaluate(() => (window as unknown as Record<string, unknown>).__lastDialogResult);
}

/** Back-stop guard marker (mirrors OVERLAY_GUARD_KEY — kept literal: tests
 *  can't resolve the $lib alias at runtime). SvelteKit nests custom state
 *  inside its page-state envelope, so scan one level deep. */
export function historyGuard(page: Page): Promise<unknown> {
	return page.evaluate(() => {
		const s = window.history.state as Record<string, unknown> | null;
		if (!s || typeof s !== 'object') return null;
		for (const v of Object.values(s)) {
			if (!!v && typeof v === 'object' && '__overlay_guard' in (v as object)) {
				return (v as Record<string, unknown>)['__overlay_guard'];
			}
		}
		return null;
	});
}

export function historyLength(page: Page): Promise<number> {
	return page.evaluate(() => window.history.length);
}

/**
 * Tap-to-navigate with retry. The shell throttles programmatic navs issued
 * within ~350ms (double-tap guard) — Playwright taps faster than humans, so
 * a swallowed tap is retried instead of failing the suite.
 */
export async function navClick(page: Page, selector: string, urlRe: RegExp) {
	for (let attempt = 0; attempt < 3; attempt++) {
		await page.click(selector);
		const landed = await page
			.waitForURL(urlRe, { timeout: 1200 })
			.then(() => true)
			.catch(() => false);
		if (landed) return;
	}
	await expect(page).toHaveURL(urlRe);
}

/** System-back simulation: history.back() with no Playwright nav-wait, so
 *  cancelled popstates (overlay dismiss) resolve instead of timing out. */
export function systemBack(page: Page) {
	return page.evaluate(() => {
		window.history.back();
	});
}
