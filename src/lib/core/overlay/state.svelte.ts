/**
 * Overlay primitives for the shell: dialog, bottom sheet, toast.
 *
 * Data-driven on purpose: screens call `openDialog({...})` and get a Promise
 * for the chosen action (`null` on dismiss) — no per-screen overlay
 * components, no z-index fights. Rendered once at the root by
 * `OverlayHost.svelte`, styled from design tokens.
 *
 * Back-button contract (see `core/navigation/back.ts` + `beforeNavigate` in
 * the root layout): modal overlays (dialog/sheet) own the back button — the
 * topmost one dismisses instead of navigating. Toasts never consume back.
 */

export type OverlayKind = 'dialog' | 'sheet' | 'toast';

export type OverlayActionStyle = 'primary' | 'soft' | 'outline';

export interface OverlayAction {
	label: string;
	value: string;
	style?: OverlayActionStyle;
}

export interface OverlayOptions {
	title: string;
	message?: string;
	/** Dialog/sheet buttons. Empty/omitted = informational (dismiss to close). */
	actions?: OverlayAction[];
	/** false = must pick an action; back/Escape/scrim are swallowed. Default true. */
	dismissible?: boolean;
	/** Toast only: auto-dismiss delay. Default TOAST_MS. */
	durationMs?: number;
}

export interface OverlayEntry extends OverlayOptions {
	id: number;
	kind: OverlayKind;
	dismissible: boolean;
	actions: OverlayAction[];
}

export const TOAST_MS = 3500;

import { pushState as sveltePushState } from '$app/navigation';

/**
 * Web back-stop marker. Native back never touches browser history (the bridge
 * calls `handleSystemBack()` directly), but a browser back with no
 * same-origin entry leaves the app — SvelteKit can't intercept it because
 * `beforeNavigate` only fires for full navigations, and popping a guard is
 * intentionally shallow (same URL, no navigation).
 *
 * So every modal pushes a same-URL entry via SvelteKit's own `pushState`
 * (shallow: no loads, no transitions, index tracking intact — never raw
 * `history.pushState`, which the router warns against). The back press pops
 * the guard staying in-app; the guard popstate listener in OverlayHost (plain
 * pops never reach `beforeNavigate`) dismisses instead of navigating. Never
 * a fake *place* — same URL, so the tabHistory mirror is untouched.
 */
export const OVERLAY_GUARD_KEY = '__overlay_guard';

let guardSeq = 1;

/** True while a guard entry is on top of the history stack. */
let guardOnTop = false;

function historyApi(): History | null {
	if (typeof window === 'undefined') return null;
	try {
		const h = window.history;
		if (typeof h?.pushState === 'function') return h;
	} catch {
		// Storage/history access must never break overlays.
	}
	return null;
}

/** Marker survives inside SvelteKit's page-state envelope — scan for it
 *  without coupling to the envelope's key names. */
function hasGuardMarker(s: unknown): boolean {
	if (!s || typeof s !== 'object') return false;
	return Object.values(s).some(
		(v) => !!v && typeof v === 'object' && OVERLAY_GUARD_KEY in (v as object)
	);
}

class OverlayState {
	entries = $state<OverlayEntry[]>([]);
	#nextId = 1;
	#pending = new Map<number, (value: string | null) => void>();

	/** Any dialog/sheet on screen (toasts don't count — they never block). */
	get hasModal(): boolean {
		return this.entries.some((e) => e.kind !== 'toast');
	}

	get count(): number {
		return this.entries.length;
	}

	topModal(): OverlayEntry | undefined {
		for (let i = this.entries.length - 1; i >= 0; i--) {
			const e = this.entries[i];
			if (e?.kind !== 'toast') return e;
		}
		return undefined;
	}

	/** Blocking confirm/prompt. Resolves with the action value, null on dismiss. */
	openDialog(opts: OverlayOptions): Promise<string | null> {
		return this.#push('dialog', opts);
	}

	/** Bottom-sheet choice list. Same promise contract as dialog. */
	openSheet(opts: OverlayOptions): Promise<string | null> {
		return this.#push('sheet', opts);
	}

