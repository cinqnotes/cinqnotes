import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "list" : "line",
  use: {
    // `||` et non `??` : une variable non définie en CI arrive comme chaîne
    // vide, pas comme `undefined`. Avec `??`, `baseURL` valait "" et le
    // ternaire de `webServer` plus bas prenait l'autre branche — les deux
    // réglages se contredisaient.
    baseURL: process.env.BASE_URL || "http://localhost:4321",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Avec `BASE_URL`, on teste un site déjà servi — c'est ce que fait la CI, qui
  // lance `wrangler pages dev` pour exercer aussi la fonction d'inscription.
  webServer: process.env.BASE_URL
    ? undefined
    : {
        // On teste le site CONSTRUIT, pas le serveur de développement.
        // Deux raisons : c'est ce que la CI et les visiteurs obtiennent
        // réellement ; et `astro dev` peut se démoniser selon l'environnement,
        // auquel cas Playwright voit sa commande « sortir immédiatement » et
        // échoue pour une raison sans rapport avec le code.
        command: "npm run build && npm run preview",
        url: "http://localhost:4321",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
