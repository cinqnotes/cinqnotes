/**
 * Contexte audio partagé. Un seul `AudioContext` pour le métronome, les
 * exercices et le générateur : les navigateurs en limitent le nombre, et deux
 * horloges séparées finiraient par se décaler l'une de l'autre.
 */
import { frequence } from "~/lib/musique";

let contexte: AudioContext | null = null;

export function ac(): AudioContext {
  if (!contexte) {
    const C = window.AudioContext ?? (window as any).webkitAudioContext;
    contexte = new C();
  }
  // Les navigateurs suspendent le contexte tant qu'aucun geste utilisateur
  // n'a eu lieu : on le réveille au premier son demandé.
  if (contexte.state === "suspended") void contexte.resume();
  return contexte;
}

export interface OptionsNote {
  /** Instant de départ, sur l'horloge du contexte. Par défaut : maintenant. */
  debut?: number;
  duree?: number;
  volume?: number;
}

/** Une note, en demi-tons depuis le Do central. */
export function note(demiTons: number, { debut, duree = 0.8, volume = 0.16 }: OptionsNote = {}) {
  const c = ac();
  const t = debut ?? c.currentTime;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "triangle";
  o.frequency.value = frequence(demiTons);
  o.connect(g);
  g.connect(c.destination);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(volume, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duree * 0.94);
  o.start(t);
  o.stop(t + duree);
}

export function accord(demiTons: number[], options: OptionsNote = {}) {
  // Volume réparti : trois notes au volume d'une seule saturent.
  const volume = (options.volume ?? 0.16) / Math.max(1, Math.sqrt(demiTons.length));
  for (const n of demiTons) note(n, { ...options, volume });
}

/** Le clic du métronome, programmé sur l'horloge audio. */
export function clic(accentue: boolean, debut?: number) {
  const c = ac();
  const t = debut ?? c.currentTime;
  const o = c.createOscillator();
  const g = c.createGain();
  o.frequency.value = accentue ? 1400 : 900;
  o.connect(g);
  g.connect(c.destination);
  g.gain.setValueAtTime(accentue ? 0.35 : 0.18, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
  o.start(t);
  o.stop(t + 0.06);
}

/** Le carillon de fin de bloc. */
export function carillon() {
  const c = ac();
  for (const [i, f] of [660, 880].entries()) {
    const t = c.currentTime + i * 0.14;
    const o = c.createOscillator();
    const g = c.createGain();
    o.frequency.value = f;
    o.connect(g);
    g.connect(c.destination);
    g.gain.setValueAtTime(0.001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    o.start(t);
    o.stop(t + 0.55);
  }
}
