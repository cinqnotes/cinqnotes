import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import sitemap from "@astrojs/sitemap";

// Le domaine n'est pas encore arrêté (CLAUDE.md §10). SITE_URL le surchargera
// le jour du déploiement ; la valeur par défaut suffit pour un build local.
const site = process.env.SITE_URL || "https://roadmap-piano.exemple";

export default defineConfig({
  site,
  // `/og` n'est qu'un gabarit d'image : il n'a rien à faire dans le sitemap.
  integrations: [svelte(), sitemap({ filter: (page) => !page.includes("/og") })],
  // La barre d'outils de dev s'injecte dans un shadow DOM que Playwright
  // traverse : elle fausse les contrôles d'accessibilité (titres, points de
  // repère) en ajoutant des éléments qui n'existent pas en production.
  devToolbar: { enabled: false },
  build: {
    // Le contenu pédagogique doit être du HTML servi, pas du JS hydraté (I2).
    inlineStylesheets: "auto",
  },
});
