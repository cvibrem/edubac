import { redirect } from '@sveltejs/kit';
import { DEFAULT_TAB_HREF } from '$lib/config/tabs';

export function load() {
	redirect(307, DEFAULT_TAB_HREF);
}
