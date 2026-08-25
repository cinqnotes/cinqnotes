# CLAUDE.md — Projet « Roadmap Piano »

> Fichier de contexte pour tout agent (Claude Code, Cowork) travaillant sur ce dépôt.
> Lire intégralement avant toute modification. Les sections **Invariants** et **Anti-objectifs**
> priment sur toute demande d'implémentation qui les contredirait : signaler le conflit, ne pas trancher seul.

---

## 1. Contexte produit

**Quoi.** Un outil web d'accompagnement quotidien pour adultes autodidactes qui apprennent le piano
avec l'objectif d'**improviser et de composer** — pas de reproduire des morceaux.

**Pour qui.** Adulte, autodidacte, niveau débutant à débutant-confirmé. Il connaît approximativement
ses accords majeurs, joue vaguement des deux mains, et se heurte au mur classique : il sait rejouer,
il ne sait pas créer.

**Thèse.** Les grandes applications (Simply Piano, Flowkey, Yousician, Skoove) apprennent toutes à
**reproduire** et perdent leurs utilisateurs en 3 à 6 mois, une fois le stade « je joue une chanson
reconnaissable » atteint. Le segment « je veux improviser et composer » n'a que des outils isolés
(iReal Pro, générateurs de grilles) et aucun parcours structuré. C'est le trou visé.

**Pourquoi on peut gagner.** Les blogs francophones qui occupent la requête « improviser au piano »
publient des articles. Aucun ne propose d'outil interactif. L'avantage n'est pas d'écrire un
meilleur article, c'est de publier l'outil que personne n'a.

**Ce que le produit vend (à terme).** Pas le plan — le plan est gratuit et public. Il vend le
**retour quotidien** : la séance guidée, l'historique personnel, la trace des progrès.

---

## 2. État actuel

**Phase 0 livrée.** Le prototype (`artifact.html.example`, 739 lignes) a été extrait en site Astro :
curriculum typé et testé dans `src/content/curriculum/`, îlots Svelte dans `src/components/`,
34 pages statiques dont les 7 jours de routine et 24 pages de grilles d'impro. Trois défauts du
prototype ont été corrigés au passage — clé de date en UTC (série de jours fausse avant 02:00),
métronome à la dérive et bridé en arrière-plan, `window.storage` inexistant hors artefacts — et une
violation de I1 a été trouvée dans la pentatonique (doigté fixe proposé sur les 12 tonalités).

Le prototype d'origine, pour mémoire, contenait :

- Une routine hebdomadaire complète en **phase pédagogique 1** (mois 1-3), 7 jours, 4 à 5 blocs par jour,
  durée et mode opératoire de chaque exercice.
- Un chronomètre par bloc, qui coche le bloc à l'échéance.
- Un métronome Web Audio (40-140 bpm, accent sur le temps 1).
- **17 exercices animés** : clavier SVG qui joue l'exercice note par note en affichant le numéro de doigt.
- Bascule main droite / main gauche, sélecteur de tonalité, son optionnel, vitesse réglable.
- Journal quotidien, série de jours, progression hebdomadaire, persistés via `window.storage`.

**Ce MVP est le produit de la phase 0.** On ne le réécrit pas : on l'extrait, on le structure, on
le rend référençable. Toute proposition de « repartir proprement sur un framework » avant la
phase 2 est un anti-pattern à refuser.

**Reste à câbler avant mise en ligne :** domaine, Umami (`PUBLIC_UMAMI_URL` / `PUBLIC_UMAMI_ID`),
endpoint de capture e-mail (`PUBLIC_EMAIL_ENDPOINT`), image Open Graph `public/og-clavier.png`.
Tant que ces variables sont vides, le site fonctionne et ne charge aucun tiers.

---

## 3. Invariants

Règles non négociables. Une PR qui en viole une est rejetée, même si elle marche.

