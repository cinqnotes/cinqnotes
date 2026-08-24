/**
 * Capture d'adresse e-mail — Cloudflare Pages Function.
 * Routage par fichier : ce fichier répond sur `/api/inscription`.
 *
 * Ce que la promesse mesure (D9) : l'appétit pour l'enregistrement des impros et
 * le montage mensuel. C'est le signal sur lequel se tranchent les seuils de
 * CLAUDE.md §8 phase 1 — donc la qualité de cette table compte plus que sa
 * taille. Une base polluée par des robots fausserait la décision.
 *
 * L'API Go de la phase 2 reprendra ce rôle ; cette fonction est faite pour
 * mourir proprement, pas pour grandir.
 */

/** Sous-ensemble de l'API D1 réellement utilisé — évite d'embarquer
 *  `@cloudflare/workers-types`, dont les globaux entrent en conflit avec la
 *  bibliothèque DOM utilisée par le reste du projet. */
interface D1 {
  prepare(sql: string): {
    bind(...valeurs: unknown[]): { run(): Promise<unknown> };
  };
}

interface Env {
  DB: D1;
}

interface Contexte {
  request: Request;
  env: Env;
}

interface CorpsInscription {
  email?: unknown;
  /** Pot de miel : invisible pour un humain, rempli par les robots. */
  piege?: unknown;
  /** Page depuis laquelle l'inscription a été faite. */
  source?: unknown;
}

/** Volontairement permissif : on refuse l'absurde, pas l'exotique.
 *  Une adresse valide rejetée coûte plus cher qu'une adresse morte acceptée. */
const FORME_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const LONGUEUR_MAX_EMAIL = 254; // RFC 5321
const LONGUEUR_MAX_SOURCE = 200;

/** 204 : c'est bon, et il n'y a rien à renvoyer. */
const ok = () => new Response(null, { status: 204 });

/**
 * Un seul export, qui répartit lui-même selon la méthode.
 *
 * Avec le seul `onRequestPost`, la route n'était pas revendiquée pour les
 * autres méthodes : un GET sur `/api/inscription` retombait sur le contenu
 * statique et renvoyait la page d'accueil en 200 — du contenu dupliqué sur une
 * URL d'API. Exporter `onRequest` seul rend la route déterministe, sans créer
 * l'ambiguïté de priorité qu'aurait posée l'export des deux.
 */
export const onRequest = async (contexte: Contexte): Promise<Response> => {
  if (contexte.request.method !== "POST") {
    return new Response("Méthode non autorisée", {
      status: 405,
      headers: { allow: "POST" },
    });
  }
  return inscrire(contexte);
};

const inscrire = async ({ request, env }: Contexte): Promise<Response> => {
  let corps: CorpsInscription;
  try {
    corps = (await request.json()) as CorpsInscription;
  } catch {
    return new Response("Corps illisible", { status: 400 });
  }

  // Pot de miel rempli : c'est un robot. On répond comme si tout allait bien —
  // signaler le rejet apprendrait au robot à contourner le champ.
  if (typeof corps.piege === "string" && corps.piege.trim() !== "") return ok();

  const email = typeof corps.email === "string" ? corps.email.trim().toLowerCase() : "";
  if (email.length === 0 || email.length > LONGUEUR_MAX_EMAIL || !FORME_EMAIL.test(email)) {
    return new Response("Adresse invalide", { status: 400 });
  }

  const source =
    typeof corps.source === "string" ? corps.source.slice(0, LONGUEUR_MAX_SOURCE) : null;

  try {
    // `INSERT OR IGNORE` sur une clé primaire : se réinscrire ne crée pas de
    // doublon et ne provoque aucune erreur visible. L'utilisateur qui clique
    // deux fois voit le même message, ce qui est le comportement attendu.
    await env.DB.prepare(
      "INSERT OR IGNORE INTO inscriptions (email, cree_le, source) VALUES (?, ?, ?)",
    )
      .bind(email, new Date().toISOString(), source)
      .run();
  } catch {
    // Ne jamais renvoyer le détail d'une erreur de base à un client public.
    return new Response("Enregistrement impossible", { status: 500 });
  }

  return ok();
};
