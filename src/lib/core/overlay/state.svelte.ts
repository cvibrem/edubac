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
		this.#pending.get(id)?.(value);
		this.#pending.delete(id);
		this.#remove(id);
		return true;
	}

	/** Dismiss one modal (back/Escape/scrim path). No-op for toasts and locked modals. */
	dismiss(id: number): boolean {
		const entry = this.entries.find((e) => e.id === id);
		if (!entry || entry.kind === 'toast' || !entry.dismissible) return false;
		this.#pending.get(id)?.(null);
		this.#pending.delete(id);
		this.#remove(id);
		return true;
	}

	/**
	 * Back-button entry point: dismisses the topmost modal.
	 * Returns true when a modal consumed the press — including locked ones
	 * (they swallow back by design, like non-cancelable native dialogs).
	 * False = no modal, caller may navigate/exit.
	 */
	dismissTop(): boolean {
		const top = this.topModal();
		if (!top) return false;
		if (!top.dismissible) return true;
		this.dismiss(top.id);
		return true;
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
		return new Promise<string | null>((resolve) => {
			this.#pending.set(entry.id, resolve);
		});
	}

	#remove(id: number): void {
		if (this.entries.some((e) => e.id === id)) {
			this.entries = this.entries.filter((e) => e.id !== id);
		}
	}
}

export const overlay = new OverlayState();
