# Mise en ligne de Cinq Notes

Marche à suivre complète, dans l'ordre. Tout ce qui suit se fait **une seule
fois**. Le code, lui, est déjà prêt : il fonctionne sans aucune de ces variables
et ne charge alors aucun tiers.

Compter une heure, dont une bonne partie d'attente de propagation DNS.

---

## 0. Avant tout — vérifier le domaine

`cinqnotes.fr` et `cinqnotes.com` sont libres **au DNS**, ce qui ne prouve pas
qu'ils sont disponibles à l'achat : un domaine peut être déposé sans être
délégué. Vérifier chez le registrar avant d'aller plus loin.

Si le nom est pris, seules trois choses changent : `MARQUE` dans
`src/layouts/Base.astro`, la valeur par défaut de `site` dans `astro.config.mjs`,
et `name` dans `wrangler.toml`.

---

## 1. Domaine

Cloudflare → **Domain Registration** → Register Domains → `cinqnotes.fr`.

Prendre `.com` aussi et le rediriger : ça coûte une dizaine d'euros par an et
évite qu'on le prenne après un lancement réussi.

L'achat chez Cloudflare crée automatiquement la zone DNS. Rien à déléguer.

---

## 2. Base de données D1

```sh
npx wrangler login
npx wrangler d1 create cinqnotes
```

La commande affiche un `database_id`. **Le recopier dans `wrangler.toml`**, à la
place de `REMPLACER_APRES_CREATION`, puis appliquer la migration :

```sh
npx wrangler d1 migrations apply cinqnotes --remote
```

Vérifier :

```sh
npx wrangler d1 execute cinqnotes --remote --command "SELECT name FROM sqlite_master WHERE type='table'"
```

La table `inscriptions` doit apparaître. Si elle manque, **toutes les
inscriptions échoueront en silence** — le formulaire affichera une erreur
générique et aucune adresse ne sera conservée.

---

## 3. Projet Cloudflare Pages

```sh
npx wrangler pages project create cinqnotes --production-branch=main
```

**Ne pas connecter le dépôt Git dans le tableau de bord Cloudflare.** L'intégration
native reconstruirait le site directement depuis le dépôt et court-circuiterait
`test/fingering.spec.ts`, qui est bloquant et ne se contourne jamais
(`CLAUDE.md §11`). C'est la CI GitLab qui construit, vérifie, puis pousse.

Ensuite, dans le tableau de bord du projet :

- **Settings → Bindings → D1** : lier `DB` à la base `cinqnotes`.
  Sans ce binding, la fonction d'inscription renvoie 500 à chaque appel.
- **Custom domains** : ajouter `cinqnotes.fr` et `www.cinqnotes.fr`.

---

## 4. Jeton d'API

Cloudflare → My Profile → API Tokens → Create Token → Custom token.

Permissions minimales :

| Portée | Ressource | Droit |
|---|---|---|
| Account | Cloudflare Pages | Edit |
| Account | D1 | Edit |

Ne pas utiliser la clé globale : elle donne accès à tout le compte, y compris au
domaine.

---

## 5. Umami sur le homelab

D'abord le tunnel, pour n'avoir aucun port à ouvrir :

Cloudflare → **Zero Trust → Networks → Tunnels → Create a tunnel** → Cloudflared
→ nommer `homelab` → choisir **Docker**. Copier le jeton affiché.

Toujours dans le tunnel, onglet **Public Hostnames**, ajouter :

| Champ | Valeur |
|---|---|
| Subdomain | `stats` |
| Domain | `cinqnotes.fr` |
| Service | `HTTP` → `umami:3000` |

`umami:3000` est le nom du service dans le réseau Docker, pas une adresse de
l'hôte : les deux conteneurs partagent le même réseau Compose.

Puis, sur le homelab :

