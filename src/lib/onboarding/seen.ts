// First-launch onboarding flag (localStorage, client-only callers).
const KEY = 'edubac.onboarded';

export function hasSeenOnboarding(): boolean {
	try {
		return localStorage.getItem(KEY) === '1';
	} catch {
		// Storage unavailable (private mode, etc.): never trap the user.
		return true;
	}
}

export function markOnboardingSeen(): void {
	try {
		localStorage.setItem(KEY, '1');
	} catch {
		// Non-fatal — onboarding simply shows again next launch.
	}
}
