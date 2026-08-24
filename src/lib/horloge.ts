/**
 * Clés de date, en heure LOCALE.
 *
 * Le prototype utilisait `toISOString().slice(0,10)`, qui rend la date UTC.
 * En France (UTC+1 l'hiver, UTC+2 l'été), une séance jouée entre minuit et
 * 02:00 était donc comptée la veille : la série de jours — le seul chiffre que
 * CLAUDE.md §8 juge prédictif de l'abonnement — était fausse pour tous ceux qui
 * pratiquent tard. C'est exactement le public visé.
 */

/** « 2026-08-24 » pour la date donnée, dans le fuseau du navigateur. */
export function cleDeDate(d: Date = new Date()): string {
  const mois = String(d.getMonth() + 1).padStart(2, "0");
  const jour = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mois}-${jour}`;
}

export const cleDuJour = (): string => cleDeDate();

/**
 * Clé de date du jour de semaine demandé, dans la semaine en cours.
 * La semaine commence le lundi : dimanche ferme la semaine, il ne l'ouvre pas.
 */
export function cleDeJourDeSemaine(weekday: number, aujourdhui: Date = new Date()): string {
  // Décalage depuis lundi : lundi = 0, … dimanche = 6.
  const depuisLundi = (n: number) => (n + 6) % 7;
  const ecart = depuisLundi(weekday) - depuisLundi(aujourdhui.getDay());
  const d = new Date(aujourdhui);
  d.setDate(aujourdhui.getDate() + ecart);
  return cleDeDate(d);
}

/** Les sept clés de la semaine en cours, de lundi à dimanche. */
export function semaineCourante(aujourdhui: Date = new Date()): string[] {
  return [1, 2, 3, 4, 5, 6, 0].map((j) => cleDeJourDeSemaine(j, aujourdhui));
}

/**
 * Longueur de la série en cours. Un jour compte dès qu'un bloc y est coché.
 * La journée d'aujourd'hui ne casse pas la série tant qu'elle n'est pas finie :
 * on ne punit personne à 9 h du matin.
 */
export function serie(jours: Set<string>, aujourdhui: Date = new Date()): number {
  let n = 0;
  for (let i = 0; i < 400; i++) {
    const d = new Date(aujourdhui);
    d.setDate(aujourdhui.getDate() - i);
    if (jours.has(cleDeDate(d))) n++;
    else if (i > 0) break;
  }
  return n;
}
