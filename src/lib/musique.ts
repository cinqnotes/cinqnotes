/**
 * Théorie musicale de base. Fonctions pures, sans DOM :
 * elles sont appelées au build (rendu Astro) autant qu'au runtime (îlot Svelte).
 */
import type { Hand, PitchClass, Step } from "~/content/curriculum/types";

export const NOMS_DIESE = [
  "Do", "Do♯", "Ré", "Ré♯", "Mi", "Fa", "Fa♯", "Sol", "Sol♯", "La", "La♯", "Si",
] as const;

export const NOMS_BEMOL = [
  "Do", "Ré♭", "Ré", "Mi♭", "Mi", "Fa", "Fa♯", "Sol", "La♭", "La", "Si♭", "Si",
] as const;

/** Nom canonique d'une tonique, utilisé dans les sélecteurs et les URL. */
export const NOMS_TONIQUE = NOMS_BEMOL;

export const TOUTES_TONALITES: PitchClass[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

/** Intervalles des gammes de référence, en demi-tons depuis la tonique. */
export const MAJEURE = [0, 2, 4, 5, 7, 9, 11];
export const MINEURE_NATURELLE = [0, 2, 3, 5, 7, 8, 10];
export const PENTATONIQUE_MINEURE = [0, 3, 5, 7, 10];
export const PENTATONIQUE_MAJEURE = [0, 2, 4, 7, 9];
export const TRIADE_MAJEURE = [0, 4, 7];
export const TRIADE_MINEURE = [0, 3, 7];

/** Modulo 12 toujours positif — les intervalles descendants sont fréquents. */
export const mod12 = (n: number): number => ((n % 12) + 12) % 12;

/** Une touche noire, exprimée en hauteur absolue ou en classe de hauteur. */
export const estNoire = (hauteur: number): boolean =>
  [1, 3, 6, 8, 10].includes(mod12(hauteur));

/** Tonalités qu'on écrit en bémols plutôt qu'en dièses. */
export const tonaliteBemol = (tonique: number): boolean =>
  [1, 3, 5, 8, 10].includes(mod12(tonique));

/** Nom d'une note, orthographié selon la tonalité courante. */
export const nomDeNote = (hauteur: number, tonique: number): string =>
  (tonaliteBemol(tonique) ? NOMS_BEMOL : NOMS_DIESE)[mod12(hauteur)]!;

/** Nom d'une tonique, tel qu'affiché dans l'interface. */
export const nomDeTonique = (tonique: PitchClass): string => NOMS_TONIQUE[tonique]!;

/** Forme d'une tonique utilisable dans une URL : « Mi♭ » → « mi-bemol ». */
export const toniqueEnSlug = (tonique: PitchClass): string =>
  nomDeTonique(tonique)
    .toLowerCase()
    .replace("♭", "-bemol")
    .replace("♯", "-diese")
    .replace("é", "e");

export const toniqueDepuisSlug = (slug: string): PitchClass | undefined =>
  TOUTES_TONALITES.find((t) => toniqueEnSlug(t) === slug);

/**
 * Développe une gamme en pas d'animation : montée jusqu'à l'octave, puis descente.
 * `doigtes` couvre la montée octave comprise, soit `intervalles.length + 1` entrées.
 */
export function pasDeGamme(intervalles: number[], doigtes: number[]): Step[] {
  const montee = [...intervalles, 12];
  const pas: Step[] = montee.map((n, i) => ({ n: [n], f: [doigtes[i]!] }));
  for (let i = montee.length - 2; i >= 0; i--) {
    pas.push({ n: [montee[i]!], f: [doigtes[i]!] });
  }
  return pas;
}

/**
 * Les pas d'un exercice pour une main et une tonalité données.
 * Renvoie `null` quand la combinaison n'existe pas — un doigté absent ne
 * s'invente pas (I1), l'interface désactive alors le bouton.
 */
export function pasDExercice(
  exercice: { hands?: Partial<Record<Hand, Step[]>>; fing?: Partial<Record<PitchClass, Partial<Record<Hand, number[]>>>>; scale?: number[] },
  main: Hand,
  tonique: PitchClass,
): Step[] | null {
  if (exercice.hands) return exercice.hands[main] ?? null;
  if (!exercice.fing || !exercice.scale) return null;
  const doigtes = exercice.fing[tonique]?.[main];
  return doigtes ? pasDeGamme(exercice.scale, doigtes) : null;
}

/** Un exercice mélodique ne joue qu'une note à la fois : la règle du pouce s'y applique. */
export function estMelodique(pas: Step[]): boolean {
  return pas.every((p) => p.n.length === 1);
}

/** Fréquence en Hz d'un intervalle en demi-tons au-dessus du Do central. */
export const frequence = (demiTons: number): number => 261.63 * Math.pow(2, demiTons / 12);
