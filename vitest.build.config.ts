import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Contrôles qui portent sur le site CONSTRUIT (`dist/`), pas sur les sources.
 * Séparés de `vitest.config.ts` pour que `npm test` reste exécutable sans build.
 */
export default defineConfig({
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    include: ["test-build/**/*.spec.ts"],
    environment: "node",
  },
});