```sh
cd infra/umami
cp .env.example .env
openssl rand -base64 24   # → POSTGRES_PASSWORD
openssl rand -base64 32   # → APP_SECRET
# coller aussi le TUNNEL_TOKEN
docker compose up -d
docker compose logs -f umami
```

Ouvrir `https://stats.cinqnotes.fr`. Identifiants par défaut : `admin` /
`umami`. **Changer le mot de passe immédiatement** — le tunnel rend cette
instance publique.

Puis **Settings → Websites → Add website** :

| Champ | Valeur |
|---|---|
| Name | Cinq Notes |
| Domain | cinqnotes.fr |

Récupérer le **Website ID** affiché : c'est `PUBLIC_UMAMI_ID`.

---

## 6. Variables de CI GitLab

Settings → CI/CD → Variables. Toutes en *Protected*, les deux dernières en
*Masked* également.

| Variable | Valeur |
|---|---|
| `SITE_URL` | `https://cinqnotes.fr` |
| `PUBLIC_UMAMI_URL` | `https://stats.cinqnotes.fr/script.js` |
| `PUBLIC_UMAMI_ID` | l'identifiant de l'étape 5 |
| `PUBLIC_EMAIL_ENDPOINT` | `/api/inscription` |
| `CLOUDFLARE_ACCOUNT_ID` | visible dans l'URL du tableau de bord |
| `CLOUDFLARE_API_TOKEN` | le jeton de l'étape 4 |

Tant que `CLOUDFLARE_API_TOKEN` est absent, les jobs de déploiement ne se
déclenchent pas : le pipeline s'arrête après les vérifications. C'est voulu — on
peut pousser du code avant d'avoir l'infra.

---

## 7. Premier déploiement

```sh
git remote add origin <url-du-projet-gitlab>
git push -u origin main
```

Le pipeline enchaîne : types → tests (dont `fingering`, bloquant) → build →
vérification sans JS, parcours Playwright, budget Lighthouse → déploiement.

---

## 8. Contrôles d'après mise en ligne

```sh
# Le sitemap pointe sur le bon domaine
curl -s https://cinqnotes.fr/robots.txt

# 34 URL, aucune sur /og
curl -s https://cinqnotes.fr/sitemap-index.xml | grep -c "<loc>"

# L'endpoint refuse tout sauf POST
curl -s -o /dev/null -w "%{http_code}\n" https://cinqnotes.fr/api/inscription   # 405

# Les parcours passent contre la production
BASE_URL=https://cinqnotes.fr npx playwright test

# Budget tenu en conditions réelles, script Umami chargé
npx lighthouse https://cinqnotes.fr --view
```

Puis, à la main :

1. S'inscrire avec sa propre adresse **depuis une page d'impro**, et vérifier
   que `source` l'a retenue :
   ```sh
   npx wrangler d1 execute cinqnotes --remote --command "SELECT * FROM inscriptions"
   ```
2. Faire une séance complète depuis un téléphone : cocher un bloc, lancer un
   exercice, changer de tonalité, générer une grille.
3. Ouvrir `https://stats.cinqnotes.fr` et vérifier que les événements arrivent :
   `session_start`, `block_complete`, `exercise_play`, `key_change`,
   `impro_generate`, `email_submit`. C'est la dernière ligne de la
   `Definition of done` de `CLAUDE.md §8 phase 0`.

---

## Ce qui tombe en panne, et ce que ça casse

| Panne | Conséquence |
|---|---|
| Homelab éteint | Aucune mesure. Le site fonctionne normalement : le script est `defer` et `src/lib/mesure.ts` ne fait rien si `window.umami` est absent. |
| Binding D1 absent ou table manquante | Les inscriptions échouent, le formulaire affiche une erreur générique. Le reste du site est intact. |
| Jeton Cloudflare expiré | Le déploiement échoue, la version en ligne reste celle d'avant. |

Aucune de ces pannes n'empêche quelqu'un de faire sa séance — c'est la propriété
qu'il faut préserver à chaque évolution.
