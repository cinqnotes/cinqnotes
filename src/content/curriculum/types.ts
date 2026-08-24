/**
 * Modèle de données pédagogique — source de vérité.
 * Ces interfaces sont celles de CLAUDE.md §6 : ne pas en inventer d'autres.
 */

/** 0 = Do, 1 = Do♯/Ré♭, … 11 = Si. */
export type PitchClass = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

export type Hand = "MD" | "MG";

/** Un pas d'animation : une ou plusieurs notes jouées ensemble. */
export interface Step {
  /** Intervalles en demi-tons depuis la tonique. */
  n: number[];
  /** Doigts 1..5, même longueur que `n`. */
  f: number[];
}

export interface Exercise {
  id: string;
  name: string;
  /** Conseil affiché, HTML autorisé. */
  tip: string;
  /** Intervalles surlignés en fond (gamme ou accord de référence). */
  ghost: number[];
  /** Tonique par défaut. */
  root: PitchClass;
  /** Tonalités proposées — cf. I1. */
  keys: PitchClass[];
  /** Millisecondes entre deux pas. */
  tempo: number;

  /* Exclusif : soit un doigté fixe transposable, soit une table par tonalité. */
  hands?: Partial<Record<Hand, Step[]>>;
  fing?: Partial<Record<PitchClass, Partial<Record<Hand, number[]>>>>;
  /** Requis si `fing` est présent. */
  scale?: number[];
}

export type BlockTag =
  | "Technique"
  | "Harmonie"
  | "Oreille"
  | "Rythme"
  | "Impro"
  | "Capture"
  | "Répertoire"
  | "Transcription"
  | "Composition"
  | "Échauffement"
  | "Jeu libre"
  | "Écoute"
  | "Revue"
  | "Optionnel";

export interface Block {
  tag: BlockTag;
  title: string;
  minutes: number;
  /** Mode opératoire, une puce par consigne. HTML autorisé. */
  how: string[];
  exerciseId?: string;
}

export interface Day {
  /** 0 = dimanche. */
  weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  label: string;
  focus: string;
  keyOfDay?: string;
  blocks: Block[];
}

export interface Phase {
  id: 1 | 2 | 3 | 4;
  /** "Fondations" | "Vocabulaire" | "Langage" | "Voix personnelle" */
  label: string;
  months: [number, number];
  /** Ce qui autorise à passer à la suivante. */
  exitCriteria: string[];
  days: Day[];
}
