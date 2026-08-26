/**
 * Base commune à tous les parcours : **aucun test n'émet de mesure réelle**.
 *
 * Le problème corrigé ici a réellement eu lieu. La CI construit le site avec
 * `PUBLIC_UMAMI_URL` puis fait tourner Playwright contre cet artefact ; le
 * script pointant vers `stats.cinqnotes.com`, qui est public, chaque exécution
 * injectait une vingtaine de pages vues et plusieurs événements dans la
 * production — depuis les runners GitHub, donc étiquetés « États-Unis ».
 *
 * Autrement dit, le pipeline fabriquait du faux trafic dans les chiffres qui
 * décident du passage en phase 2 (CLAUDE.md §8 phase 1), et ce faux trafic
 * ressemblait à des visiteurs.
 *
 * Deux protections, volontairement redondantes : la première est le mécanisme
 * prévu par Umami, la seconde garantit qu'aucun octet ne sort même si le script
 * change de comportement.
 */
import { test as base, expect } from "@playwright/test";

/** Hôtes de mesure à ne jamais joindre depuis un test. */
const MESURE = /stats\.cinqnotes\.com/;

export const test = base.extend({
  page: async ({ page }, use) => {
    // 1. L'opt-out officiel d'Umami, lu par son script au chargement.
    await page.addInitScript(() => {
      try {
        localStorage.setItem("umami.disabled", "1");
      } catch {
        // Stockage bloqué : la route ci-dessous prend le relais.
      }
    });

    // 2. Filet de sécurité réseau. Ne gêne pas les tests qui remplacent
    //    `window.umami` par un espion local : ceux-là n'émettent aucune requête.
    await page.route(MESURE, (route) => route.abort());

    await use(page);
  },
});

export { expect };

/**
 * Espionne le réseau pour prouver qu'aucune mesure n'atteint la production.
 * `abandonnees` peut être non vide — le script a le droit d'essayer — mais
 * `abouties` doit rester à zéro.
 */
export function surveillerMesure(page: import("@playwright/test").Page) {
  const abouties: string[] = [];
  const abandonnees: string[] = [];
  page.on("requestfinished", (r) => {
    if (MESURE.test(r.url())) abouties.push(r.url());
  });
  page.on("requestfailed", (r) => {
    if (MESURE.test(r.url())) abandonnees.push(r.url());
  });
  return { abouties, abandonnees };
}
