// Emit a CommonJS-flavored type declaration (.d.cts) alongside the bundled
// dist/index.d.ts so the package's "require" condition resolves correct types.
// vite-plugin-dts v5 `bundleTypes` emits a single `dist/index.d.ts`; copy for CJS types entry.
import { copyFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const dist = resolve(dirname(fileURLToPath(import.meta.url)), "..", "dist");
copyFileSync(resolve(dist, "index.d.ts"), resolve(dist, "index.d.cts"));
