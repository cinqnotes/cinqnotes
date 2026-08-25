# Mise en ligne de Cinq Notes

Marche à suivre complète, dans l'ordre. Tout ce qui suit se fait **une seule
fois**. Le code, lui, est déjà prêt : il fonctionne sans aucune de ces variables
et ne charge alors aucun tiers.

Compter une heure, dont une bonne partie d'attente de propagation DNS.

---

## 1. Domaine — fait

**`cinqnotes.com` est acheté.** C'est le domaine canonique : il est écrit dans
`astro.config.mjs`, dans `.env.example` et dans les contrôles de build.

Deux conséquences à traiter, l'une maintenant, l'autre au lancement :

- **`cinqnotes.fr`** reste libre. Le prendre coûte une dizaine d'euros par an et
  évite qu'on s'en empare après un lancement réussi — le contenu est en français,
  c'est le premier réflexe de quelqu'un qui chercherait le site. À rediriger vers
  le `.com`, sans jamais servir les deux : un contenu identique sur deux domaines
  se pénalise tout seul.
- **Un `.com` ne porte aucun signal géographique**, là où un `.fr` en donne un.
  Comme la cible est francophone (D4), il faudra le compenser dans la Search
  Console : Paramètres → Ciblage géographique → France. Ce n'est ni bloquant ni
  urgent, mais ça se perd de vue.

Si la zone DNS n'a pas été créée automatiquement, la créer dans Cloudflare avant
la suite : le projet Pages et le tunnel en dépendent tous les deux.

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
(`CLAUDE.md §11`). C'est GitHub Actions qui construit, vérifie, puis pousse.
La tentation est particulièrement forte ici : Cloudflare propose la connexion au
dépôt GitHub en deux clics, sur la page même de création du projet.

Ensuite, dans le tableau de bord du projet :

- **Settings → Bindings → D1** : lier `DB` à la base `cinqnotes`.
  Sans ce binding, la fonction d'inscription renvoie 500 à chaque appel.
- **Custom domains** : ajouter `cinqnotes.com` et `www.cinqnotes.com`.

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
| Domain | `cinqnotes.com` |
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

Ouvrir `https://stats.cinqnotes.com`. Identifiants par défaut : `admin` /
`umami`. **Changer le mot de passe immédiatement** — le tunnel rend cette
instance publique.

Puis **Settings → Websites → Add website** :

| Champ | Valeur |
|---|---|
| Name | Cinq Notes |
| Domain | cinqnotes.com |

Récupérer le **Website ID** affiché : c'est `PUBLIC_UMAMI_ID`.

---

## 6. Variables et secrets GitHub

Settings → Secrets and variables → **Actions**. La distinction compte :

**Onglet « Variables »** — publiques, elles finissent dans le HTML servi. Les
mettre en secret ne protégerait rien et les rendrait illisibles dans les logs.

| Variable | Valeur |
|---|---|
| `SITE_URL` | `https://cinqnotes.com` |
| `PUBLIC_UMAMI_URL` | `https://stats.cinqnotes.com/script.js` |
| `PUBLIC_UMAMI_ID` | l'identifiant de l'étape 5 |
| `PUBLIC_EMAIL_ENDPOINT` | `/api/inscription` |

**Onglet « Secrets »** — jamais affichés, masqués dans les logs.

| Secret | Valeur |
|---|---|
| `CLOUDFLARE_ACCOUNT_ID` | visible dans l'URL du tableau de bord |
| `CLOUDFLARE_API_TOKEN` | le jeton de l'étape 4 |

Tant que `CLOUDFLARE_API_TOKEN` est absent, les jobs de déploiement échouent
mais tout le reste passe : on peut pousser du code avant d'avoir l'infra.

Créer aussi l'environnement `production` (Settings → Environments) si l'on veut
exiger une validation manuelle avant chaque mise en production. Facultatif à ce
stade.

---

## 7. Premier déploiement

```sh
git remote add origin git@github.com:<compte>/cinqnotes.git
git push -u origin main
```

