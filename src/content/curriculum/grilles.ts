/**
 * Grilles du générateur d'impro — le point d'entrée du tunnel (D10).
 * Une suite d'accords n'est pas protégeable par le droit d'auteur (I4, §12) :
 * on peut les utiliser librement. Tout reste en triades : les accords de 7e
 * sont du vocabulaire de phase 2.
 */
import type { PitchClass } from "~/content/curriculum/types";
import {
  PENTATONIQUE_MAJEURE,
  PENTATONIQUE_MINEURE,
  TRIADE_MAJEURE,
  TRIADE_MINEURE,
  mod12,
  nomDeNote,
} from "~/lib/musique";

export type Qualite = "maj" | "min";

export interface Accord {
  /** Chiffrage romain : majuscules = majeur, minuscules = mineur (§12). */
  degre: string;
  /** Demi-tons depuis la tonique de la grille. */
  fondamentale: number;
  qualite: Qualite;
}

export interface Ambiance {
  id: string;
  nom: string;
  /** Ce que l'utilisateur entend, en une phrase. */
  couleur: string;
  mode: "majeur" | "mineur";
  grille: Accord[];
  /** Les notes qui ne peuvent pas sonner faux, en demi-tons depuis la tonique. */
  gammeSure: number[];
  nomGammeSure: string;
  tempo: number;
  /** La contrainte créative : c'est elle qui empêche l'impro de tourner en rond. */
  contrainte: string;
  conseil: string;
}

export const AMBIANCES: Ambiance[] = [
  {
    id: "melancolique",
    nom: "Mélancolique",
    couleur: "Grave sans être triste. C'est la couleur de la plupart des ballades.",
    mode: "mineur",
    grille: [
      { degre: "i", fondamentale: 0, qualite: "min" },
      { degre: "VI", fondamentale: 8, qualite: "maj" },
      { degre: "III", fondamentale: 3, qualite: "maj" },
      { degre: "VII", fondamentale: 10, qualite: "maj" },
    ],
    gammeSure: PENTATONIQUE_MINEURE,
    nomGammeSure: "pentatonique mineure",
    tempo: 72,
    contrainte: "Trois notes maximum par phrase, puis un silence aussi long que la phrase.",
    conseil:
      "Le silence fait la moitié du travail. Si tu joues sans arrêt, personne n'entend tes idées — pas même toi.",
  },
  {
    id: "lumineux",
    nom: "Lumineux",
    couleur: "Ouvert, franc. La grille de 80 % de la pop, dans son ordre le plus direct.",
    mode: "majeur",
    grille: [
      { degre: "I", fondamentale: 0, qualite: "maj" },
      { degre: "V", fondamentale: 7, qualite: "maj" },
      { degre: "vi", fondamentale: 9, qualite: "min" },
      { degre: "IV", fondamentale: 5, qualite: "maj" },
    ],
    gammeSure: PENTATONIQUE_MAJEURE,
    nomGammeSure: "pentatonique majeure",
    tempo: 96,
    contrainte: "Finis chaque phrase sur la tonique. L'oreille entend « c'est terminé ».",
    conseil:
      "Rejoue la même phrase sur les quatre accords sans la changer. Elle sonnera différemment à chaque fois — c'est l'harmonie qui travaille, pas toi.",
  },
  {
    id: "suspendu",
    nom: "Suspendu",
    couleur: "Flottant, sans résolution. Rien ne pousse à finir, on peut tourner longtemps.",
    mode: "mineur",
    grille: [
      { degre: "i", fondamentale: 0, qualite: "min" },
      { degre: "VII", fondamentale: 10, qualite: "maj" },
      { degre: "VI", fondamentale: 8, qualite: "maj" },
      { degre: "VII", fondamentale: 10, qualite: "maj" },
    ],
    gammeSure: PENTATONIQUE_MINEURE,
    nomGammeSure: "pentatonique mineure",
    tempo: 66,
    contrainte: "Une seule note par mesure, tenue le plus longtemps possible.",
    conseil:
      "L'exercice le plus difficile du lot, et le plus utile : il t'oblige à choisir la note au lieu de la subir.",
  },
  {
    id: "groove",
    nom: "Groove",
    couleur: "Carré, rythmique. Le squelette du blues, en triades.",
    mode: "majeur",
    grille: [
      { degre: "I", fondamentale: 0, qualite: "maj" },
      { degre: "IV", fondamentale: 5, qualite: "maj" },
      { degre: "I", fondamentale: 0, qualite: "maj" },
      { degre: "V", fondamentale: 7, qualite: "maj" },
    ],
    gammeSure: PENTATONIQUE_MINEURE,
    nomGammeSure: "pentatonique mineure",
    tempo: 108,
    contrainte:
      "Garde exactement le même rythme sur les quatre accords, change seulement les notes.",
    conseil:
      "La pentatonique <i>mineure</i> sur une grille <i>majeure</i> : c'est le frottement qui fait le blues. Ça sonne faux sur le papier, juste à l'oreille.",
  },
];

/**
 * Les six tonalités proposées. Ce sont celles où le doigté de la pentatonique
 * est vérifié (I1) — inutile d'envoyer quelqu'un improviser dans une tonalité
 * dont on ne sait pas lui montrer la main droite.
 */
export const TONALITES_IMPRO: PitchClass[] = [9, 0, 2, 4, 5, 7];

export const ambiance = (id: string): Ambiance | undefined =>
  AMBIANCES.find((a) => a.id === id);

/** Notes d'un accord de la grille, en demi-tons depuis la tonique de la grille. */
export const notesDAccord = (accord: Accord): number[] =>
  (accord.qualite === "maj" ? TRIADE_MAJEURE : TRIADE_MINEURE).map(
    (i) => accord.fondamentale + i,
  );

/** Nom affiché d'un accord : « Lam », « Fa », « Sol ». */
export const nomDAccord = (accord: Accord, tonique: PitchClass): string =>
  nomDeNote(mod12(tonique + accord.fondamentale), tonique) +
  (accord.qualite === "min" ? "m" : "");
