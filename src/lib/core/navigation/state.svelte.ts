import { TAB_HREF, TAB_ORDER } from '$lib/config/tabs';
import { tabRootOf } from './helpers';
import type { TabName } from '$lib/config/tabs';

class NavigationDirection {
	direction = $state(1);
	#lastIndex: number | null = null;

	update(pathname: string) {
		const root = tabRootOf(pathname);
		if (!root) return;
		const index = TAB_ORDER.indexOf(root);
		if (this.#lastIndex === null) {
			this.#lastIndex = index;
			return;
		}
		this.direction = index >= this.#lastIndex ? 1 : -1;
		this.#lastIndex = index;
	}

	seed(pathname: string) {
		const root = tabRootOf(pathname);
		if (!root) return;
		this.#lastIndex = TAB_ORDER.indexOf(root);
	}
}

export interface HistoryEntry {
	path: string;
	root: TabName | undefined;
}

/**
 * Mirrors in-app browser history so tab switches can `history.go(-steps)`
 * with the exact step count (including drill-ins and non-tab pages).
 * Always reset/seed on `enter` + `onMount` — `afterNavigate` alone misses
 * the initial navigation that mounts the layout.
 */
class TabHistory {
	entries = $state<HistoryEntry[]>([]);
	inFlight = $state(false);

	/** Roots only, for debugging. */
	get stack(): TabName[] {
		return this.entries.map((e) => e.root).filter((r): r is TabName => r !== undefined);
	}

	get depth(): number {
		return Math.max(0, this.entries.length - 1);
	}

	get canGoBack(): boolean {
		return this.entries.length > 1;
	}

	seed(pathname: string) {
		if (this.entries.length > 0) return;
		this.entries = [{ path: pathname, root: tabRootOf(pathname) }];
	}

	reset(pathname: string) {
		this.entries = [{ path: pathname, root: tabRootOf(pathname) }];
	}

	handleAfterNavigate(opts: { type: string; toPath: string }) {
		const { type, toPath } = opts;
		this.inFlight = false;

		if (type === 'enter') {
			this.reset(toPath);
			return;
		}

		if (type === 'popstate') {
			// Back *or* forward: trim to last matching path, else treat as new push
			// (covers forward to a previously-trimmed entry).
			const idx = this.entries.map((e) => e.path).lastIndexOf(toPath);
			if (idx !== -1) {
				this.entries = this.entries.slice(0, idx + 1);
			} else {
				this.entries = [...this.entries, { path: toPath, root: tabRootOf(toPath) }];
			}
			return;
		}

		// goto / link: push unless duplicate of current
		const last = this.entries.at(-1);
		if (last?.path === toPath) return;
		this.entries = [...this.entries, { path: toPath, root: tabRootOf(toPath) }];
	}

	/** History steps back to the *root href* of a tab (Pattern B: always land on root). -1 if never visited. */
	stepsToHref(targetHref: string): number {
		for (let i = this.entries.length - 2; i >= 0; i--) {
			if (this.entries[i].path === targetHref) return this.entries.length - 1 - i;
		}
		return -1;
	}

	/** Drill depth from current page back to its own tab root. 0 when already at root or unknown. */
	stepsToRoot(): number {
		const cur = this.entries.at(-1);
		if (!cur?.root) return 0;
		const href = TAB_HREF[cur.root];
		for (let i = this.entries.length - 1; i >= 0; i--) {
			if (this.entries[i].path === href) return this.entries.length - 1 - i;
			if (this.entries[i].root !== cur.root) break;
		}
		return 0;
	}
}

class SessionDepth {
	/** Derived from history mirror so it can never desync (replaces manual track counting). */
	get depth(): number {
		return tabHistory.depth;
	}

	/** Kept for backwards-compat; counting is now derived. */
	track() {
		return;
	}
}

export const navDirection = new NavigationDirection();
export const tabHistory = new TabHistory();
export const sessionDepth = new SessionDepth();
