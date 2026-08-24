-- Capture d'adresses e-mail de la phase 0.
-- Appliquer avec :
--   npx wrangler d1 migrations apply cinqnotes --local     (développement)
--   npx wrangler d1 migrations apply cinqnotes --remote    (production)

CREATE TABLE IF NOT EXISTS inscriptions (
  -- L'e-mail EST la clé : `INSERT OR IGNORE` rend la réinscription idempotente,
  -- sans doublon ni erreur affichée à quelqu'un qui clique deux fois.
  -- Normalisé en minuscules par la fonction avant insertion.
  email   TEXT PRIMARY KEY,
  cree_le TEXT NOT NULL,
  -- Page d'origine de l'inscription. Savoir si les gens s'inscrivent depuis une
  -- page d'impro ou depuis la routine oriente directement la phase 1.
  source  TEXT
);

-- Pour compter les inscriptions par semaine sans parcourir la table entière.
CREATE INDEX IF NOT EXISTS idx_inscriptions_cree_le ON inscriptions (cree_le);
