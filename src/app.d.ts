// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// Back-stop marker for shell overlay modals (see core/overlay/state.svelte.ts).
		// Keep in sync with OVERLAY_GUARD_KEY.
		interface PageState {
			__overlay_guard?: number;
		}
		// interface Platform {}
	}
}

export {};
