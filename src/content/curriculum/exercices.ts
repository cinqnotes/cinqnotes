/**
 * Les exercices animés. Tout est exprimé en intervalles depuis la tonique :
 * la transposition d'un accord ou d'un arpège est sûre, celle d'un doigté de
 * gamme ne l'est pas (I1) — d'où la table `fing`, tonalité par tonalité.
 */
import type { Exercise } from "~/content/curriculum/types";
import {
  MAJEURE,
  MINEURE_NATURELLE,
  PENTATONIQUE_MINEURE,
  TOUTES_TONALITES,
  TRIADE_MAJEURE,
  TRIADE_MINEURE,
} from "~/lib/musique";

/** Doigtés « standards », valables pour les gammes sans exception de passage. */
const STD_MD = [1, 2, 3, 1, 2, 3, 4, 5];
const STD_MG = [5, 4, 3, 2, 1, 3, 2, 1];

export const GAMME_MAJEURE: Exercise = {
  id: "gamme-majeure",
  name: "Gamme majeure",
  ghost: MAJEURE,
  scale: MAJEURE,
  root: 0,
  tempo: 500,
  // Sept tonalités seulement : celles dont le doigté est vérifié. Do, Sol, Ré,
  // La, Mi partagent le doigté standard ; Fa et Si♭ ont le leur.
  keys: [0, 7, 2, 9, 4, 5, 10],
  fing: {
    0: { MD: STD_MD, MG: STD_MG },
    7: { MD: STD_MD, MG: STD_MG },
    2: { MD: STD_MD, MG: STD_MG },
    9: { MD: STD_MD, MG: STD_MG },
    4: { MD: STD_MD, MG: STD_MG },
    5: { MD: [1, 2, 3, 4, 1, 2, 3, 4], MG: STD_MG },
    10: { MD: [2, 1, 2, 3, 1, 2, 3, 4], MG: [3, 2, 1, 4, 3, 2, 1, 3] },
  },
  tip: "MD : le pouce passe <b>sous</b> le 3. MG : le 3 passe <b>par-dessus</b> le pouce. Fa et Si♭ ont un doigté à part — c'est normal, ce sont les deux premières exceptions.",
};

export const GAMME_MINEURE: Exercise = {
  id: "gamme-mineure-naturelle",
  name: "Gamme mineure naturelle",
  ghost: MINEURE_NATURELLE,
  scale: MINEURE_NATURELLE,
  root: 9,
  tempo: 500,
  keys: [9, 2, 4, 7, 0],
  fing: {
    9: { MD: STD_MD, MG: STD_MG },
    2: { MD: STD_MD, MG: STD_MG },
    4: { MD: STD_MD, MG: STD_MG },
    7: { MD: STD_MD, MG: STD_MG },
    0: { MD: STD_MD, MG: STD_MG },
  },
  tip: "Finis toujours tes phrases sur la tonique : l'oreille entend « c'est terminé ».",
};

/**
 * La pentatonique est une gamme : son doigté ne se transpose pas mécaniquement (I1).
 * Le prototype la donnait sur les 12 tonalités avec un doigté fixe — en Mi♭ mineur
 * le pouce tombait sur une noire. Six tonalités retenues, celles où le pouce reste
 * sur une blanche. Main gauche volontairement absente : son doigté n'est pas vérifié,
 * et un doigté inventé vaut moins que pas de doigté du tout.
 */
export const PENTATONIQUE: Exercise = {
  id: "pentatonique-mineure",
  name: "Pentatonique mineure",
  ghost: PENTATONIQUE_MINEURE,
  scale: PENTATONIQUE_MINEURE,
  root: 9,
  tempo: 500,
  keys: [9, 0, 2, 4, 5, 7],
  fing: {
    9: { MD: [1, 2, 3, 1, 2, 3] },
    0: { MD: [1, 2, 3, 1, 2, 3] },
    2: { MD: [1, 2, 3, 1, 2, 3] },
    4: { MD: [1, 2, 3, 1, 2, 3] },
    5: { MD: [1, 2, 3, 1, 2, 3] },
    7: { MD: [1, 2, 3, 1, 2, 3] },
  },
  tip: "Cinq notes seulement. Rien ne peut sonner faux : c'est fait pour ça. En La mineur, ce sont uniquement des touches blanches.",
};

