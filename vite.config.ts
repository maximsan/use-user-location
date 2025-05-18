import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'), // Main entry point for the library
      name: 'UseUserLocation', // Global variable name when used in UMD format (e.g., via a <script> tag)
      // Defines the naming convention for output files based on the format.
      // Explicit '.js' extension is used for clarity and broad compatibility.
      fileName: (format: string) => `use-user-location.${format}.js`,
      formats: ['es', 'umd', 'cjs'], // Specifies the output module formats
    },
    // rollupOptions allows direct configuration of Rollup, which Vite uses for production builds.
    rollupOptions: {
      // 'external' prevents bundling these dependencies.
      // Assumes 'react' and 'react-dom' will be provided by the consuming application (peer dependencies).
      external: ['react', 'react-dom'],
      output: {
        // 'globals' is used for UMD builds to map external imports to global variables.
        // e.g., import React from 'react' will use the global 'React' variable in a UMD context.
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
    sourcemap: true, // Generates sourcemaps for easier debugging of the bundled code.
  },
  // Vite plugins extend its functionality.
  plugins: [
    // vite-plugin-dts generates TypeScript declaration files (.d.ts) for the library.
    // This is essential for TypeScript users of the library to get type information.
    dts({
      insertTypesEntry: true, // Automatically updates the 'types' field in package.json if necessary.
      outDir: 'dist',         // Specifies that .d.ts files should be placed in the 'dist' directory.
    }),
  ],
});