### I1 — Aucun doigté de gamme transposé mécaniquement
Le doigté d'une gamme change selon la tonalité (Fa majeur et Si♭ majeur ont le leur). Transposer
un doigté par décalage de demi-tons produit un doigté **faux**, et un mauvais doigté installé
pendant six mois est un dommage réel pour l'utilisateur.
→ Une tonalité n'apparaît dans le sélecteur d'une gamme que si son doigté figure explicitement dans
la table `fing`. Les accords, arpèges et grilles sont transposables (leur doigté est stable).
→ **La pentatonique est une gamme**, pas un accord : elle relève de `fing`, pas de `hands`. Le
prototype la proposait sur les 12 tonalités avec un doigté fixe ; en Mi♭ mineur le pouce tombait
sur une touche noire. Six tonalités retenues (La, Do, Ré, Mi, Fa, Sol).
→ Règle testable qui fait le tri toute seule : **pour tout exercice conjoint** (qui se joue par
degrés voisins, donc où le pouce passe sous la main), **et dans chaque tonalité de `keys`, aucun
doigt 1 ne tombe sur une touche noire.** Elle ne s'applique pas aux accords ni aux arpèges — le
pouce sur une noire y est normal, l'arpège procédant par sauts.
→ Un exercice conjoint doit déclarer `fing`, jamais `hands` : c'est ce qui empêche de réintroduire
une gamme sous forme de doigté fixe transposé.
→ Test bloquant : `test/fingering.spec.ts`, y compris un contrôle de non-vacuité qui vérifie que la
règle rejette bien la définition d'origine du prototype.

### I2 — Le contenu pédagogique est dans le HTML, pas dans le JS
Le SEO est le canal principal. Titres de blocs, descriptions d'exercices, tonalités et durées
doivent être rendus côté serveur en balises réelles (`h2`, `h3`, `ol`, `table`). Le JS hydrate,
il ne génère pas le contenu indexable.
→ Test bloquant : le HTML servi, JS désactivé, contient les 7 jours et tous les intitulés d'exercices.

### I3 — Les médias de l'utilisateur restent locaux par défaut
Audio et vidéo de pratique : capture et stockage sur l'appareil (IndexedDB / OPFS). Aucun envoi
serveur sans action explicite et distincte de l'utilisateur. Le montage mensuel est généré **côté client**.
Motif : coût de bande passante, et surtout exposition RGPD sur des vidéos de personnes filmées chez elles.

### I4 — Aucune partition ni enregistrement sous droits hébergé
Les suites d'accords ne sont pas protégeables — on peut les utiliser librement. Les mélodies, les
partitions et les enregistrements le sont. On ne stocke, ne sert et ne redistribue aucun des trois.
Le répertoire se cite par titre et renvoie vers des sources légitimes.

### I5 — Pas de dark pattern d'abonnement
Résiliation en un clic, pas de paywall avant que l'utilisateur ait pu faire une séance complète,
pas de compte obligatoire pour utiliser le niveau gratuit.

---

## 4. Anti-objectifs

Ce qu'on ne construit **pas**, et pourquoi. À rappeler si une demande dérive vers ces sujets.

| Anti-objectif | Motif |
|---|---|
| **Évaluation** du jeu de l'utilisateur — note juste ou fausse, score, correction, « tu as raté la mesure 4 » | C'est le fossé technique des acteurs à 200 M$ d'ARR. Coût énorme, aucun avantage possible en solo. |
| Bibliothèque de morceaux avec partitions | Droits d'auteur et d'édition. Cf. I4. |
| Application mobile native | Pas avant que les seuils de la phase 1 soient franchis. Un site responsive suffit à valider. |
| Gamification (points, badges, ligues) | Le segment visé est un adulte autodidacte, pas un enfant. Ça abîmerait le positionnement. |
| Multi-instruments | Diluerait la seule chose qui différencie le produit. |
| Capture **vidéo**, et a fortiori stockage vidéo serveur | Cf. I3 — le motif est l'exposition RGPD sur des vidéos de personnes filmées chez elles. Et la vidéo n'apporte que la position des mains, ce qui ne sert que si quelqu'un la corrige : usage de professeur, donc hors périmètre. |
| IA générative de « feedback sur ton jeu » | Sans évaluation, ce serait du vent. Avec, cf. ligne 1. |