export const TRIADE_MAJ: Exercise = {
  id: "triade-majeure",
  name: "Accord majeur et ses renversements",
  ghost: TRIADE_MAJEURE,
  root: 0,
  tempo: 1100,
  keys: TOUTES_TONALITES,
  hands: {
    MD: [
      { n: [0, 4, 7], f: [1, 3, 5] },
      { n: [4, 7, 12], f: [1, 2, 5] },
      { n: [7, 12, 16], f: [1, 3, 5] },
      { n: [12, 16, 19], f: [1, 3, 5] },
    ],
    MG: [
      { n: [0, 4, 7], f: [5, 3, 1] },
      { n: [4, 7, 12], f: [5, 3, 1] },
      { n: [7, 12, 16], f: [5, 2, 1] },
      { n: [12, 16, 19], f: [5, 3, 1] },
    ],
  },
  tip: "Même accord, trois positions. Le 1<sup>er</sup> renversement écarte à la MD : c'est le 1-2-5 qu'il faut automatiser.",
};

export const TRIADE_MIN: Exercise = {
  id: "triade-mineure",
  name: "Accord mineur et ses renversements",
  ghost: TRIADE_MINEURE,
  root: 9,
  tempo: 1100,
  keys: TOUTES_TONALITES,
  hands: {
    MD: [
      { n: [0, 3, 7], f: [1, 3, 5] },
      { n: [3, 7, 12], f: [1, 2, 5] },
      { n: [7, 12, 15], f: [1, 3, 5] },
      { n: [12, 15, 19], f: [1, 3, 5] },
    ],
    MG: [
      { n: [0, 3, 7], f: [5, 3, 1] },
      { n: [3, 7, 12], f: [5, 3, 1] },
      { n: [7, 12, 15], f: [5, 2, 1] },
      { n: [12, 15, 19], f: [5, 3, 1] },
    ],
  },
  tip: "Doigté identique à l'accord majeur : seule la note du milieu descend d'un demi-ton. Compare les deux à la suite.",
};

export const ARPEGE_MAJEUR: Exercise = {
  id: "arpege-majeur",
  name: "Arpège majeur",
  ghost: TRIADE_MAJEURE,
  root: 0,
  tempo: 580,
  // Transposable : l'arpège procède par sauts, le pouce s'y pose sans passage
  // sous la main. Le pouce sur une noire y est courant et correct.
  keys: TOUTES_TONALITES,
  hands: {
    MD: [0, 4, 7, 12, 7, 4, 0].map((n, i) => ({ n: [n], f: [[1, 2, 3, 5, 3, 2, 1][i]!] })),
    MG: [0, 4, 7, 12, 7, 4, 0].map((n, i) => ({ n: [n], f: [[5, 3, 2, 1, 2, 3, 5][i]!] })),
  },
  tip: "Le poignet se déplace latéralement, il ne se lève pas. Aucune crispation dans l'avant-bras.",
};

export const GRILLE_POP: Exercise = {
  id: "grille-I-V-vi-IV",
  name: "I–V–vi–IV, voix liées",
  ghost: MAJEURE,
  root: 0,
  tempo: 1300,
  keys: TOUTES_TONALITES,
  hands: {
    MD: [
      { n: [0, 4, 7], f: [1, 3, 5] },
      { n: [11, 14, 19], f: [1, 2, 5] },
      { n: [9, 12, 16], f: [1, 3, 5] },
      { n: [9, 12, 17], f: [1, 2, 5] },
    ],
    MG: [
      { n: [0, 4, 7], f: [5, 3, 1] },
      { n: [11, 14, 19], f: [5, 3, 1] },
      { n: [9, 12, 16], f: [5, 3, 1] },
      { n: [9, 12, 17], f: [5, 3, 1] },
    ],
  },
  tip: "I → V (1<sup>er</sup> renversement) → vi → IV (1<sup>er</sup> renversement). La main ne bouge presque pas : c'est ça, la liaison des voix.",
};

export const BASSE_ACCORD: Exercise = {
  id: "basse-accord-accord",
  name: "Main gauche : basse – accord – accord",
  ghost: TRIADE_MAJEURE,
  root: 0,
  tempo: 500,
  keys: TOUTES_TONALITES,
  hands: {
    MG: [
      { n: [0], f: [5] },
      { n: [7, 12, 16], f: [5, 2, 1] },
      { n: [7, 12, 16], f: [5, 2, 1] },
    ],
  },
  tip: "Basse sur le temps 1, accords sur 2 et 3. Le poignet rebondit, il ne frappe pas.",
};

export const EXERCICES: Exercise[] = [
  GAMME_MAJEURE,
  GAMME_MINEURE,
  PENTATONIQUE,
  TRIADE_MAJ,
  TRIADE_MIN,
  ARPEGE_MAJEUR,
  GRILLE_POP,
  BASSE_ACCORD,
];

const PAR_ID = new Map(EXERCICES.map((e) => [e.id, e]));

export const exercice = (id: string): Exercise | undefined => PAR_ID.get(id);
