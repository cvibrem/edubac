export const TAB_ORDER = ['home', 'search', 'notifications', 'profile'] as const;
export type TabName = (typeof TAB_ORDER)[number];

export function tabRootOf(pathname: string): TabName | undefined {
	const seg = pathname.split('/').filter(Boolean)[0];
	return (TAB_ORDER as readonly string[]).includes(seg ?? '') ? (seg as TabName) : undefined;
}

class NavigationDirection {
	direction = $state(1);
	#lastIndex = 0;
	update(pathname: string) {
		const index = TAB_ORDER.indexOf(tabRootOf(pathname) as TabName);
		if (index === -1) return;
		this.direction = index >= this.#lastIndex ? 1 : -1;
		this.#lastIndex = index;
	}
}


class TabStack {
	stack = $state<TabName[]>([]);

	/** Call after every completed navigation to keep the stack truthful,
	 *  regardless of whether it was caused by a tab tap, a drill-in,
	 *  or the hardware back button. */
	sync(tabRoot: TabName) {
		const idx = this.stack.lastIndexOf(tabRoot);
		if (idx !== -1) {
			this.stack = this.stack.slice(0, idx + 1); // we landed on something we've seen — trim to it
		} else if (this.stack.at(-1) !== tabRoot) {
			this.stack = [...this.stack, tabRoot]; // genuinely new — grow
		}
	}

	/** Steps back to an existing occurrence of tabRoot, or -1 if it's new. */
	distanceTo(tabRoot: TabName) {
		const idx = this.stack.lastIndexOf(tabRoot, this.stack.length - 2);
		return idx === -1 ? -1 : this.stack.length - 1 - idx;
	}
}


class SessionDepth {
	depth = $state(0);

	track(type: string) {
		if (type === 'popstate') {
			this.depth = Math.max(0, this.depth - 1);
		} else if (type !== 'enter') {
			this.depth += 1;
		}
	}
}

export const navDirection = new NavigationDirection();
export const sessionDepth = new SessionDepth();
export const tabStack = new TabStack();