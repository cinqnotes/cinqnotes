/**
 * I2 — Le contenu pédagogique est dans le HTML, pas dans le JS.
 *
 * Test BLOQUANT. Il lit `dist/`, c'est-à-dire exactement les octets qui seront
 * servis, et vérifie que tout le contenu indexable y figure sans JavaScript.
 * Le SEO est le canal principal (CLAUDE.md §1) : un contenu que seul le JS
 * produit n'existe pas pour un moteur de recherche.
 *
 * Exécution : `npm run build && npm run verif:sansjs`.
 */
import { existsSync, readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import { EXERCICES } from "~/content/curriculum/exercices";
import { AMBIANCES, TONALITES_IMPRO } from "~/content/curriculum/grilles";
import { JOURS_ORDONNES, jour, slugDeJour } from "~/content/curriculum/phase1";
import { toniqueEnSlug } from "~/lib/musique";

const DIST = new URL("../dist/", import.meta.url);

const lire = (chemin: string): string => {
  const f = new URL(chemin.replace(/^\//, ""), DIST);
  return existsSync(f) ? readFileSync(f, "utf8") : "";
};

/** Le HTML échappe apostrophes et entités : on compare sur une forme neutre. */
const neutre = (s: string): string =>
  s
    .replace(/<[^>]+>/g, " ")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/\s+/g, " ");

const contient = (html: string, attendu: string) =>
  neutre(html).includes(neutre(attendu).trim());

beforeAll(() => {
  expect(
    existsSync(new URL("index.html", DIST)),
    "`dist/` est absent — lance `npm run build` avant ce contrôle.",
  ).toBe(true);
});

describe("I2 — pages de routine", () => {
  it.each(JOURS_ORDONNES.map((w) => [jour(w)!.label, w] as const))(
    "%s : intitulé, focus, blocs et consignes sont dans le HTML servi",
    (_label, weekday) => {
      const d = jour(weekday)!;
      const html = lire(`/routine/${slugDeJour(weekday)}/index.html`);
      expect(html.length, "page absente").toBeGreaterThan(0);

      expect(contient(html, d.label)).toBe(true);
      expect(contient(html, d.focus)).toBe(true);

      for (const bloc of d.blocks) {
        expect(contient(html, bloc.title), `bloc « ${bloc.title} »`).toBe(true);
        for (const consigne of bloc.how) {
          expect(contient(html, consigne), `consigne de « ${bloc.title} »`).toBe(true);
        }
      }
    },
  );

  it.each(JOURS_ORDONNES.map((w) => [jour(w)!.label, w] as const))(
    "%s : les diagrammes de doigté sont du SVG servi, pas un conteneur vide",
    (_label, weekday) => {
      const d = jour(weekday)!;
      const attendus = d.blocks.filter((b) => b.exerciseId).length;
      const html = lire(`/routine/${slugDeJour(weekday)}/index.html`);
      const trouves = (html.match(/<svg /g) ?? []).length;
      expect(trouves).toBeGreaterThanOrEqual(attendus);
    },
  );
});

describe("I2 — page d'accueil", () => {
  it("porte les sept jours de la semaine", () => {
    const html = lire("/index.html");
    for (const w of JOURS_ORDONNES) {
      expect(contient(html, jour(w)!.label), `jour ${jour(w)!.label}`).toBe(true);
    }
  });

  it("porte le focus de chaque jour", () => {
    const html = lire("/index.html");
    for (const w of JOURS_ORDONNES) {
      expect(contient(html, jour(w)!.focus), `focus de ${jour(w)!.label}`).toBe(true);
    }
  });

  it("porte la séance rendue par l'îlot, avant toute hydratation", () => {
    // L'îlot Svelte est rendu au build par Astro : ses blocs doivent être là.
    const html = lire("/index.html");
    const lundi = jour(1)!;
    for (const bloc of lundi.blocks) {
      expect(contient(html, bloc.title), `bloc « ${bloc.title} »`).toBe(true);
    }
    expect((html.match(/<svg /g) ?? []).length).toBeGreaterThan(0);
  });

  it("nomme les quatre ambiances d'impro", () => {
    const html = lire("/index.html");
    for (const a of AMBIANCES) expect(contient(html, a.nom), a.nom).toBe(true);
  });
});

describe("I2 — exercices", () => {
  it("chaque exercice est nommé quelque part dans le site servi", () => {
    const tout = [
      lire("/index.html"),
      ...JOURS_ORDONNES.map((w) => lire(`/routine/${slugDeJour(w)}/index.html`)),
    ].join(" ");
    for (const e of EXERCICES) {
      expect(contient(tout, e.name), `exercice « ${e.name} »`).toBe(true);
    }
  });
});

describe("I2 — pages d'impro de longue traîne", () => {
  const pages = AMBIANCES.flatMap((a) =>
    TONALITES_IMPRO.map((t) => ({ a, chemin: `/impro/${a.id}-${toniqueEnSlug(t)}/index.html` })),
  );

  it("les 24 pages sont générées", () => {
    expect(pages.length).toBe(24);
    for (const { chemin } of pages) {
      expect(lire(chemin).length, chemin).toBeGreaterThan(0);
    }
  });

  it("chacune porte sa contrainte, sa gamme sûre et son clavier", () => {
    for (const { a, chemin } of pages) {
      const html = lire(chemin);
      expect(contient(html, a.contrainte), `${chemin} — contrainte`).toBe(true);
      expect(contient(html, a.nomGammeSure), `${chemin} — gamme sûre`).toBe(true);
      expect(html.includes("<svg "), `${chemin} — clavier`).toBe(true);
    }
  });

  it("chacune porte un titre et une description propres", () => {
    for (const { chemin } of pages) {
      const html = lire(chemin);
      expect(/<title>[^<]{25,}<\/title>/.test(html), `${chemin} — title`).toBe(true);
      expect(
        /<meta name="description" content="[^"]{60,}"/.test(html),
        `${chemin} — description`,
      ).toBe(true);
    }
  });
});

describe("SEO technique", () => {
  it("le sitemap et robots.txt sont produits", () => {
    expect(lire("/sitemap-index.xml").length).toBeGreaterThan(0);
    expect(lire("/robots.txt")).toContain("Sitemap:");
  });

  it("chaque page porte une URL canonique et une carte Open Graph", () => {
    for (const chemin of ["/index.html", "/roadmap/index.html", "/a-propos/index.html"]) {
      const html = lire(chemin);
      expect(html, chemin).toContain('rel="canonical"');
      expect(html, chemin).toContain('property="og:title"');
      expect(html, chemin).toContain('property="og:image"');
    }
  });

  it("aucun script d'analytics tant qu'Umami n'est pas configuré", () => {
    // L'infra n'est pas câblée : le site ne doit charger aucun tiers.
    expect(lire("/index.html")).not.toContain("data-website-id");
  });
});