### Capter n'est pas évaluer

Cette ligne s'appelait « détection audio ou MIDI du jeu de l'utilisateur ». Lue à la lettre, elle
interdisait d'enregistrer quoi que ce soit. Or le motif écrit à côté — le fossé technique — ne
décrit que l'**évaluation** : juger si la note est la bonne, au bon moment, avec quelle tolérance.

| | Autorisé | Interdit |
|---|---|---|
| **Captation** | Enregistrer le flux audio ou MIDI tel quel | — |
| **Description** | « Tu es resté dans la pentatonique », « tes phrases durent 2 mesures », « tu as utilisé 5 notes sur 12 » | — |
| **Évaluation** | — | « Cette note est fausse », un score, une correction, une comparaison à une référence |

Enregistrer un flux MIDI est une liste d'événements `(note, vélocité, horodatage)` : une centaine de
lignes, aucun modèle, aucun fossé à franchir. L'analyse **descriptive** qui en découle est le
carburant du séquencement adaptatif (§8 phase 3) et ne juge rien.

**La pente à surveiller :** une fois le MIDI en main, la tentation d'ajouter « tu as joué 3 fausses
notes » sera forte. C'est exactement l'anti-objectif. Toute fonctionnalité qui compare le jeu de
l'utilisateur à une référence attendue est refusée, quelle que soit sa simplicité apparente.

---

## 5. Stack cible

Choisie pour recouper les compétences existantes (DevOps/Cloud, Kubernetes, CI, Go/Gin) et
pour minimiser le travail de frontend, qui n'est pas le point fort.

| Couche | Choix | Motif |
|---|---|---|
| Site | **Astro** + îlots Svelte | Statique par défaut → satisfait I2 sans effort. Les îlots isolent l'outil interactif. |
| Styles | CSS natif, variables, pas de framework | Le MVP en a déjà un cohérent. Tailwind n'apporte rien ici. |
| Hébergement (phase 0-1) | **Cloudflare Pages** (arrêté en phase 0) | Gratuit, CDN mondial, TLS. **Pas le homelab** : IP résidentielle, uptime, et un test de distribution ne doit pas échouer pour cause d'infra. |
| Analytics | **Umami** auto-hébergé sur le homelab | Sans cookie, pas de bandeau consentement, données chez soi. |
| API (phase 2+) | **Go + Gin** | Déjà maîtrisé sur un autre projet. Binaire unique, image Docker minimale. |
| Base (phase 2+) | PostgreSQL | |
| Auth (phase 2+) | Lien magique par e-mail | Pas de mot de passe à stocker, friction minimale. |
| Paiement (phase 4) | Stripe Billing | |
| CI/CD | **GitHub Actions** | Le dépôt est sur GitHub. Le déploiement passe par le pipeline et jamais par l'intégration Git native de Cloudflare Pages, qui court-circuiterait le test de doigtés (I1). |
| Registry | Harbor (homelab) pour l'API | |
| Capture e-mail (phase 0-1) | Cloudflare Pages Function + D1 | Aucun tiers, et faite pour mourir proprement quand l'API Go la remplacera. |
| Prod API (phase 2+) | VPS Hetzner ou k8s homelab | À trancher au moment venu selon le trafic réel. |

---

## 6. Modèle de données pédagogique

Source de vérité : `src/content/curriculum/*.ts`, typé, versionné, testé.

