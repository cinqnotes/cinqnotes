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
  | "serie_3";

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
