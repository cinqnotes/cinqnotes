/**
 * Métronome à anticipation.
 *
 * Le prototype programmait un `setInterval(…, 60000/bpm)` qui appelait
 * directement le son. Deux défauts, tous deux audibles en situation réelle :
 * `setInterval` dérive de quelques millisecondes à chaque tour, ce qui
 * s'entend au bout d'une ou deux minutes ; et les navigateurs le brident à
 * une fois par seconde dès que l'onglet passe en arrière-plan — le métronome
 * se désagrège pendant que l'utilisateur joue, sans qu'il touche à rien.
 *
 * Ici, le minuteur ne fait que regarder devant lui : les clics sont programmés
 * à l'avance sur l'horloge de l'`AudioContext`, qui, elle, ne dérive pas et
 * n'est pas bridée.
 */
import { ac, clic } from "~/lib/audio";

/** Fréquence de scrutation du minuteur, en millisecondes. */
const SCRUTATION = 25;
/** Horizon de programmation : tout clic qui tombe dans cette fenêtre est posé. */
const ANTICIPATION = 0.1;

export interface OptionsMetronome {
  bpm: number;
  /** Nombre de temps par mesure ; le premier est accentué. */
  parMesure?: number;
  /** Appelé à chaque temps effectivement joué, pour l'affichage. */
  surTemps?: (temps: number, accentue: boolean) => void;
}

export function creerMetronome({ bpm, parMesure = 4, surTemps }: OptionsMetronome) {
  let tempo = bpm;
  let prochain = 0;
  let temps = 0;
  let minuteur: ReturnType<typeof setInterval> | undefined;
  /** Temps déjà programmés mais pas encore joués, à signaler à l'heure dite. */
  const enAttente: Array<{ quand: number; temps: number; accentue: boolean }> = [];

  const scruter = () => {
    const c = ac();
    while (prochain < c.currentTime + ANTICIPATION) {
      const accentue = temps % parMesure === 0;
      clic(accentue, prochain);
      enAttente.push({ quand: prochain, temps, accentue });
      prochain += 60 / tempo;
      temps++;
    }
    // L'affichage suit le son, il ne le précède pas.
    while (enAttente.length && enAttente[0]!.quand <= c.currentTime) {
      const t = enAttente.shift()!;
      surTemps?.(t.temps, t.accentue);
    }
  };

  return {
    demarrer() {
      if (minuteur) return;
      const c = ac();
      temps = 0;
      enAttente.length = 0;
      prochain = c.currentTime + 0.05;
      minuteur = setInterval(scruter, SCRUTATION);
      scruter();
    },
    arreter() {
      clearInterval(minuteur);
      minuteur = undefined;
      enAttente.length = 0;
    },
    /** Changer le tempo n'interrompt pas la mesure en cours. */
    reglerTempo(nouveau: number) {
      tempo = nouveau;
    },
    get actif() {
      return minuteur !== undefined;
    },
  };
}

export type Metronome = ReturnType<typeof creerMetronome>;