```ts
type PitchClass = 0|1|2|3|4|5|6|7|8|9|10|11;   // 0 = Do
type Hand = "MD" | "MG";

/** Un pas d'animation : une ou plusieurs notes jouées ensemble. */
interface Step {
  n: number[];   // intervalles en demi-tons depuis la tonique
  f: number[];   // doigts 1..5, même longueur que n
}

interface Exercise {
  id: string;
  name: string;
  tip: string;             // conseil affiché, HTML autorisé
  ghost: number[];         // intervalles surlignés en fond (gamme/accord de référence)
  root: PitchClass;        // tonique par défaut
  keys: PitchClass[];      // tonalités proposées — cf. I1
  tempo: number;           // ms entre deux pas

  // exclusif : soit un doigté fixe transposable, soit une table par tonalité
  hands?: Partial<Record<Hand, Step[]>>;
  fing?: Partial<Record<PitchClass, Partial<Record<Hand, number[]>>>>;
  scale?: number[];        // requis si `fing` est présent
}

interface Block {
  tag: string;             // "Technique" | "Harmonie" | "Oreille" | "Impro" | "Capture" | ...
  title: string;
  minutes: number;
  how: string[];           // mode opératoire, une puce par consigne
  exerciseId?: string;
}

interface Day {
  weekday: 0|1|2|3|4|5|6;  // 0 = dimanche
  label: string;
  focus: string;
  keyOfDay?: string;
  blocks: Block[];
}

interface Phase {
  id: 1|2|3|4;
  label: string;           // "Fondations", "Vocabulaire", "Langage", "Voix personnelle"
  months: [number, number];
  exitCriteria: string[];  // ce qui autorise à passer à la suivante
  days: Day[];
}
```

**Invariants testés sur ces données :**

1. Toute note d'un `Step` tombe dans la fenêtre clavier `[0, 24]` après transposition, pour chaque
   tonalité de `keys`.
2. `n.length === f.length`, et tout doigt est dans `1..5`.
3. Tout `exerciseId` référencé par un `Block` existe.
4. Si `fing` est présent, `keys` est exactement l'ensemble des clés de `fing` (I1).
5. Si `fing` est présent, chaque tableau de doigté a exactement `scale.length + 1` entrées.
6. La somme des `minutes` d'un jour correspond au total annoncé.

---

## 7. Contenu pédagogique — état et reste à faire

| Phase | Mois | Contenu | État |
|---|---|---|---|
| 1 — Fondations | 1-3 | Triades majeures/mineures + renversements, gammes, pentatonique, pédale de quinte, question-réponse | **Écrit** (dans le MVP) |
| 2 — Vocabulaire | 4-6 | Accords de 7e, voicings MG fondamentale-3-7, ii-V-I, patterns d'accompagnement, développement motivique | À écrire |
| 3 — Langage | 7-12 | Modes, notes-cibles, transcription, réharmonisation, composition structurée | À écrire |
| 4 — Voix personnelle | 13-18 | Relevé de solos, un morceau original fini par mois | À écrire |

Chaque phase suit la même structure : 5 séances de 45 min, 1 séance longue, 1 jour léger.
Le bloc « Impro » n'est jamais optionnel, à aucune phase.

---

## 8. Roadmap d'exécution

### Phase 0 — Publier (objectif : un week-end)

**But.** Mettre l'outil existant en ligne, indexable et mesuré. Rien de plus.

Tâches :

1. Initialiser le dépôt Astro. Extraire `mvp/piano-routine.html` en :
   - `src/content/curriculum/phase1.ts` — les données
   - `src/components/PracticeBoard.svelte` — l'îlot interactif
   - `src/pages/index.astro` — la roadmap rendue en HTML réel (I2)
