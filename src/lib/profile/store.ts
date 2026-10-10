// Connection-phase profile (localStorage, client-only callers).
// Guest and account share the same shape: guests use every feature, but
// the profile lives only on this device — clear app data and it's gone
// (the welcome screen says exactly that). Account upgrade later only
// flips `mode` (backend comes after the UI-only v1).

export type Grade = '9eme' | 'ns4';
export type ProfileMode = 'guest' | 'account';

export interface Profile {
	name: string;
	grade: Grade;
	mode: ProfileMode;
}

/** In-progress welcome answers (grade picked, destination not yet chosen). */
export interface ProfileDraft {
	name: string;
	grade: Grade | null;
}

const KEY = 'edubac.profile';
const DRAFT_KEY = 'edubac.profile.draft';

function isGrade(value: unknown): value is Grade {
	return value === '9eme' || value === 'ns4';
}

function isProfile(value: unknown): value is Profile {
	if (!value || typeof value !== 'object') return false;
	const p = value as Record<string, unknown>;
	return (
		typeof p['name'] === 'string' &&
		isGrade(p['grade']) &&
		(p['mode'] === 'guest' || p['mode'] === 'account')
	);
}

function load(key: string): unknown {
	try {
		const raw = localStorage.getItem(key);
		if (!raw) return null;
		return JSON.parse(raw) as unknown;
	} catch {
		// Storage unavailable or corrupt: treat as absent, never trap.
		return null;
	}
}

function save(key: string, value: unknown): void {
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch {
		// Non-fatal — the choice simply won't persist.
	}
}

export function getProfile(): Profile | null {
	const found = load(KEY);
	return isProfile(found) ? found : null;
}

export function hasProfile(): boolean {
	return getProfile() !== null;
}

export function getDraft(): ProfileDraft {
	const found = load(DRAFT_KEY);
	if (found && typeof found === 'object') {
		const d = found as Record<string, unknown>;
		return {
			name: typeof d['name'] === 'string' ? d['name'] : '',
			grade: isGrade(d['grade']) ? d['grade'] : null
		};
	}
	return { name: '', grade: null };
}

export function saveDraft(draft: ProfileDraft): void {
	save(DRAFT_KEY, { name: draft.name, grade: draft.grade });
}

function finish(mode: ProfileMode, draft: ProfileDraft): Profile {
	const profile: Profile = {
		name: draft.name.trim(),
		grade: draft.grade ?? '9eme',
		mode
	};
	save(KEY, profile);
	try {
		localStorage.removeItem(DRAFT_KEY);
	} catch {
		// Non-fatal.
	}
	return profile;
}

export function completeGuest(draft: ProfileDraft): Profile {
	return finish('guest', draft);
}

export function completeAccount(draft: ProfileDraft): Profile {
	return finish('account', draft);
}

/** Test/dev escape hatch (clears completion + draft). */
export function clearProfile(): void {
	try {
		localStorage.removeItem(KEY);
		localStorage.removeItem(DRAFT_KEY);
	} catch {
		// Non-fatal.
	}
}
