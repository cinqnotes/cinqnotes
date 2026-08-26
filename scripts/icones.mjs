/**
 * Produit `public/apple-touch-icon.png` à partir de `public/favicon.svg`.
 *
 * iOS ignore les favicons SVG : sans ce PNG, un site ajouté à l'écran d'accueil
 * affiche une capture de la page à la place d'une icône. Une seule source de
 * vérité — le SVG — pour éviter que les deux divergent.
 *
 *   npm run icones
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const SVG = fileURLToPath(new URL("../public/favicon.svg", import.meta.url));
const SORTIE = fileURLToPath(new URL("../public/apple-touch-icon.png", import.meta.url));
const COTE = 180; // taille attendue par iOS

const navigateur = await chromium.launch();
const page = await navigateur.newPage({ viewport: { width: COTE, height: COTE } });

await page.setContent(
  `<style>html,body{margin:0;padding:0;width:${COTE}px;height:${COTE}px}
   svg{width:${COTE}px;height:${COTE}px;display:block}</style>${readFileSync(SVG, "utf8")}`,
);
await page.locator("svg").screenshot({ path: SORTIE, omitBackground: false });

await navigateur.close();
console.log(`Icône iOS écrite dans ${SORTIE}`);
