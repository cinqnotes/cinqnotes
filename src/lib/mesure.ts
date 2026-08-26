/**
 * Émission des événements d'usage.
 *
 * Umami, auto-hébergé, sans cookie — donc pas de bandeau de consentement et
 * pas de données qui partent chez un tiers. Tant que `PUBLIC_UMAMI_URL` est
 * vide, tout est silencieusement inerte : le site fonctionne, il ne mesure rien.
 */

type Umami = { track: (nom: string, donnees?: Record<string, unknown>) => void };

/**
 * Les événements de CLAUDE.md §8, plus deux ajoutés avec le générateur d'impro.
 * `serie_3` est le premier signal de rétention réelle : c'est lui qu'on regarde,
 * pas le trafic (§8 phase 1 — « le trafic ne prédit rien »).
 */
export type Evenement =
  | "session_start"
  | "block_complete"
  | "exercise_play"
  | "key_change"
  | "email_submit"
  | "impro_generate"
  /** Clic sur « Jouer la grille » : le moment où quelqu'un ENTEND le produit.
   *  Sans lui, un visiteur qui improvise deux minutes ressemble à un rebond. */
  | "impro_ecoute"
  /** Tous les blocs du jour cochés — activation réelle, pas superficielle. */
  | "seance_terminee"
  | "serie_3"
  /** Retour ≥ 7 et ≥ 14 jours après la PREMIÈRE pratique. `retour_j14` est le
   *  chiffre sur lequel se décide le passage en phase 2 (§8 phase 1), et il ne
   *  se mesure nulle part ailleurs : une audience sans cookie ne reconnaît pas
   *  quelqu'un quinze jours plus tard. */
  | "retour_j7"
  | "retour_j14";

export function mesurer(evenement: Evenement, donnees?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  const umami = (window as unknown as { umami?: Umami }).umami;
  if (!umami) return;
  try {
    umami.track(evenement, donnees);
  } catch {
    // La mesure ne doit jamais casser une séance.
  }
}

/** N'émet `session_start` qu'une fois par jour et par appareil. */
export function mesurerDebutDeSeance(cleDuJour: string): void {
  if (typeof window === "undefined") return;
  const cle = `piano:seance:${cleDuJour}`;
  try {
    if (window.sessionStorage.getItem(cle)) return;
    window.sessionStorage.setItem(cle, "1");
  } catch {
    // Stockage indisponible : on émet quand même, quitte à compter deux fois.
  }
  mesurer("session_start", { jour: cleDuJour });
}

/**
 * N'émet un événement qu'une seule fois par appareil, définitivement.
 *
 * `sessionStorage` ne convient pas ici : les paliers de retour restent vrais à
 * chaque visite suivante, et un utilisateur fidèle regonflerait le compteur
 * jour après jour — exactement les gens qu'on cherche à compter deviendraient
 * ceux qui faussent le chiffre.
 */
export function mesurerUneFois(evenement: Evenement, donnees?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  const cle = `piano:emis:${evenement}`;
  try {
    if (window.localStorage.getItem(cle)) return;
    window.localStorage.setItem(cle, "1");
  } catch {
    // Stockage bloqué : on n'émet pas plutôt que de risquer de compter
    // plusieurs fois la même personne. Un chiffre manquant se voit ;
    // un chiffre gonflé se croit.
    return;
  }
  mesurer(evenement, donnees);
}
