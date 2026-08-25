import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import sitemap from "@astrojs/sitemap";

// SITE_URL surcharge le domaine en CI. La valeur par défaut est le domaine réel :
// un build local doit produire exactement ce qui partira en production.
const site = process.env.SITE_URL || "https://cinqnotes.com";

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