Le pipeline enchaîne : types, doigtés (bloquant) et tests en parallèle → build →
vérification sans JS, parcours Playwright et budget Lighthouse en parallèle →
déploiement.

**Appliquer la migration D1 avant le premier envoi de formulaire :**
Actions → *Migration D1* → Run workflow → `remote`. Sans la table, toutes les
inscriptions échouent — le formulaire n'affiche qu'une erreur générique et
aucune adresse n'est conservée.

Pour diagnostiquer une inscription qui échoue en production :

```sh
npx wrangler pages deployment tail --project-name=cinqnotes
```

La fonction journalise la cause côté serveur sans jamais l'exposer au client.

---

## 8. Contrôles d'après mise en ligne

```sh
# Le sitemap pointe sur le bon domaine
curl -s https://cinqnotes.com/robots.txt

# 34 URL, aucune sur /og
curl -s https://cinqnotes.com/sitemap-index.xml | grep -c "<loc>"

# L'endpoint refuse tout sauf POST
curl -s -o /dev/null -w "%{http_code}\n" https://cinqnotes.com/api/inscription   # 405

# Les parcours passent contre la production
BASE_URL=https://cinqnotes.com npx playwright test

# Budget tenu en conditions réelles, script Umami chargé
npx lighthouse https://cinqnotes.com --view
```

Puis, à la main :

1. S'inscrire avec sa propre adresse **depuis une page d'impro**, et vérifier
   que `source` l'a retenue :
   ```sh
   npx wrangler d1 execute cinqnotes --remote --command "SELECT * FROM inscriptions"
   ```
2. Faire une séance complète depuis un téléphone : cocher un bloc, lancer un
   exercice, changer de tonalité, générer une grille.
3. Ouvrir `https://stats.cinqnotes.com` et vérifier que les événements arrivent :
   `session_start`, `block_complete`, `exercise_play`, `key_change`,
   `impro_generate`, `email_submit`. C'est la dernière ligne de la
   `Definition of done` de `CLAUDE.md §8 phase 0`.

---

## Le site est injoignable — dans quel ordre chercher

Trois questions, dans cet ordre. Chacune élimine une cause, et la première qui
répond « non » est la réponse.

**1. Le pipeline a-t-il seulement déployé ?**
Actions → dernière exécution sur `main`. Si le job `deploiement` est rouge ou
absent, rien n'a été publié — inutile de regarder le DNS. Le job commence par
nommer précisément ce qui manque.

**2. Le projet Pages existe-t-il, avec un déploiement ?**

```sh
npx wrangler pages project list
npx wrangler pages deployment list --project-name=cinqnotes
```

Un projet sans déploiement, ou pas de projet du tout, donne un `522` sur
`cinqnotes.pages.dev`. Le créer : étape 3.

**3. Le domaine est-il rattaché au projet ?**

```sh
dig +short cinqnotes.com A
```

Une réponse vide signifie que le domaine personnalisé n'est pas attaché, même si
la zone existe chez Cloudflare et que les serveurs de noms sont bons. C'est
l'erreur la plus fréquente : acheter le domaine ne le relie pas au projet.
Le rattacher dans **Pages → cinqnotes → Custom domains** (étape 3) ; Cloudflare
crée alors l'enregistrement tout seul.

Vérifier au passage que `cinqnotes.pages.dev` répond, avant de suspecter le
domaine : si l'URL du projet fonctionne et pas le domaine, le problème est au
rattachement ; si aucune des deux ne fonctionne, il est au déploiement.

---

## Ce qui tombe en panne, et ce que ça casse

| Panne | Conséquence |
|---|---|
| Homelab éteint | Aucune mesure. Le site fonctionne normalement : le script est `defer` et `src/lib/mesure.ts` ne fait rien si `window.umami` est absent. |
| Binding D1 absent ou table manquante | Les inscriptions échouent, le formulaire affiche une erreur générique. Le reste du site est intact. |
| Jeton Cloudflare expiré | Le déploiement échoue, la version en ligne reste celle d'avant. |

Aucune de ces pannes n'empêche quelqu'un de faire sa séance — c'est la propriété
qu'il faut préserver à chaque évolution.
