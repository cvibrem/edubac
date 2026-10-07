import { defineConfig } from '@playwright/test';

// Base shell suite: tabs, back, overlays, deep links, reduced motion.
// Dev server on :8081 (dev:expose owns :8080) — reuseExistingServer lets a
// running `npm run dev` double as the harness server.
export default defineConfig({
	testDir: './tests',
	fullyParallel: true,
	retries: process.env.CI ? 2 : 0,
	outputDir: 'test-results',
	use: {
		baseURL: 'http://127.0.0.1:8081',
		trace: 'on-first-retry'
	},
	webServer: {
		command: 'npm run dev -- --host 127.0.0.1 --port 8081 --strictPort',
		url: 'http://127.0.0.1:8081/home',
		reuseExistingServer: !process.env.CI,
		timeout: 60_000
	}
});
