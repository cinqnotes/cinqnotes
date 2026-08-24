/**
 * Persistance locale de l'état de pratique.
 *
 * Le prototype appelait `window.storage`, qui n'existe que dans l'environnement
 * des artefacts Claude. Ici : `localStorage`, avec repli en mémoire — navigation
 * privée, quota plein ou stockage bloqué ne doivent jamais faire perdre la
 * séance en cours, seulement l'empêcher de survivre au rechargement.
 *
 * L'état reste sur l'appareil. La synchro serveur est un chantier de phase 2,
 * et fera partie de l'offre payante (D11).
 */

export const CLE = "piano:v1";

/** Une journée de pratique : les blocs cochés et la note du journal. */
export interface JourneeEnregistree {
  done: number[];
  note: string;
}

export type EtatPratique = Record<string, JourneeEnregistree>;

let memoire: string | null = null;

function support(): Storage | null {
  try {
    const s = globalThis.localStorage;
    if (!s) return null;
    // Safari en navigation privée expose l'API mais lève à l'écriture.
    const sonde = "__piano_sonde__";
    s.setItem(sonde, "1");
    s.removeItem(sonde);
    return s;
  } catch {
    return null;
  }
}

export function lire(): EtatPratique {
  const brut = support()?.getItem(CLE) ?? memoire;
  if (!brut) return {};
  try {
    const v = JSON.parse(brut);
    return v && typeof v === "object" ? (v as EtatPratique) : {};
  } catch {
    // État corrompu : on repart de zéro plutôt que de planter la séance.
    return {};
  }
}

/** Renvoie `true` si l'écriture survivra au rechargement. */
export function ecrire(etat: EtatPratique): boolean {
  const brut = JSON.stringify(etat);
  memoire = brut;
  try {
    support()?.setItem(CLE, brut);
    return support() !== null;
  } catch {
    return false;
  }
}

export function journee(etat: EtatPratique, cle: string): JourneeEnregistree {
  return (etat[cle] ??= { done: [], note: "" });
}

/** Les jours où au moins un bloc a été coché — matière première de la série. */
export function joursPratiques(etat: EtatPratique): Set<string> {
  return new Set(
    Object.entries(etat)
      .filter(([, j]) => j.done.length > 0)
      .map(([cle]) => cle),
  );
}

/** Enregistrement différé : on écrit après le silence, pas à chaque frappe. */
export function ecrivainDiffere(delai = 400) {
  let minuteur: ReturnType<typeof setTimeout> | undefined;
  return (etat: EtatPratique, apres?: (persiste: boolean) => void) => {
    clearTimeout(minuteur);
    minuteur = setTimeout(() => apres?.(ecrire(etat)), delai);
  };
}
