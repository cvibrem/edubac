/**
 * Native-platform detection with zero Capacitor imports, so the Svelte shell
 * stays a plain web app: browser bundles never touch Capacitor, and the
 * Capacitor adapter (`./bridge.ts`) is only dynamically imported on device.
 */
export function isNativePlatform(): boolean {
	if (typeof window === 'undefined') return false;
	try {
		const cap = (window as unknown as Record<string, unknown>).Capacitor as
			{ isNativePlatform?: () => boolean; isNative?: boolean } | undefined;
		if (typeof cap?.isNativePlatform === 'function') return cap.isNativePlatform();
		if (typeof cap?.isNative === 'boolean') return cap.isNative;
	} catch {
		// Reading the global must never break boot.
	}
	return false;
}