	/** Fire-and-forget announcement. Never blocks, never consumes back. */
	openToast(opts: OverlayOptions): void {
		const entry: OverlayEntry = {
			...opts,
			id: this.#nextId++,
			kind: 'toast',
			dismissible: true,
			actions: []
		};
		this.entries = [...this.entries, entry];
		const ms = opts.durationMs ?? TOAST_MS;
		setTimeout(() => this.#remove(entry.id), ms);
	}

	/** Resolve a modal with the picked action. Returns false when unknown. */
	choose(id: number, value: string): boolean {
		const entry = this.entries.find((e) => e.id === id);
		if (!entry || entry.kind === 'toast') return false;
		this.#close(entry.id, value);
		return true;
	}

	/** Dismiss one modal (back/Escape/scrim path). No-op for toasts and locked modals. */
	dismiss(id: number): boolean {
		const entry = this.entries.find((e) => e.id === id);
		if (!entry || entry.kind === 'toast' || !entry.dismissible) return false;
		this.#close(entry.id, null);
		return true;
	}

	/**
	 * Back-button entry point: dismisses the topmost modal.
	 * Returns true when a modal consumed the press — including locked ones
	 * (they swallow back by design, like non-cancelable native dialogs).
	 * False = no modal, caller may navigate/exit.
	 * `consumeGuard` is false only when the browser already popped the guard
	 * entry (guard popstate path) — popping again would eat a real entry.
	 */
	dismissTop(consumeGuard = true): boolean {
		const top = this.topModal();
		if (!top) return false;
		if (!top.dismissible) return true;
		this.#close(top.id, null, consumeGuard);
		return true;
	}

	/**
	 * Guard-popstate entry point (OverlayHost listener). Runs on every pop
	 * that touches guard territory — SvelteKit stays silent for shallow pops,
	 * so this owns them. Returns nothing; keeps `guardOnTop` honest.
	 */
	onGuardPop(eventState: unknown): void {
		const destMarker = hasGuardMarker(eventState);
		const consumedGuard = guardOnTop;
		guardOnTop = destMarker;
		if (!consumedGuard && !destMarker) return; // SvelteKit's business.
		if (this.topModal()) {
			this.dismissTop(false);
			return;
		}
		if (destMarker) {
			// Stale guard (abandoned by a navigation, or forwarded onto):
			// keep walking back toward a real entry so one press never dies
			// on a phantom.
			const h = historyApi();
			if (!h) return;
			try {
				h.back();
			} catch {
				// Nothing to walk back to — stay put.
			}
		}
	}

	/** Route changes clear pending modals (their promises resolve null). Toasts survive. */
	clearModals(): void {
		for (const e of this.entries) {
			if (e.kind === 'toast') continue;
			this.#pending.get(e.id)?.(null);
			this.#pending.delete(e.id);
		}
		if (this.entries.some((e) => e.kind !== 'toast')) {
			this.entries = this.entries.filter((e) => e.kind === 'toast');
		}
		// Re-sync: a navigation buries or replaces any guard (buried ones
		// heal via onGuardPop when eventually popped).
		const h = historyApi();
		guardOnTop = h ? hasGuardMarker(h.state) : false;
		this.#popGuard();
	}

	#push(kind: 'dialog' | 'sheet', opts: OverlayOptions): Promise<string | null> {
		const entry: OverlayEntry = {
			...opts,
			id: this.#nextId++,
			kind,
			dismissible: opts.dismissible ?? true,
			actions: opts.actions ?? []
		};
		this.entries = [...this.entries, entry];
		this.#pushGuard();
		return new Promise<string | null>((resolve) => {
			this.#pending.set(entry.id, resolve);
		});
	}

	/** Shared close: resolve, remove, and consume one guard entry if it's on top. */
	#close(id: number, value: string | null, consumeGuard = true): void {
		this.#pending.get(id)?.(value);
		this.#pending.delete(id);
		this.#remove(id);
		if (consumeGuard) this.#popGuard();
	}

	/** Same-URL back-stop so a browser back always has an in-app entry to pop. */
	#pushGuard(): void {
		try {
			// eslint-disable-next-line svelte/no-navigation-without-resolve -- same-URL push by design; there is nothing to resolve
			sveltePushState(window.location.href, { [OVERLAY_GUARD_KEY]: guardSeq++ });
			guardOnTop = true;
		} catch {
			// Router not ready / no history — the beforeNavigate path still
			// covers same-origin backs.
		}
	}

	/**
	 * Undo one guard push when the modal closed without a back press
	 * (action/scrim/Escape). Only pops when our guard is actually on top;
	 * buried guards (navigation while open) heal via onGuardPop instead.
	 * Guard entries carry no navigation of their own, so unwinding one is
	 * a shallow sync — invisible on both web and native.
	 */
	#popGuard(): void {
		const h = historyApi();
		if (!h || !guardOnTop) return;
		try {
			if (!hasGuardMarker(h.state)) {
				guardOnTop = false;
				return;
			}
			guardOnTop = false;
			h.back();
		} catch {
			// Leave the stale guard — onGuardPop heals it on the next back.
		}
	}

	#remove(id: number): void {
		if (this.entries.some((e) => e.id === id)) {
			this.entries = this.entries.filter((e) => e.id !== id);
		}
	}
}

export const overlay = new OverlayState();
