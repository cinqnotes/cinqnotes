/**
 * Garde-fou contre un bug qui a bloqué un déploiement.
 *
 * GitHub Actions pose une CHAÎNE VIDE, et non `undefined`, quand une variable de
 * dépôt n'est pas définie : `env: SITE_URL: ${{ vars.SITE_URL }}` donne `""`.
 * L'opérateur `??` ne se déclenche que sur `null` et `undefined`, jamais sur une
 * chaîne vide — la valeur par défaut est donc ignorée, et le code reçoit `""`.
 *
 * En l'occurrence `new URL("")` a levé, ce qui a fait tomber tout un fichier de
 * tests et bloqué la mise en production. Le symptôme n'apparaît jamais en local,
 * où la variable est simplement absente et où `??` fait ce qu'on attend.
 *
 * Règle : pour toute lecture d'environnement avec valeur par défaut, `||`.
 */
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// Sans le retrait du slash final, `${dossier}/${nom}` produit un double slash
// et aucune comparaison de chemin ne fonctionne.
const RACINE = fileURLToPath(new URL("..", import.meta.url)).replace(/\/$/, "");

const IGNORES = ["node_modules", "dist", ".git", ".wrangler", ".astro", "test-results"];

/** Ce fichier contient le motif à titre de donnée : il ne s'inspecte pas lui-même. */
const MOI = fileURLToPath(import.meta.url);

function sources(dossier = RACINE): string[] {
  return readdirSync(dossier, { withFileTypes: true }).flatMap((e) => {
    if (IGNORES.includes(e.name)) return [];
    const chemin = `${dossier}/${e.name}`;
    if (e.isDirectory()) return sources(chemin);
    if (chemin === MOI) return [];
    return /\.(ts|mjs|js|astro|svelte)$/.test(e.name) ? [chemin] : [];
  });
}

/** `process.env.QUELQUE_CHOSE ??` — le motif exact qui casse. */
const MOTIF = /process\.env\.[A-Z_][A-Z0-9_]*\s*\?\?/;

describe("lecture des variables d'environnement", () => {
  it("aucune valeur par défaut n'utilise `??`", () => {
    const fautifs = sources()
      .map((f) => ({ f, lignes: readFileSync(f, "utf8").split("\n") }))
      .flatMap(({ f, lignes }) =>
        lignes
          .map((ligne, i) => ({ ligne, n: i + 1 }))
          .filter(({ ligne }) => MOTIF.test(ligne))
          .map(({ ligne, n }) => `${f.replace(RACINE, "")}:${n}  ${ligne.trim()}`),
      );

    expect(
      fautifs,
      "Utiliser `||` : en CI ces variables arrivent comme chaîne vide, que `??` laisse passer.",
    ).toEqual([]);
  });

  it("le motif recherché est bien détecté", () => {
    // Sans ce contrôle, une expression régulière cassée rendrait le test
    // ci-dessus toujours vert sans rien vérifier.
    expect(MOTIF.test('const x = process.env.SITE_URL ?? "defaut";')).toBe(true);
    expect(MOTIF.test('const x = process.env.SITE_URL || "defaut";')).toBe(false);
  });
});
