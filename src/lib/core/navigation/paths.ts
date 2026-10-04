import { resolve } from '$app/paths';

export type ResolvedPath = string & { readonly __resolved: unique symbol };

export function asResolved(...args: Parameters<typeof resolve>): ResolvedPath {
	return resolve(...args) as ResolvedPath;
}
