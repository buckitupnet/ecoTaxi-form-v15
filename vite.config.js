import { defineConfig } from "vite";
import inject from "@rollup/plugin-inject";
import LV from "@lo-fi/local-vault/bundlers/vite";

export default defineConfig({
   root: "src/",
   cacheDir: "../.cache",
   base: "./",

   build: {
      outDir: "../dist",
      manifest: false,
      emptyOutDir: false,
      target: "es2022",
   },

   esbuild: {
      drop: ["console", "debugger"],
   },

   server: {
      open: true,
   },

   plugins: [
      LV(),
      inject({
         Buffer: ["buffer", "Buffer"],
         process: "process/browser",
      }),
   ],

   optimizeDeps: {
      exclude: ["@lo-fi/local-vault", "@lo-fi/local-vault/adapter/local-storage"],
      esbuildOptions: {
         target: "es2022",
      },
   },
});
