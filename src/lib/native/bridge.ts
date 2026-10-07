/**
 * Capacitor wiring, quarantined. This is the ONLY shell file allowed to import
 * `@capacitor/*` — everything under `core/` and `config/` stays pure Svelte
 * so the app also builds and runs as a plain browser SPA.
 *
 * Loaded via dynamic `import()` from the root layout only when
 * `isNativePlatform()` is true, so browser bundles never fetch this chunk.
 */
import { App } from '@capacitor/app';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { handleSystemBack } from '$lib/core/navigation/back';
import { handleDeepLink } from '$lib/core/navigation/deepLinks';

const CustomSplash = registerPlugin<{ hide: () => Promise<void> }>('CustomSplash');

export function initNativeBridge(): () => void {
	if (!Capacitor.isNativePlatform()) return () => {};
	const cleanups: Array<() => void> = [];
	let dead = false;

	// Native splash (the system drawable): hide once the web UI is up.
	setTimeout(async () => {
		if (dead) return;
		try {
			await CustomSplash.hide();
		} catch (error) {
			console.error('Error hiding native splash:', error);
		}
	}, 100);

	// Hardware back: overlays/history decide; only exit when both decline.
	// (Deliberately ignores the plugin's `canGoBack` — our tabHistory mirror
	// knows about in-app depth the native webview cannot see.)
	const backListener = App.addListener('backButton', () => {
		if (!handleSystemBack()) void App.exitApp();
	});
	cleanups.push(() => {
		void backListener.then((h) => h.remove());
	});

	// Deep links: cold start + warm (`singleTask`) opens.
	const urlListener = App.addListener('appUrlOpen', ({ url }) => {
		void handleDeepLink(url);
	});
	cleanups.push(() => {
		void urlListener.then((h) => h.remove());
	});
	void App.getLaunchUrl()
		.then((launch) => {
			const url = launch?.url;
			if (!dead && url) void handleDeepLink(url);
		})
		.catch(() => {
			// No launch url — normal warm start.
		});

	return () => {
		dead = true;
		for (const fn of cleanups) fn();
	};
}
