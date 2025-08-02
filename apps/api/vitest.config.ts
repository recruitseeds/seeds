import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		setupFiles: ["./tests/setup.ts"],
		include: ["**/__tests__/**/*.test.ts", "**/tests/**/*.test.ts"],
		coverage: {
			reporter: ["text", "json", "html"],
			exclude: [
				"node_modules/",
				"dist/",
				"coverage/",
				"**/*.d.ts",
				"tests/fixtures/",
				"tests/setup.ts",
			],
			thresholds: {
				global: {
					branches: 80,
					functions: 80,
					lines: 80,
					statements: 80,
				},
			},
		},
		testTimeout: 10000,
		hookTimeout: 10000,
		teardownTimeout: 5000,
	},
	resolve: {
		alias: {
			"@": resolve(__dirname, "./src"),
			"@tests": resolve(__dirname, "./tests"),
		},
	},
});
