/**
 * Rendu du clavier en SVG. Fonction pure et sans DOM : c'est ce qui permet
 * d'appeler `claverSVG()` dans le frontmatter Astro, donc de servir le diagramme
 * de doigté en HTML indexable, visible JS désactivé (I2).
 */
import type { Exercise, Hand, PitchClass } from "~/content/curriculum/types";
import { estNoire, mod12, nomDeNote, pasDExercice } from "~/lib/musique";

/** dim = note de référence en fond, on = note jouée, root = note la plus grave du pas. */
export type Teinte = "dim" | "on" | "root";

export interface MarqueTouche {
  /** Ce qu'on écrit sur la touche : un numéro de doigt, ou un nom de note. */
  lab?: string;
  teinte: Teinte;
}

/** Clé = demi-tons depuis `base`, dans la fenêtre [0, 24]. */
export type Surlignage = Record<number, MarqueTouche>;

/** Fenêtre affichée : deux octaves, bornes comprises. */
export const ETENDUE = 24;

const L_BLANCHE = 52;
const H_BLANCHE = 176;
const L_NOIRE = 32;
const H_NOIRE = 110;

const COULEURS = {
  blancheLibre: "#E9E1D1",
  blancheDim: "#C6BCA6",
  noireLibre: "#1D1714",
  noireDim: "#4A3D33",
  jouee: "#C9A227",
  tonique: "#A8323C",
  bord: "#14100E",
} as const;

export function claverSVG(surlignage: Surlignage, base: number): string {
  const etendue = Array.from({ length: ETENDUE + 1 }, (_, i) => i);
  const blanches = etendue.filter((a) => !estNoire(a + base));
  const x: Record<number, number> = {};
  blanches.forEach((a, i) => (x[a] = i * L_BLANCHE));

  let svgBlanches = "";
  let svgNoires = "";

  for (const a of blanches) {
    const m = surlignage[a];
    const fond = !m
      ? COULEURS.blancheLibre
      : m.teinte === "root"
        ? COULEURS.tonique
        : m.teinte === "on"
          ? COULEURS.jouee
          : COULEURS.blancheDim;
    const encre = m?.teinte === "root" ? "#fff" : COULEURS.bord;
    svgBlanches +=
      `<rect x="${x[a]}" y="0" width="${L_BLANCHE - 2}" height="${H_BLANCHE}" rx="2" ` +
      `fill="${fond}" stroke="${COULEURS.bord}" stroke-width="1.5"/>`;
    if (m?.lab) {
      const attenue = m.teinte === "dim";
      svgBlanches +=
        `<text x="${x[a]! + (L_BLANCHE - 2) / 2}" y="${H_BLANCHE - 14}" text-anchor="middle" ` +
        `font-family="JetBrains Mono Variable, ui-monospace, monospace" font-size="${attenue ? 10 : 15}" ` +
        `font-weight="${attenue ? 400 : 600}" fill="${encre}" opacity="${attenue ? 0.6 : 1}">${m.lab}</text>`;
    }
  }

  for (const a of etendue.filter((n) => estNoire(n + base))) {
    if (x[a - 1] === undefined) continue;
    const gauche = x[a - 1]! + L_BLANCHE - L_NOIRE / 2 - 1;
    const m = surlignage[a];
    const fond = !m
      ? COULEURS.noireLibre
      : m.teinte === "root"
        ? COULEURS.tonique
        : m.teinte === "on"
          ? COULEURS.jouee
          : COULEURS.noireDim;
    const encre = m?.teinte === "on" ? COULEURS.bord : "#fff";
    svgNoires +=
      `<rect x="${gauche}" y="0" width="${L_NOIRE}" height="${H_NOIRE}" rx="2" ` +
      `fill="${fond}" stroke="${COULEURS.bord}" stroke-width="1.5"/>`;
    if (m?.lab) {
      svgNoires +=
        `<text x="${gauche + L_NOIRE / 2}" y="${H_NOIRE - 10}" text-anchor="middle" ` +
        `font-family="JetBrains Mono Variable, ui-monospace, monospace" font-size="${m.teinte === "dim" ? 9 : 13}" ` +
        `font-weight="600" fill="${encre}">${m.lab}</text>`;
    }
  }

  return (
    `<svg viewBox="0 0 ${blanches.length * L_BLANCHE} ${H_BLANCHE}" xmlns="http://www.w3.org/2000/svg" ` +
    `role="img" aria-label="Clavier de piano, touches à jouer surlignées">${svgBlanches}${svgNoires}</svg>`
  );
}

/** La fenêtre démarre toujours sur une blanche, sinon le dessin part de travers. */
export const baseDuClavier = (tonique: PitchClass): number =>
  estNoire(tonique) ? tonique - 1 : tonique;

export interface OptionsSurlignage {
  main: Hand;
  tonique: PitchClass;
  /** Index du pas courant ; ignoré si l'exercice n'a pas de doigté pour cette main. */
  indexPas?: number;
}

/**
 * Construit le surlignage d'un exercice. Chemin unique, partagé par le rendu
 * statique et l'animation : un exercice sans doigté (schéma de référence seul)
 * affiche sa gamme en clair, un exercice animé l'affiche en fond.
 */
export function construireSurlignage(
  exercice: Exercise,
  { main, tonique, indexPas = 0 }: OptionsSurlignage,
): { surlignage: Surlignage; base: number } {
  const base = baseDuClavier(tonique);
  const decalage = tonique - base;
  const surlignage: Surlignage = {};
  const pas = pasDExercice(exercice, main, tonique);

  for (const intervalle of exercice.ghost) {
    for (let a = 0; a <= ETENDUE; a++) {
      if (mod12(a + base - tonique) !== mod12(intervalle)) continue;
      surlignage[a] = {
        lab: nomDeNote(a + base, tonique),
        teinte: pas ? "dim" : mod12(intervalle) === 0 ? "root" : "on",
      };
    }
  }

  if (pas && pas.length > 0) {
    const courant = pas[indexPas % pas.length]!;
    courant.n.forEach((note, i) => {
      surlignage[note + decalage] = {
        lab: String(courant.f[i]),
        teinte: i === 0 ? "root" : "on",
      };
    });
  }

  return { surlignage, base };
}

/** Raccourci pour le rendu Astro : le SVG du premier pas d'un exercice. */
export function svgDExercice(exercice: Exercise, main: Hand = "MD"): string {
  const { surlignage, base } = construireSurlignage(exercice, {
    main,
    tonique: exercice.root,
  });
  return claverSVG(surlignage, base);
}
