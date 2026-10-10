<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { overlay, type OverlayEntry } from '$lib/core/overlay/state.svelte';
	import { motionMs } from '$lib/core/shell/reducedMotion';
	import { afterPress } from '$lib/core/shell/press';
	import { t } from '$lib/i18n/index.svelte';

	// Single root host: dialogs center, sheets dock bottom, toasts float
	// above the tab bar. Token-driven, no pure white/black (scrim is the
	// lifted dark token at 55% — same family as --bg, never #000).

	function onWindowKey(e: KeyboardEvent) {
		if (e.key === 'Escape') overlay.dismissTop();
	}

	function scrimTap(entry: OverlayEntry) {
		overlay.dismiss(entry.id);
	}

	// Guard pops never reach SvelteKit's beforeNavigate (popping a shallow
	// entry is a state sync, not a navigation), so this listener owns them.
	// It sees EVERY popstate but only acts on guard territory — everything
	// else is SvelteKit's business.
	onMount(() => {
		const onPopState = (e: PopStateEvent) => {
			overlay.onGuardPop(e.state);
		};
		window.addEventListener('popstate', onPopState);
		return () => window.removeEventListener('popstate', onPopState);
	});

	/** Initial keyboard focus for the dialog panel (a11y without autofocus). */
	function focusFirst(node: HTMLElement) {
		node.focus({ preventScroll: true });
	}
</script>

<svelte:window onkeydown={onWindowKey} />

{#each overlay.entries.filter((e) => e.kind !== 'toast') as entry, i (entry.id)}
	<div
		class="overlay"
		style:z-index={9000 + i}
		role="presentation"
		in:fade={{ duration: motionMs(150) }}
		out:fade={{ duration: motionMs(150) }}
	>
		<button
			type="button"
			class="scrim"
			aria-label={t('overlay.dismiss')}
			tabindex={i === overlay.entries.length - 1 ? 0 : -1}
			onclick={() => scrimTap(entry)}
		></button>
		<div
			class="panel {entry.kind === 'sheet' ? 'sheet' : 'dialog'}"
			role="dialog"
			aria-modal="true"
			aria-label={entry.title}
			tabindex="-1"
			use:focusFirst
			in:fly={{ y: entry.kind === 'sheet' ? 48 : 12, duration: motionMs(200) }}
			out:fade={{ duration: motionMs(120) }}
		>
			<h2 class="title">{entry.title}</h2>
			{#if entry.message}
				<p class="message">{entry.message}</p>
			{/if}
			{#if entry.actions.length > 0}
				<div class="actions {entry.kind === 'sheet' ? 'stacked' : ''}">
					{#each entry.actions as action (action.value)}
						<button
							type="button"
							class="btn ripple {action.style === 'soft'
								? 'btn-soft'
								: action.style === 'outline'
									? 'btn-outline'
									: 'btn-primary'}"
							onclick={() => void afterPress(() => overlay.choose(entry.id, action.value))}
						>
							{action.label}
						</button>
					{/each}
				</div>
			{:else}
				<div class="actions">
					<button
						type="button"
						class="btn ripple btn-primary"
						onclick={() => void afterPress(() => overlay.dismiss(entry.id))}
					>
						{t('overlay.ok')}
					</button>
				</div>
			{/if}
		</div>
	</div>
{/each}

<div class="toast-stack" aria-live="polite">
	{#each overlay.entries.filter((e) => e.kind === 'toast') as toast (toast.id)}
		<button
			type="button"
			class="toast chip ripple"
			in:fly={{ y: 16, duration: motionMs(200) }}
			out:fade={{ duration: motionMs(150) }}
			onclick={() => void afterPress(() => overlay.dismiss(toast.id))}
		>
			<span role="status"
				><strong>{toast.title}</strong>{toast.message ? ` — ${toast.message}` : ''}</span
			>
		</button>
	{/each}
</div>

<style>
	.overlay {
		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--pad-page);
	}
	.scrim {
		position: absolute;
		inset: 0;
		background: rgba(10, 12, 17, 0.55);
	}
	.panel {
		position: relative;
		width: 100%;
		max-width: 26rem;
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: var(--r-lg);
		box-shadow: var(--shadow-3);
		padding: var(--sp-5);
	}
	.overlay:has(.sheet) {
		align-items: flex-end;
		padding: 0;
	}
	.sheet {
		max-width: none;
		border-radius: var(--r-xl) var(--r-xl) 0 0;
		border-bottom: none;
		padding-bottom: max(var(--sp-5), env(safe-area-inset-bottom, 0px));
	}
	.title {
		margin: 0 0 var(--sp-2);
		font-size: var(--fs-h2);
	}
	.message {
		margin: 0 0 var(--sp-4);
		color: var(--ink-2);
	}
	.actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--sp-2);
	}
	.actions.stacked {
		flex-direction: column;
		align-items: stretch;
	}
	.actions.stacked .btn {
		width: 100%;
	}
	.toast-stack {
		position: fixed;
		right: 0;
		bottom: calc(4.5rem + env(safe-area-inset-bottom, 0px));
		left: 0;
		z-index: 9500;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--sp-2);
		padding: 0 var(--pad-page);
		pointer-events: none;
	}
	.toast {
		pointer-events: auto;
		max-width: 26rem;
		box-shadow: var(--shadow-2);
		cursor: pointer;
	}
</style>
