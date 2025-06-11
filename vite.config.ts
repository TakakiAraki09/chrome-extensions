import { crx } from "@crxjs/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import manifest from "./manifest.json";

export default defineConfig({
	plugins: [react(), crx({ manifest })],
	build: {
		rollupOptions: {
			input: {
				popup: "./src/popup/index.html",
			},
		},
	},
	test: {
		globals: true,
		environment: "jsdom",
		setupFiles: ["./src/test/setup.ts"],
	},
});
