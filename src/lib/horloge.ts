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

/** Une clé « AAAA-MM-JJ » en Date locale, à midi — à l'abri des heures d'été. */
function dateDepuisCle(cle: string): Date {
  const [a, m, j] = cle.split("-").map(Number);
  return new Date(a!, m! - 1, j!, 12);
}

/**
 * Nombre de jours écoulés entre la PREMIÈRE pratique enregistrée et la dernière.
 * `null` s'il n'y a aucune pratique.
 *
 * C'est la mesure de rétention réelle, et elle diffère volontairement de
 * `serie()` : la série exige des jours consécutifs, alors que la décision de
 * CLAUDE.md §8 phase 1 porte sur « est-il revenu deux semaines plus tard ».
 * Quelqu'un qui pratique lundi, jeudi, samedi puis revient à J+14 est
 * exactement le profil qu'on cherche — et sa série vaut 1.
 *
 * Le calcul se fait sur le `localStorage` : c'est le seul endroit qui connaisse
 * l'historique, une mesure d'audience sans cookie ne pouvant pas reconnaître
 * quelqu'un quinze jours plus tard. Aucune donnée ne quitte l'appareil (I3).
 */
export function ancienneteEnJours(jours: Set<string>): number | null {
  if (jours.size === 0) return null;
  const cles = [...jours].sort();
  const premier = dateDepuisCle(cles[0]!);
  const dernier = dateDepuisCle(cles[cles.length - 1]!);
  return Math.round((dernier.getTime() - premier.getTime()) / 86_400_000);
}

/** Les paliers de retour franchis, du plus grand au plus petit. */
export function paliersDeRetour(jours: Set<string>): Array<7 | 14> {
  const age = ancienneteEnJours(jours);
  if (age === null) return [];
  return ([14, 7] as const).filter((p) => age >= p);
}
