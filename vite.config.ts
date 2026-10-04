import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter:
				adapter(
					/*{
				fallback: 'index.html'
			}*/
				)
		})
	],
	server: {
		// Uncomment and add your host when serving dev through a reverse proxy:
		// allowedHosts: ['dev.example.com']
	}
});
