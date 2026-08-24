import type { APIRoute } from "astro";

/**
 * `robots.txt` généré, et non servi depuis `public/`.
 *
 * Motif : la version statique contenait l'URL du sitemap en dur. Elle a vécu
 * tout le développement avec un domaine bouchon, et serait partie telle quelle
 * en production — envoyant les moteurs vers un sitemap inexistant, sur un
 * domaine qui n'est pas le nôtre. Ici l'URL vient de `site`, donc de `SITE_URL`,
 * donc elle ne peut plus diverger.
 */
export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL("sitemap-index.xml", site);

  return new Response(
    [
      "User-agent: *",
      "Allow: /",
      "",
      // `/og` n'est qu'un gabarit servant à fabriquer la vignette de partage.
      "Disallow: /og",
      // L'endpoint de capture n'a rien à faire dans un index.
      "Disallow: /api/",
      "",
      `Sitemap: ${sitemap.href}`,
      "",
    ].join("\n"),
    { headers: { "content-type": "text/plain; charset=utf-8" } },
  );
};
