/// <reference types="vitest" />
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import dts from "vite-plugin-dts";
import { defineConfig } from "vitest/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/__tests__/setup.ts",
  },
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "UseUserLocation",
      // ESM `.js`, CJS `.cjs`, UMD `.umd.js` so Node resolves each format under `"type": "module"`.
      fileName: (format: string) => {
        if (format === "cjs") return "use-user-location.cjs";
        if (format === "umd") return "use-user-location.umd.js";
        return "use-user-location.js";
      },
      formats: ["es", "umd", "cjs"],
    },
    rollupOptions: {
      external: ["react"],
      output: {
        globals: {
          react: "React",
        },
      },
    },
    sourcemap: true,
  },
  plugins: [
    dts({
      outDirs: ["dist"],
      exclude: ["src/__tests__/**"],
      // Bundled `dist/index.d.ts` (v5: `bundleTypes` + `@microsoft/api-extractor`; replaces v4 `rollupTypes`).
      bundleTypes: true,
    }),
  ],
});
