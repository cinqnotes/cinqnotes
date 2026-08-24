/**
 * Produit `public/og-clavier.png` à partir de la page `/og`.
 * À relancer quand l'accroche ou l'identité visuelle change :
 *   npm run dev  (dans un autre terminal)
 *   npm run og
 */
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const URL_OG = process.env.OG_URL ?? "http://localhost:4321/og";
const SORTIE = fileURLToPath(new URL("../public/og-clavier.png", import.meta.url));

const navigateur = await chromium.launch();
const page = await navigateur.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 2,
});

await page.goto(URL_OG, { waitUntil: "networkidle" });
// Les polices Google arrivent après le premier rendu : sans cette attente,
// la vignette part avec la police de repli.
await page.evaluate(() => document.fonts.ready);
await page.locator(".carte").screenshot({ path: SORTIE });

await navigateur.close();
console.log(`Image Open Graph écrite dans ${SORTIE}`);