2. Remplacer `window.storage` par `localStorage` avec repli mémoire. *(`window.storage` n'existe
   que dans l'environnement des artefacts Claude.)*
3. Page « roadmap 18 mois » en contenu statique complet, avec ancres par phase.
4. Umami : déployer sur le homelab, poser le script, définir les événements
   `session_start`, `block_complete`, `exercise_play`, `key_change`, `email_submit`.
5. Capture e-mail — un champ, une promesse **de fonctionnalité** : « préviens-moi quand je pourrai
   enregistrer mes impros et les comparer mois après mois ».
   Stockage : simple table ou service tiers, peu importe à ce stade.
   *La promesse portait auparavant sur la sortie de la phase pédagogique 2. Depuis D9, le contenu
   n'est plus ce qu'on vend : mesurer l'appétit pour lui trancherait les seuils de la phase 1 sur
   le mauvais signal.*
6. Page « à propos » assumant le positionnement : autodidacte qui construit l'outil qu'il voulait
   pour lui-même. Pas de posture d'expert.
7. `robots.txt`, `sitemap.xml`, Open Graph avec capture d'écran du clavier animé.
8. Pipeline GitHub Actions : lint, `test/fingering.spec.ts`, build, budget Lighthouse (perf ≥ 90,
   a11y ≥ 95), déploiement automatique.

**Definition of done.** Page en ligne sur domaine propre, score Lighthouse tenu, HTML complet
JS désactivé, événements Umami visibles dans le dashboard.

---

### Phase 1 — Distribuer et mesurer (8 semaines, temps partiel)

**But.** Savoir si l'outil provoque un retour. Le SEO ne produira rien avant 4 à 6 mois : à ce
stade, le trafic s'amène à la main.

Tâches :

1. Publication ciblée : r/piano, r/pianolearning, groupes Facebook « piano débutant » francophones,
   forum Piano Web, Discord piano, Show HN. Montrer l'outil, ne pas le vendre.
2. Rédiger 3 pages de longue traîne pour amorcer l'indexation :
   « quelle main gauche pour improviser », « pourquoi mes impros sonnent toutes pareil »,
   « improviser sur 4 accords seulement ».
3. Écrire individuellement à chaque e-mail collecté. Une seule question :
   *« qu'est-ce que tu as fait juste après avoir fermé la page ? »*
4. Cible de trafic : 300 à 500 visiteurs uniques sur la période. Suffisant pour trancher.

**Seuils de décision — fixés maintenant, à ne pas renégocier ensuite :**

| Signal | Seuil | Décision |
|---|---|---|
| Séance démarrée | > 25 % des visiteurs | Le concept est lisible |
| Revenus à 2 semaines (série > 1) | 15-25 personnes | Continuer → phase 2 |
| Revenus à 2 semaines | 3-10 personnes | Creuser, interroger, ajuster, reprendre 8 semaines |
| Revenus à 2 semaines | 0-2 personnes | Arrêter, ou changer de cible |

Le seul chiffre qui prédit un abonnement est le retour à deux semaines. Le trafic ne prédit rien.

> **Porte de sortie.** Si le seuil bas est atteint, le projet s'arrête ici. C'est un résultat, pas un
> échec : coût total, un week-end de développement.

---

### Phase 2 — Comptes et contenu (déclenchée seulement si la phase 1 passe)

1. API Go/Gin : lien magique, session cookie `HttpOnly`, synchronisation de l'état de pratique.
2. Migration `localStorage` → serveur, avec fusion de l'état local existant à la première connexion
   (ne jamais perdre la série de jours de quelqu'un — c'est son actif).
3. Rédiger la **phase pédagogique 2** (mois 4-6) : accords de 7e, voicings, ii-V-I, patterns.
4. Nouveaux exercices animés correspondants, mêmes invariants de données.
5. Tableau de bord personnel : historique, tonalités travaillées, temps par axe.

**Découpage gratuit / payant retenu :** tout le curriculum est gratuit, à toutes les phases (D8).
Ce qui se vend, c'est la boucle quotidienne (D9), et la ligne passe à la mémoire dans le temps (D11).

> Cette section disait auparavant « phases 2 à 4 payantes ». C'était en contradiction directe avec
> le §1 (« vend le retour quotidien, pas le plan »), et ça revenait à mettre un paywall sur le seul
> actif d'acquisition du projet. Corrigé au moment de la phase 0.

---

### Phase 3 — Capture et montage mensuel

**L'audio est le plancher, le MIDI est le bonus. La vidéo est hors périmètre** (cf. §4).

1. Enregistrement audio via `MediaRecorder` (Opus, ~5 Mo pour 20 min), rattaché au bloc en cours.
   Marche pour tout le monde — piano acoustique ou numérique, sur tous les appareils, sans câble.
   C'est le seul chemin qui couvre 100 % de l'audience, donc c'est celui qui porte la fonctionnalité.
2. Stockage local (IndexedDB / OPFS), quota surveillé, purge explicite par l'utilisateur.
3. **Captation MIDI optionnelle**, proposée seulement si `navigator.requestMIDIAccess()` détecte un
   appareil. 20 à 60 Ko pour 20 min, aucune donnée personnelle — ni image, ni voix, ni bruit de fond.
   Débloque pour ces utilisateurs : rejeu de l'impro sur le clavier animé, statistiques descriptives
   de notes, et un montage reproductible (même son au mois 1 et au mois 3, donc la comparaison porte
   sur le jeu et non sur la qualité du micro).
   → **À vérifier au moment d'implémenter :** le support de Web MIDI dans Safari. S'il manque encore,
   tout iOS est exclu (tous les navigateurs y sont WebKit) — raison de plus pour que l'audio porte
   la fonctionnalité et que le MIDI reste un supplément.
   → Captation et description seulement, jamais d'évaluation (§4).
4. **Montage mensuel** généré côté client : `ffmpeg.wasm` ou WebCodecs, assemblant les extraits du
   mois avec date et tonalité travaillée. Export en fichier, partage à l'initiative de l'utilisateur.
5. Écran « il y a 3 mois / aujourd'hui » sur le même exercice — le mécanisme avant/après.
6. **Séquencement adaptatif**, à partir de l'historique de blocs cochés — pas du contenu audio :
   « tu évites Fa et Si♭ depuis six semaines, ce sont les deux gammes au doigté différent »,
   « ton bloc Impro est coché 40 % du temps contre 85 % pour la technique ».
   C'est la couche qui transforme un suivi en produit, et elle ne demande aucune détection.

C'est la fonctionnalité de réengagement et le principal levier de partage. Elle ne se construit
qu'une fois la rétention prouvée : sans retour quotidien, il n'y a rien à monter.

> **Si un upload serveur devait exister un jour** (ce n'est pas prévu, I3 dit local par défaut) :
> URL présignée directement vers du stockage objet (R2, S3). Jamais à travers l'API Go — sinon la
> bande passante est payée deux fois et le VPS devient le goulot.

---

### Phase 4 — Monétisation

**Ne pas miser sur l'abonnement seul.** Deux sources à court terme, dans cet ordre d'arrivée.

**Source 1 — un parcours borné payant.** « 90 jours pour improviser », 90 à 150 €, achat unique.
Convertit tôt, correspond à la façon dont le marché francophone du piano achète réellement, et ne
demande pas d'atteindre un seuil d'abonnés maintenus. C'est la première chose à tester.

**Source 2 — l'abonnement**, pour l'outil continu. **6 à 8 €/mois**, et non 12-15 comme envisagé
initialement : sur un segment autodidacte, on vise la durée d'abonnement, pas la marge unitaire, et
un prix bas réduit la friction d'entrée.

1. Stripe Billing, mensuel et annuel.
2. Essai de 14 jours (les essais longs convertissent mieux dans l'éducation, où l'utilisateur a
   besoin de plusieurs sessions pour évaluer).
3. Portail client, résiliation en un clic (I5).

**L'arithmétique, pour ne pas la refaire :** à 12 €/mois, dégager 1 000 €/mois net demande environ
**130 abonnés payants simultanés**, churn compris — soit, à 3-5 % de conversion, plusieurs milliers
de visiteurs engagés, donc 12 à 18 mois de SEO. Un parcours à 120 € vendu 100 fois rapporte
12 000 € et atteindre 100 ventes est nettement plus accessible que maintenir 130 abonnés. C'est
aussi pourquoi deux applications à abonnement en solo ne tiennent pas (§10, arbitrage Papyrus).

**Le canal enseignants reste en phase 5.** Son économie est la meilleure des trois — un professeur
amène quinze élèves, et la pédagogie se trouve co-signée par quelqu'un dont c'est le métier, ce qui
règlerait §10. Décision de l'auteur : c'est une amélioration de très long terme, on ne la remonte
pas dans le plan. À rouvrir si la conversion des sources 1 et 2 déçoit.

---

### Phase 5 — Échelle

- Cluster SEO : 15 à 20 pages de blocages précis, maillées vers la roadmap.
- Canal enseignants : un professeur amène ses élèves, le coût d'acquisition s'effondre.
  C'est le modèle de Tonara et Modacity.
- Empaquetage mobile (Capacitor) seulement si les données d'usage montrent une majorité mobile.
- Rédaction des phases pédagogiques 3 et 4.

---

## 9. Décisions déjà prises

| # | Décision | Motif |
|---|---|---|
| D1 | La roadmap est gratuite et publique | C'est l'actif d'acquisition. On vend le retour quotidien, pas le plan. |
| D2 | Le MVP HTML est le produit de la phase 0 | Pas de réécriture avant validation. |
| D3 | Cible : adulte autodidacte visant improvisation et composition | Segment mal servi, et c'est le besoin réellement compris. |
| D4 | Français d'abord | Marché moins disputé que l'anglophone, et langue maternelle du contenu. |
| D5 | Pas de détection audio/MIDI | Fossé technique inatteignable en solo. **Précisé par D13 :** c'est l'*évaluation* du jeu qui est exclue, pas la captation. |
| D6 | Astro plutôt que SvelteKit en phase 0 | Statique par défaut, donc I2 gratuit. Migration possible si l'API impose du SSR. |
| D7 | Hébergement public hors homelab | Le homelab ne garde qu'Umami (et Harbor pour la future API). La CI et les prévisualisations sont chez GitHub et Cloudflare : un test de distribution ne doit pas échouer pour cause d'IP résidentielle. |
| D8 | Le curriculum reste entièrement gratuit et public, toutes phases confondues | C'est l'actif d'acquisition et le seul canal SEO. Le paywaller reviendrait à cacher ce qui fait venir les gens — et une suite d'exercices se recopie en dix minutes. |
| D9 | La monétisation portera sur la **boucle quotidienne** (suivi d'habitude, historique, capture, montage mensuel, synchro), jamais sur le contenu | Vendre un outil ne demande aucune légitimité pédagogique ; vendre une pédagogie qu'on n'a pas parcourue en demande une. Ça résout la question ouverte §10 au lieu de la reporter. |
| D10 | Le générateur d'impro est le point d'entrée du tunnel, la routine est la couche de rétention | Le trafic froid n'est pas assis devant un piano. Une routine seule n'a rien à offrir à qui découvre le site depuis son téléphone. |
| D11 | La ligne gratuit/payant passe à la **mémoire dans le temps** | Gratuit et sans limite : la séance du jour entière (blocs, chrono, métronome, doigtés animés, journal) — I5 l'impose. Payant : historique long, statistiques par axe et par tonalité, synchro multi-appareils, enregistrements, montage mensuel, comparaison « il y a 3 mois / aujourd'hui ». C'est aussi la seule part qui coûte réellement à faire tourner, donc la ligne est défendable devant l'utilisateur. |
| D12 | Le produit ne se présente jamais comme « un tracker de pratique » | Modacity et Tonara occupent déjà cette case, la disposition à payer y est faible, et un tracker nu se remplace par un carnet. L'argument de vente est la **preuve du progrès**, pas la mesure de l'effort. |
| D13 | La captation est autorisée, l'**évaluation** reste interdite | Le motif de l'anti-objectif (fossé technique à 200 M$ d'ARR) ne décrit que l'évaluation. Enregistrer un flux MIDI coûte cent lignes et ne franchit aucun fossé. Cf. §4, « Capter n'est pas évaluer ». |
| D14 | Capture : audio pour tous, MIDI en supplément, vidéo jamais | L'audio est le seul chemin qui couvre 100 % de l'audience (pianos acoustiques, iOS). Le MIDI apporte le rejeu et l'analyse descriptive à ceux qui ont le matériel. La vidéo n'apporte que la position des mains — usage de professeur — pour une exposition RGPD disproportionnée (I3). |
| D15 | Deux sources de revenus, pas une : un parcours borné d'abord, l'abonnement ensuite à 6-8 € | 130 abonnés maintenus est un seuil bien plus dur que 100 ventes uniques, et le marché francophone du piano achète des formations. Cf. §8 phase 4. |
| D16 | Ce qui justifie l'abonnement n'est pas l'enregistrement, c'est la **mémoire + le séquencement adaptatif** | L'enregistrement seul se remplace par un dictaphone et son effet émotionnel s'émousse. Ce qui ne se remplace pas, c'est un historique long qui sait dire quoi travailler ensuite — et ça se calcule sur des cases cochées, sans aucune détection. |

---

## 10. Questions ouvertes

- **Crédibilité pédagogique.** L'auteur est débutant au piano. Vendre une pédagogie qu'on n'a pas
  encore parcourue est un risque réel, et les avis d'utilisateurs sont impitoyables là-dessus.
  Contournement à instruire dès la phase 2 : co-signature du contenu par un professeur de piano —
  ce qui règle du même coup le canal de distribution. À trancher avant toute monétisation.
- **Arbitrage de portefeuille.** Un autre projet d'application à abonnement (Papyrus) est en cours.
  Deux applications à abonnement en solo, ce n'est pas tenable. Les phases 0 et 1 ne forcent pas
  l'arbitrage — la phase 2, si.
- Nom et domaine : non arrêtés.
- Statut juridique pour l'encaissement : à régler avant la phase 4, pas avant.

---

## 11. Conventions

- **Commits** : Conventional Commits. Portée = phase, ex. `feat(p0): extraction du curriculum en TS`.
- **Branches** : `main` protégée, déploiement automatique. Une branche par tâche.
- **Tests** : Vitest pour les données et la logique musicale, Playwright pour le parcours de séance.
  `test/fingering.spec.ts` est bloquant en CI et ne se contourne jamais.
- **Accessibilité** : navigation clavier complète sur l'outil, `prefers-reduced-motion` respecté,
  contrastes AA. Une partie des utilisateurs pratique le soir, en faible luminosité.
- **Langue** : interface et contenu en français. Code, commits et commentaires en français également,
  pour rester cohérent avec le domaine (les noms de notes le sont).

---

## 12. Glossaire — à respecter dans le code et le contenu

| Terme | Sens | Piège fréquent |
|---|---|---|
| Tonique | Note fondatrice de la tonalité | Ne pas confondre avec la première note jouée |
| Doigté | Numéro de doigt, 1 = pouce … 5 = auriculaire | Identique aux deux mains : 1 est toujours le pouce |
| Renversement | Même accord, note grave différente | Ne change pas l'accord, change sa couleur |
| Voicing | Disposition concrète des notes d'un accord | Notion de la phase 2, pas de la phase 1 |
| Degré | Position d'un accord dans la tonalité (I, ii, V…) | Majuscules = majeur, minuscules = mineur |
| Grille | Suite d'accords d'un morceau | Non protégeable par le droit d'auteur — cf. I4 |
| Pentatonique | Gamme de 5 notes | En La mineur : uniquement des touches blanches |

---

## 13. Références utilisées pour la conception

- Méthode : convergence de PianoGroove, Piano With Jonny, improviseraupiano.com,
  deschansonsauboutdesdoigts.com — séance découpée en blocs courts, régularité prioritaire sur la durée,
  contrainte créative, transcription comme source de vocabulaire.
- Concurrence : Simply (~200 M$ ARR), Yousician (~20 M utilisateurs actifs mensuels), Flowkey, Skoove,
  Piano Marvel. Tous positionnés sur la reproduction de morceaux.
- Adjacents à surveiller : Modacity et Tonara (journal de pratique, comparaison d'enregistrements,
  canal enseignants). Ce sont les concurrents réels de la phase 3, pas les géants.