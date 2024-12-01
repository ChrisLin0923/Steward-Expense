import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	build: {
		assetsDir: "assets",
		rollupOptions: {
			input: {
				main: path.resolve(__dirname, "index.html"),
			},
			output: {
				manualChunks: undefined,
				assetFileNames: (assetInfo) => {
					const info = assetInfo.name.split(".");
					const ext = info[info.length - 1];
					if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
						return `assets/images/[name].[hash][extname]`;
					}
					return `assets/[name].[hash][extname]`;
				},
				chunkFileNames: "assets/js/[name].[hash].js",
				entryFileNames: "assets/js/[name].[hash].js",
			},
		},
	},
});
