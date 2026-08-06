# Maintenance Guide — PERF'EXHAUST

Guide pratique pour maintenir et faire évoluer le site sans risque.
Chaque section indique **le fichier exact** à modifier et un exemple concret.

---

## 🚀 Lancer le projet en local

```bash
git clone https://github.com/BOZYILDIZ/perf-exhaust.git
cd perf-exhaust
npm install
cp .env.example .env.local   # facultatif — le site fonctionne sans
npm run dev                  # http://localhost:3000
```

## 📦 Déployer

Le déploiement est automatique : chaque `git push origin main` déclenche un build Vercel (~30 s).

```bash
git add <fichiers>
git commit -m "description du changement"
git push origin main
```

Vérifier ensuite sur https://vercel.com (projet `perfexhaust`) que le statut est **Ready**,
puis contrôler https://perfexhaust.fr.

---


## 🛠️ Panel admin & base de données

### Accéder à l'admin

L'admin vit sur **`/admin`** (login : `/admin/login`). Trois variables l'activent :

```env
ADMIN_EMAIL=vous@perfexhaust.fr
ADMIN_PASSWORD=un-mot-de-passe-fort
ADMIN_SECRET=$(openssl rand -hex 32)   # signature des sessions (cookie httpOnly)
```

Sans ces variables, `/admin` redirige vers le login qui explique la configuration.
Le mot de passe ne transite jamais côté client ; les sessions durent 12 h ;
le login est limité à 5 tentatives/minute/IP.

### Activer la base de données (réalisations dynamiques)

1. Créer une base **PostgreSQL** — [Neon](https://neon.tech) (gratuit) ou Vercel Postgres.
2. Renseigner `DATABASE_URL` (local : `.env.local` ; prod : variables Vercel).
3. Appliquer le schéma : `npx prisma migrate deploy`
4. Importer les 15 réalisations historiques : `npm run db:seed`
   (idempotent — les slugs déjà présents sont ignorés, aucune perte SEO).

**Sans `DATABASE_URL`**, le site public lit `src/data/projects.ts` comme avant :
rien ne casse, l'admin affiche simplement la marche à suivre.

### Images des réalisations — comportement

Une image est affichée sur le site public **uniquement si son URL est en
`http(s)`** (upload Vercel Blob ou URL externe). Les chemins relatifs
historiques (`/images/projects/...`) gardent le placeholder premium.
Dès qu'un projet a une image principale ou des images de galerie réelles :
- la carte de la galerie publique affiche la photo de couverture ;
- la page projet affiche le visuel principal + une **lightbox**
  (clic, flèches clavier, swipe mobile, Échap) ;
- l'image Open Graph du projet devient sa photo (partages sociaux).
Les champs SEO du formulaire admin (meta title/description, OG image)
sont directement utilisés par la page publique — l'aperçu Google du
formulaire montre le rendu.

### Gérer les réalisations

- **Ajouter** : `/admin/realisations/new` — le slug se génère depuis le titre
  (modifiable, format vérifié : minuscules-tirets).
- **Modifier** : bouton crayon dans la liste. **Prévisualiser** ouvre la page
  publique (les brouillons s'ouvrent avec `?preview=1`, réservé à la session admin).
- **Publier / brouillon** : boutons de statut en haut du formulaire. Un
  brouillon est invisible du public, absent du sitemap et non indexable.
- **Dupliquer** : icône copie dans la liste — crée un **brouillon**
  (`slug-copie`) pré-rempli et ouvre son édition. Idéal pour les projets similaires.
- **Supprimer** : corbeille + confirmation. Irréversible.
- Les pages publiques se mettent à jour en ≤ 60 s (ISR) après chaque action.

### Upload d'images (Vercel Blob)

1. Vercel → Storage → **Blob** → créer un store.
2. Copier `BLOB_READ_WRITE_TOKEN` dans les variables (local + Vercel).
3. Les boutons d'upload de l'admin deviennent actifs (JPEG/PNG/WebP, 5 Mo max,
   alt obligatoire pour la galerie).

Sans token : message clair en admin, et les champs acceptent des URLs manuelles.

### Commandes utiles

```bash
npm run db:migrate   # applique les migrations (prod : à lancer après déploiement)
npm run db:seed      # importe les projets historiques (idempotent)
npm run db:studio    # explorer la base (Prisma Studio)
```

## 🧾 Intégration Pennylane — devis & factures

**Principe non négociable : Pennylane est la source unique pour les devis et
les factures officiels.** PERF'EXHAUST ne génère jamais de devis complet — le
panel `/admin/devis` reste un CRM de demandes : il consulte le statut et le
lien Pennylane (ou aide à y transférer l'information), il ne construit rien.
Prix, envoi au client, acceptation et facturation se font **exclusivement
dans Pennylane**, quel que soit le mode ci-dessous.

### Deux modes, un seul principe

L'API Pennylane n'est disponible qu'à partir d'un abonnement payant. Le site
s'adapte automatiquement au plan Pennylane du client via `PENNYLANE_MODE` :

| `PENNYLANE_MODE` | Comportement |
|---|---|
| `manual` | **Plan gratuit Pennylane (sans API).** Mode par défaut si `PENNYLANE_API_KEY` est absente — aucune configuration requise. |
| `api` | **Abonnement Pennylane avec accès API.** Automatique si `PENNYLANE_API_KEY` est présente et `PENNYLANE_MODE` n'est pas forcé sur `manual`. |

Le code des deux modes coexiste dans `src/lib/pennylane/` — **rien n'est
supprimé** quand le client repasse au plan gratuit : mettre `PENNYLANE_MODE=api`
et poser `PENNYLANE_API_KEY` suffit à réactiver la création automatique le
jour où l'abonnement le permet.

### Mode manuel (plan gratuit, par défaut)

```
Client envoie /rendez-vous
  → demande enregistrée dans QuoteRequest (CRM PERF'EXHAUST), statut
    Pennylane manuel initialisé à "À créer dans Pennylane"
  → emails Resend envoyés (atelier + confirmation client), comme avant
  → AUCUN appel réseau vers Pennylane (le plan gratuit n'a pas d'API)
```

Sur `/admin/devis/[id]`, le bloc **« Pennylane manuel »** remplace la section
API, avec deux boutons volontairement séparés (voir "Pourquoi deux boutons"
ci-dessous) :
- **« Copier les informations »** : copie dans le presse-papiers un texte
  prêt à coller (nom, email, téléphone, véhicule, motorisation, type de
  projet, sonorité souhaitée, message client, ligne suggérée *"Échappement
  sur mesure — prix à compléter"*, TVA 20 %). Message affiché : *« Informations
  copiées. Ouvrez Pennylane puis collez-les dans la description du devis. »*
  Si la copie automatique est bloquée par le navigateur, une zone de texte
  avec le contenu prérempli et pré-sélectionné apparaît, avec un bouton
  *« Copier à nouveau »* pour retenter.
- **« Ouvrir Pennylane »** : ouvre dans un nouvel onglet l'URL configurée
  dans `/admin/settings` (§ Pennylane) — idéalement un lien direct vers la
  création de devis si Pennylane en expose un un jour, sinon
  `https://app.pennylane.com/` par défaut. Message affiché : *« Pennylane est
  ouvert dans un nouvel onglet. Collez les informations dans la description
  du devis. »*

Aucune API, aucun scraping, aucune automatisation du navigateur, aucune
donnée injectée dans Pennylane : c'est l'admin qui colle et chiffre
lui-même.

**Pourquoi deux boutons séparés (et pas un clic combiné copie + ouverture) :**
`window.open()` déplace le focus du navigateur vers le nouvel onglet. Si un
appel `navigator.clipboard.writeText()` est encore en attente à ce moment,
certains navigateurs (Chrome en particulier) le rejettent avec
`NotAllowedError: Document is not focused` — la copie échouait donc de façon
intermittente selon la rapidité du changement de focus, indépendamment du
code applicatif. Séparer copie et ouverture en deux clics distincts élimine
cette concurrence : chaque action reste un geste utilisateur direct, sans
navigation en cours, ce qui rend la copie fiable à 100 %.

- statut manuel modifiable : À créer dans Pennylane → Devis créé → Devis
  envoyé → Devis accepté / refusé → Facture créée → Payé ;
- champs optionnels numéro de devis et lien Pennylane, à renseigner après
  avoir créé le devis à la main dans Pennylane.

Ce statut et ces champs sont purement déclaratifs — l'admin les met à jour
lui-même après chaque étape faite dans Pennylane. `/admin/devis` affiche le
statut CRM, le statut Pennylane manuel et le numéro de devis (si renseigné)
en un coup d'œil.

### Mode API (abonnement avec accès API)

```
Client envoie /rendez-vous
  → demande enregistrée dans QuoteRequest (CRM PERF'EXHAUST)
  → emails Resend envoyés (atelier + confirmation client), comme avant
  → SI PENNYLANE_API_KEY configurée ET mode=api : brouillon Pennylane créé
      automatiquement (client retrouvé/créé + devis avec une ligne générique
      0 € HT "Échappement sur mesure — prix à définir après analyse")
  → résultat (ID, numéro, lien) sauvegardé sur la demande
  → le client voit toujours "Demande envoyée avec succès", même si
    l'étape Pennylane échoue (jamais visible côté public)
```

Le devis Pennylane embarque dans sa description tout ce que l'atelier a
besoin de savoir sans rouvrir le CRM : nom, téléphone, email, véhicule,
motorisation, type de projet, sonorité souhaitée, message du client, et la
mention *« Prix à compléter dans Pennylane après analyse »*. Aucun prix
définitif n'est jamais inventé par le site.

### Créer une clé API Pennylane (mode `api` uniquement)

1. Se connecter à Pennylane avec un compte **Cadre dirigeant, Comptable
   interne ou externe** (plan Essential ou supérieur requis).
2. Aller dans **Management → Settings → Connectivity → Developers**.
3. Cliquer **« Generate an API Token »**.
4. Nom : par exemple « Site web — devis ». Permissions : **« Read and
   write »**. Expiration : au choix (12 mois recommandé, à renouveler).
5. **Copier le token immédiatement** — Pennylane ne le montre qu'une fois et
   ne le stocke pas ; en cas de perte, il faut en générer un nouveau.

### Variables à poser sur Vercel

```
PENNYLANE_MODE=api
PENNYLANE_API_KEY=<le token généré ci-dessus>
```

`PENNYLANE_MODE` est **optionnelle** : ne la poser que pour forcer un mode
explicitement (ex. `manual` pour repasser au plan gratuit sans retirer une
clé API laissée dans l'environnement). Sans elle, le mode se déduit de la
présence de `PENNYLANE_API_KEY`.

`PENNYLANE_BASE_URL` et `PENNYLANE_COMPANY_ID` sont **optionnelles** — à
n'ajouter que si Pennylane l'exige explicitement pour votre configuration
(sandbox de test, compte cabinet comptable multi-entreprises). Un compte
« Company API » standard n'en a pas besoin : le token est déjà rattaché à
une seule entreprise.

Sans `PENNYLANE_API_KEY` (ou avec `PENNYLANE_MODE=manual`) : la demande est
enregistrée normalement, les emails partent normalement, et
`/admin/devis/[id]` affiche le bloc **« Pennylane manuel »** — rien ne casse
ailleurs sur le site.

### Comment tester l'intégration

**Mode manuel (par défaut, aucune variable à poser) :**
1. Soumettre une demande réelle via `/rendez-vous`.
2. Ouvrir la demande sur `/admin/devis/[id]` — le bloc **« Pennylane
   manuel »** affiche le statut *« À créer dans Pennylane »*.
3. Cliquer **« Copier les informations »**, puis **« Ouvrir Pennylane »** —
   un nouvel onglet Pennylane s'ouvre et le texte prêt à coller doit être
   dans le presse-papiers — coller (Cmd/Ctrl+V) dans la description du devis
   pour vérifier qu'il contient bien toutes les informations client/véhicule/projet.
4. Créer le devis à la main dans Pennylane (en y ajoutant les prix), puis
   revenir mettre à jour le statut, le numéro et le lien depuis l'admin.

**Mode API (abonnement avec accès API) :**
1. Poser `PENNYLANE_API_KEY` (et `PENNYLANE_MODE=api` si besoin de forcer).
2. Soumettre une demande réelle via `/rendez-vous`.
3. Ouvrir la demande correspondante sur `/admin/devis/[id]` — la section
   « Devis Pennylane » doit afficher le statut **« Brouillon créé »**, l'ID
   Pennylane, le numéro si Pennylane le renvoie, et un bouton
   **« Ouvrir dans Pennylane »**.
4. Vérifier dans Pennylane que le client et le devis existent, avec la
   description pré-remplie.

### Comment réessayer une synchronisation en échec

Si la création automatique échoue (réseau, quota, donnée refusée par
Pennylane...), la demande reste enregistrée normalement — seul le statut
Pennylane passe à **« Erreur »**, avec le message exact de Pennylane affiché
dans `/admin/devis/[id]`. Cliquer **« Réessayer la création du brouillon »**
relance la même tentative (`POST /api/admin/quote-requests/[id]/pennylane/retry`).
Une fois un brouillon créé avec succès, le bouton disparaît définitivement
pour cette demande — impossible de recréer un doublon depuis le panel.

### Que faire si Pennylane échoue durablement

- Vérifier que `PENNYLANE_API_KEY` est toujours valide (un token peut
  expirer ou être révoqué).
- Lire le message d'erreur affiché dans l'admin — il reprend le détail
  exact renvoyé par Pennylane (souvent une adresse de facturation
  manquante, voir limite ci-dessous).
- Compléter manuellement le client/devis directement dans Pennylane si
  besoin, puis ignorer le bouton « Réessayer » pour cette demande (il ne
  fait que relancer une création automatique, pas une synchronisation).

### Pourquoi les prix ne sont pas gérés dans le panel PERF'EXHAUST

Le site fonctionne en « prix sur devis » : chaque projet est unique et
nécessite une analyse avant chiffrage. Dupliquer un outil de devis/facture
dans PERF'EXHAUST créerait deux sources de vérité (site + Pennylane) avec
un risque réel d'incohérence comptable. Le panel reste donc volontairement
un **CRM de demandes** — chiffrage, envoi, acceptation et facturation se
font uniquement dans Pennylane, l'outil déjà utilisé par l'atelier pour sa
comptabilité.

### Limites connues

- **Adresse de facturation** : d'après le schéma OpenAPI officiel de
  `POST /company_customers`, `billing_address` est obligatoire et, s'il est
  fourni, ses 4 champs (`address`, `postal_code`, `city`, `country_alpha2`)
  sont TOUS requis ensemble — il n'existe pas de champ générique "country".
  Notre formulaire ne collecte aucune adresse postale ; plutôt que d'inventer
  une rue/un code postal/une ville (donnée fausse dans la comptabilité de
  l'atelier), l'intégration envoie uniquement `{ country_alpha2: "FR" }`
  (voir `src/lib/pennylane/billing-address.ts`). Si le compte Pennylane
  applique la contrainte du schéma à la lettre, la création du client peut
  donc encore échouer en 422 — le message exact de Pennylane (champs
  manquants) s'affiche alors dans l'admin, avec un bouton "Réessayer" ; il
  faut compléter l'adresse du client directement dans Pennylane. Si une
  adresse réelle devient un jour disponible (champ ajouté au formulaire),
  elle est utilisée intégralement à la place de ce repli minimal.
- **Format de réponse du devis créé** : Pennylane ne documente pas
  intégralement les champs retournés à la création (numéro de devis, URL
  publique consultable par le client). Le code lit ces champs de façon
  défensive : s'ils sont absents de la réponse, seul l'ID Pennylane est
  affiché (toujours suffisant pour retrouver le devis dans Pennylane).
- **Pas d'envoi automatique** : le devis est créé dans l'état par défaut de
  Pennylane (brouillon) — cette intégration n'appelle jamais l'endpoint
  d'envoi. L'atelier reste responsable de la relecture finale et de l'envoi
  au client depuis Pennylane.
- **Limite de débit Pennylane** : environ 5 requêtes/seconde. Les erreurs
  429 sont automatiquement réessayées une fois pour les lectures (recherche
  de client), jamais pour les créations (pour ne jamais créer de doublon).
- **Modèle `QuoteLine` supprimé** : une version précédente permettait de
  préparer des lignes de devis localement avant envoi manuel à Pennylane.
  Cette table était vide en production (vérifié avant suppression) — elle
  a été supprimée proprement (migration `20260707090000_drop_quoteline`)
  avec toute l'UI et les routes associées, pour que PERF'EXHAUST reste un
  CRM simple et non un second outil de devis.

## 🔌 Intégration Pennylane API v2 (synchronisation client automatique)

**Statut (2026-07-25) : Phase A implémentée et validée. Phase B exécutée
partiellement** — l'extension Chrome et le bouton "Préparer Pennylane" ont
été supprimés ; le mode manuel presse-papiers (`PennylaneManualSection`) et
l'ancien mode API v1 (`src/lib/pennylane/`) restent en place, non touchés
(voir § "Transition").

Contrairement à l'ancienne intégration (`src/lib/pennylane/`, hypothèses
jamais vérifiées contre un vrai compte), cette couche (`src/lib/pennylane-v2/`)
a été construite et testée directement contre la documentation officielle
vérifiée (pennylane.readme.io) puis contre un vrai compte Pennylane avec
permissions réelles.

### Ce qu'elle fait

À chaque demande reçue via `/rendez-vous` :
1. La demande est enregistrée dans `QuoteRequest` (**toujours en premier,
   priorité absolue** — jamais perdue si Pennylane est indisponible).
2. Le client est recherché dans Pennylane (jamais créé en double) :
   1. identifiant Pennylane déjà connu localement pour cette personne
      (autre demande déjà synchronisée, même email/téléphone) ;
   2. e-mail normalisé (`filter=[{"field":"emails","operator":"in",...}]`,
      seul champ réellement filtrable côté serveur — voir limites) ;
   3. téléphone normalisé (Pennylane n'expose aucun filtre serveur sur le
      téléphone — parcours borné de la liste des clients, voir limites) ;
   4. nom/prénom **en dernier recours, jamais choisi automatiquement** —
      toute correspondance par nom déclenche `AMBIGUOUS`, jamais un choix
      silencieux.
3. Si aucune correspondance : création d'un client individuel
   (`POST /individual_customers`).
4. Si plusieurs correspondances : statut `AMBIGUOUS`, candidats affichés
   dans `/admin/devis/[id]` — **aucune création automatique tant que
   l'admin n'a pas choisi manuellement**.
5. Le résultat (identifiant, statut, erreur, dates) est stocké sur la
   demande — jamais montré au client public, uniquement dans le panel admin.

Elle récupère aussi, à l'ouverture de la fiche admin (avec cache — voir
§ "Cache"), les devis et factures Pennylane du client synchronisé.

**Elle ne crée jamais de devis ni de facture** — volontairement, tant que
le mapping lignes/TVA/prix/produits n'a pas été validé (voir mission
d'origine). Le bouton "Créer un devis Pennylane" n'existe pas encore.

### Fichiers

```
src/lib/pennylane-v2/
  config.ts             Token, URL de base, TTL cache, timeout (tous lisibles/surchargeables via env)
  types.ts               Types des réponses API v2 (clients, devis, factures)
  errors.ts               PennylaneApiError / PennylaneTimeoutError / PennylanePreconditionError
  http-client.ts           Client HTTP centralisé : auth, timeout, retry 429/5xx (GET only), pagination
  filter.ts                Construction du paramètre `filter` (tableau JSON documenté)
  normalize.ts             Normalisation email/téléphone FR/nom pour la déduplication
  billing-address.ts       Adresse de facturation (client ou repli atelier — voir limites)
  customers.ts             Recherche (email/téléphone) + création client
  quotes.ts / invoices.ts   Récupération devis/factures d'un client + dérivation de statut d'affichage
  format.ts                 Formats FR (montants, dates)
  cache.ts                  TTL du cache devis/factures
  web-links.ts               "Ouvrir dans Pennylane" (voir limites — pas de format d'URL documenté)
  sync.ts                    Orchestration complète (recherche → dédup → création → écriture DB)
  financials.ts               Lecture devis/factures avec cache (voir § Cache)

src/components/admin/PennylaneV2Section.tsx   Section admin (statut, résumé, tableaux devis/factures)
src/app/api/admin/quote-requests/[id]/pennylane-v2/
  sync/route.ts              Relancer la synchronisation (bouton "Relancer")
  resolve-ambiguity/route.ts  Choisir manuellement le bon client (statut AMBIGUOUS)
  financials/route.ts         Actualiser les devis/factures (bouton "Actualiser", contourne le cache)
```

### Variables d'environnement

```
PENNYLANE_API_TOKEN=            # Token "Company API" — scopes requis : customers, quotes, customer_invoices (lecture + écriture)
```

`PENNYLANE_FALLBACK_ADDRESS`/`_POSTAL_CODE`/`_CITY` ont été supprimées le
2026-08-07 : l'adresse de facturation vient désormais du formulaire
`/rendez-vous` (voir "Limites connues" ci-dessous).

Génération du token : Pennylane → **Management → Settings → Connectivity →
Developers → Generate an API Token** — cocher les 3 scopes ci-dessus en
lecture ET écriture. Le token n'est affiché qu'une fois : le copier
immédiatement. Posé uniquement sur Vercel (Production, Development — jamais
Preview sans accord explicite) et dans `.env.local`, jamais commité.

**Procédure de rotation du token :** générer un nouveau token dans
Pennylane (les anciens tokens continuent de fonctionner jusqu'à révocation
explicite ou expiration), le poser sur Vercel (`vercel env add
PENNYLANE_API_TOKEN production` — **toujours via une valeur lue depuis un
fichier ou passée par stdin, jamais en argument littéral de commande**),
redéployer, vérifier `/admin/devis/[id]` sur une demande synchronisée
(bouton "Actualiser"), puis révoquer l'ancien token dans Pennylane.

### Endpoints Pennylane API v2 réellement utilisés

Vérifiés contre pennylane.readme.io (juillet 2026) puis contre un vrai
compte — voir § "Test réel" du rapport de mission pour le détail complet.

| Endpoint | Usage |
|---|---|
| `GET /customers?filter=...` | Recherche par e-mail (`in`) ; parcours paginé pour le téléphone |
| `GET /customers/{id}` | Relecture d'un client (affichage admin) |
| `POST /individual_customers` | Création — jamais réessayée automatiquement (non idempotent) |
| `GET /quotes?filter=[{"field":"customer_id","operator":"eq",...}]` | Devis d'un client |
| `GET /customer_invoices?filter=...` | Factures d'un client |

Authentification : `Authorization: Bearer <token>`. Pagination par curseur :
`{ items, has_more, next_cursor }` — le filtre doit être renvoyé à chaque
page (le curseur seul ne le conserve pas).

### Stratégie anti-doublons

Voir § "Ce qu'elle fait" ci-dessus pour l'ordre exact. Points clés :
- La recherche a TOUJOURS lieu avant toute création, y compris lors d'une
  relance manuelle après échec — aucun risque de doublon même après
  plusieurs tentatives.
- Une correspondance par nom, même unique, ne sélectionne jamais
  automatiquement — c'est le seul critère de la mission explicitement
  interdit comme critère automatique.
- Sans table `Client` locale dédiée (décision produit du 2026-07-25 — le
  schéma actuel garde les champs sur `QuoteRequest`), le critère "identifiant
  déjà connu localement" est approximé en cherchant, parmi les demandes déjà
  synchronisées, une correspondance par e-mail/téléphone normalisé — évite
  un appel Pennylane superflu quand la même personne resoumet une demande.

### Statuts de synchronisation

`pennylaneCustomerSyncStatus` : `PENDING` (jamais tenté) · `SYNCED` ·
`FAILED` · `AMBIGUOUS`. Affichés dans `/admin/devis/[id]` avec un badge de
couleur (vert/rouge/orange/gris) et les actions correspondantes (Relancer /
Choisir manuellement).

### Cache devis/factures

Les devis/factures ne sont **jamais** rechargés à chaque rendu de page :
`pennylaneQuotesCache`/`pennylaneInvoicesCache` (JSON) + `pennylaneFinancialsSyncedAt`
sur `QuoteRequest`. Rechargés automatiquement si le cache dépasse 15 minutes
(`PENNYLANE_V2_FINANCIALS_TTL_MS`), ou immédiatement via le bouton
**"Actualiser"** (contourne le TTL).

### Comment tester

**Automatisé (mocks) :** un faux serveur Pennylane local (voir historique
de la session du 2026-07-25) permet de rejouer les 15 scénarios suivants
sans jamais appeler le vrai Pennylane : nouveau client absent, client par
e-mail, client par téléphone, ambiguïté (+ résolution manuelle), panne API
(5xx), token invalide, rate limit 429 (retry honoré), client sans devis,
client avec plusieurs devis, client avec plusieurs factures (payée /
partiellement payée / impayée + en retard), demande créée même si Pennylane
échoue, relance manuelle réussie. Non conservé dans le dépôt (script
ponctuel) — à reconstruire si besoin sur le même principe : serveur HTTP
local + `PENNYLANE_BASE_URL_V2`/`PENNYLANE_API_TOKEN` pointés dessus.

**Réel limité (validation finale) :** contre le vrai compte Pennylane, avec
le vrai token — authentification (`GET /me`), recherche (positive et
négative), création d'un client de test avec adresse de repli, relance
(confirme l'absence de doublon), récupération devis/factures (vides pour un
client neuf), affichage dans le panel admin. **Ne jamais créer de vrais
devis/factures sans accord explicite** — cette intégration ne le fait de
toute façon jamais (voir § "Ce qu'elle fait").

### Comportement en cas de panne

Une panne Pennylane (réseau, 5xx, 429 persistant) ne bloque et ne perd
jamais la demande : elle est déjà enregistrée en base avant tout appel
Pennylane. Le statut passe à `FAILED` avec un message admin clair (jamais
le corps brut de l'erreur API). Le client public ne voit jamais rien de
tout cela — sa demande est toujours confirmée normalement. Depuis le panel,
le bouton **"Relancer la synchronisation"** répète la recherche complète
(donc sans risque de doublon) dès que Pennylane est de nouveau disponible.

### Limites connues de l'API (vérifiées, pas supposées)

- **Adresse postale obligatoire pour créer un client individuel** —
  confirmé en conditions réelles le 2026-07-25 : `POST /individual_customers`
  avec `billing_address: { country_alpha2: "FR" }` seul est rejeté en 400
  (*"Missing required fields: billing_address.address,
  billing_address.postal_code, billing_address.city"*). **Depuis le
  2026-08-07**, le formulaire public `/rendez-vous` collecte la véritable
  adresse du client (`billingAddress`/`billingPostalCode`/`billingCity`,
  obligatoires) — l'ancien repli sur l'adresse de l'atelier
  (`PENNYLANE_FALLBACK_*`) a été **entièrement supprimé** du code
  (`billing-address.ts` n'accepte plus d'appel sans adresse). Pour les
  demandes créées avant cette date (aucune adresse en base), la création
  échoue explicitement (statut `FAILED`, message clair invitant à renseigner
  l'adresse manuellement dans Pennylane puis relancer la synchronisation)
  plutôt que d'envoyer une adresse inventée ou empruntée.
- **Aucun filtre serveur sur le téléphone** — confirmé dans la référence de
  l'endpoint `GET /customers` et le guide de filtrage dédié : seuls `id`,
  `customer_type`, `ledger_account_id`, `name`, `external_reference`,
  `reg_no`, `emails` sont filtrables. La recherche par téléphone parcourt
  donc la liste des clients côté serveur PERF'EXHAUST (bornée à 10 pages de
  100 — `PENNYLANE_V2_PHONE_SEARCH_MAX_PAGES`/`_PAGE_SIZE`) ; au-delà, la
  recherche est signalée incomplète dans les logs plutôt que de manquer
  silencieusement un client.
- **Aucun format d'URL "ouvrir dans Pennylane" documenté** — ni pour un
  client, ni pour un devis, ni pour une facture. Seul un `public_file_url`
  (PDF public, non authentifié) est confirmé pour les devis/factures. La
  stratégie retenue (`web-links.ts`) : utiliser une URL réellement renvoyée
  par l'API si présente, sinon ouvrir la page d'accueil authentifiée de
  Pennylane plutôt que de deviner un lien profond non vérifié.
- **Rate limit confirmé** : 25 requêtes / 5 secondes par token (~5 req/s),
  429 avec en-tête `retry-after` (secondes). Les lectures (GET) réessaient
  automatiquement une fois en respectant ce délai ; les créations (POST)
  ne sont jamais réessayées automatiquement.
- **Statut des factures — corrigé le 2026-08-06** : contrairement à ce qui
  était supposé précédemment (seul `"draft"` confirmé), un appel réel contre
  le compte de production ET la référence officielle
  (pennylane.readme.io/reference/getcustomerinvoices) confirment une
  énumération `status` bien plus riche : `draft`, `upcoming`, `late`, `paid`,
  `partially_paid`, `partially_cancelled`, `cancelled`, `archived`,
  `incomplete`, `credit_note`, `proforma`, `shipping_order`,
  `purchasing_order`, `estimate_pending/accepted/invoiced/denied`. Les
  champs de paiement réels sont `paid` (booléen) et
  `remaining_amount_with_tax`/`remaining_amount_without_tax` — **pas**
  `is_paid`/`outstanding_balance` (anciens noms jamais confirmés, utilisés
  par erreur avant cette correction, ce qui faussait silencieusement le
  statut/montant restant affichés). Le statut d'affichage PERF'EXHAUST
  (`invoices.ts` → `deriveDisplayStatus`) mappe désormais directement le
  `status` réel de Pennylane plutôt que de le deviner à partir des montants.
- **`currency_amount_before_tax` (montant HT)** confirmé réel pour les
  devis et les factures (doc + appel réel) — exposé dans le tableau de bord
  CRM pour les devis (voir plus bas).
- **`created_at`/`updated_at` du client** confirmés réels (appel direct
  `GET /customers/{id}`, 2026-08-06) — aucun champ `url`/`public_url` en
  revanche sur l'objet client (aucun lien direct vers la fiche client dans
  l'app web Pennylane).
- **Aucune date de paiement/acceptation dédiée** : ni les devis ni les
  factures n'exposent de champ `accepted_at`/`paid_at`. La timeline CRM
  utilise `updated_at` comme date la plus proche disponible pour "devis
  accepté"/"facture payée", explicitement marquée comme approximative dans
  l'interface plutôt que présentée comme une date exacte inventée.
- **`public_file_url` des devis expire 30 minutes après génération**
  (documenté) — non garanti au-delà pour les factures (non précisé). Le lien
  "Ouvrir" peut donc expirer si l'onglet reste ouvert longtemps sans
  actualisation ; utiliser le bouton "Actualiser Pennylane" régénère un lien
  frais.

### 📊 CRM Pennylane — tableau de bord client (2026-08-06)

La fiche `/admin/devis/[id]` agrège désormais, autour d'un même
`pennylaneCustomerId` : historique véhicules (dédupliqué, marque+modèle+année),
badge client calculé (🔴 facture impayée > 🟠 devis en attente > 🟣 fidèle
≥3 demandes > 🔵 existant ≥2 > 🟢 nouveau), statistiques commerciales
(devis/factures par statut, montants), fiche client récapitulative, et une
timeline chronologique. Nouveaux modules purs et testables :
`src/lib/pennylane-v2/{vehicles,badge,timeline,client-profile}.ts`. Aucune
table `Client` créée : l'agrégation se fait par regroupement des
`QuoteRequest` partageant le même `pennylaneCustomerId` (même décision
produit qu'en juillet 2026, voir plus haut). Aucun nouvel appel Pennylane
côté agrégation : réutilise le cache devis/factures existant
(`getCustomerFinancials`) et le seul appel `getCustomer` déjà fait pour le
nom (auquel `created_at` a été ajouté, sans appel supplémentaire).
Recherche étendue sur `/admin/devis` (numéro de devis/facture, ID
Pennylane) : les numéros sont extraits du cache local déjà en base, jamais
d'appel Pennylane dédié à la recherche.

**Limite connue** : l'appel `GET /customers/{id}` (nom + date de création)
n'est pas mis en cache — il s'exécute à chaque ouverture de fiche
synchronisée (contrairement aux devis/factures, mis en cache 15 min). Impact
réel négligeable (un seul GET non paginé, ~200 ms) au volume de ce site,
mais reste une optimisation possible si le volume augmente.

### Transition — devenir de l'ancien système

L'extension Chrome et le bouton "Préparer Pennylane" ont été supprimés
(Phase B). Le mode manuel presse-papiers (`PennylaneManualSection`) et
l'ancien mode API v1 (`src/lib/pennylane/`, actif uniquement si
`PENNYLANE_MODE=api` ou `PENNYLANE_API_KEY` est configurée) restent
**entièrement fonctionnels et non touchés** — ils cohabitent avec la nouvelle
intégration v2 tant qu'aucune décision de suppression complète n'a été prise.
Voir le rapport de mission du 2026-07-25 pour le statut exact au moment de la
livraison.

## 📞 Modifier le téléphone

Le numéro apparaît à plusieurs endroits. Rechercher l'ancien numéro et remplacer partout :

```bash
grep -rn "33 6 36 52 30 58\|33636523058" src/
```

Fichiers concernés : `Header.tsx`, `Footer.tsx`, `Hero.tsx`, `LocalSection.tsx`,
`MobileCTA.tsx`, `contact/page.tsx`, `rendez-vous/page.tsx`, `mentions-legales/page.tsx`,
`src/lib/jsonld.ts` (format `+33636523058` pour les liens `tel:` et le JSON-LD).

## 📍 Modifier l'adresse

- `src/app/mentions-legales/page.tsx` — bloc "Éditeur du site"
- `src/lib/jsonld.ts` — champ `address` (streetAddress, postalCode…)
- `src/components/sections/LocalSection.tsx` — bloc "Atelier sur rendez-vous"
- `src/app/contact/page.tsx` — bloc "Informations"

## 🧾 Modifier le SIRET / la forme juridique

`src/app/mentions-legales/page.tsx`, section "Éditeur du site" :

```tsx
<p>Forme juridique : à compléter</p>
<p>SIRET : 882 838 667 00021</p>
```

## 🛠️ Modifier les services

`src/data/services.ts` — tableau `services`. Chaque entrée :

```ts
{
  id: 'ligne-complete',            // identifiant stable, sans accent
  title: 'Ligne complète sur mesure',
  description: '...',
  icon: 'wrench',
  details: ['Conception personnalisée', 'Inox 304L ou 316L'],
  badge: 'Fabrication artisanale', // optionnel
},
```

## 🚗 Ajouter une réalisation (mode statique, sans base)

> Si `DATABASE_URL` est configurée, utilisez plutôt le **panel admin** (`/admin`) — voir section ci-dessus.

`src/data/projects.ts` — ajouter une entrée au tableau `projects` :

```ts
{
  id: '16',                                    // incrémenter
  slug: 'audi-rs6-ligne-titane',               // ⚠️ minuscules, SANS accent, tirets
  vehicule: 'Audi RS6',
  marque: 'Audi',
  modele: 'RS6 Avant',
  annee: '2023',
  prestation: 'Ligne complète titane',
  tags: ['Ligne complète', 'Titane', 'V8'],
  sonoriteTag: 'Son agressif',                 // valeurs existantes : Son sportif, Son grave,
                                               // Son agressif, Son aigu, Discret
  filterTags: ['ligne-complete'],              // pilote les filtres de la galerie — valeurs :
                                               // ligne-complete, demi-ligne, silencieux, grave, sportif
  description: 'Résumé court (carte galerie).',
  descriptionComplete: 'Texte long (page projet).',
  objectifsClient: '...',
  modificationsRealisees: '...',
  materiaux: '...',
  resultatSonore: '...',
  images: [
    { src: '/images/projects/rs6-1.jpg', alt: 'Audi RS6 avant', type: 'avant' },
    { src: '/images/projects/rs6-2.jpg', alt: 'Audi RS6 après', type: 'apres' },
  ],
  featured: false,                             // true = mise en avant sur la home
  date: '2026-07-01',                          // AAAA-MM-JJ (utilisé par le sitemap)
},
```

La page `/realisations/audi-rs6-ligne-titane` et l'entrée sitemap sont générées automatiquement.

### ⚠️ Slugs : règle absolue

Les slugs doivent être **en minuscules, sans accent, sans apostrophe, séparés par des tirets**.
Un garde-fou fait **échouer le build** si un slug est mal formé (message explicite indiquant
la forme correcte). En cas de doute : `sonorité` → `sonorite`, `échappement` → `echappement`.

## 🎛️ Modifier les filtres de la galerie

1. `src/components/gallery/GalleryWithFilters.tsx` — tableau `FILTERS` (id + libellé affiché)
2. Ajouter l'`id` du nouveau filtre dans le champ `filterTags` des projets concernés
   (`src/data/projects.ts`)

Le filtrage est un simple `project.filterTags.includes(filtre)` — robuste aux accents/majuscules.

## 🖼️ Remplacer les photos

1. Déposer les fichiers dans `public/images/projects/` (JPG/WebP, ~1600px de large max)
2. Renseigner le champ `images` du projet dans `src/data/projects.ts`
3. Les pages projet affichent actuellement un placeholder "Photo à venir" —
   le composant d'affichage réel des images est à activer dans
   `src/app/realisations/[slug]/page.tsx` quand de vraies photos existent

Image de partage social : remplacer `public/og-image.jpg` (1200×630) par une vraie photo.
Logo : `public/logo.png` (512×512).

## 📱 Ajouter un post Instagram / une vidéo TikTok manuellement

`src/data/social.ts` — tableau `featuredPosts` :

```ts
export const featuredPosts: FeaturedPost[] = [
  { platform: 'instagram', url: 'https://www.instagram.com/p/ABC123/', caption: 'Ligne complète inox — Golf GTI' },
  { platform: 'tiktok', url: 'https://www.tiktok.com/@perfexhaust/video/1234567890', caption: 'Soudure TIG en atelier' },
]
```

Les posts apparaissent automatiquement dans la section "Suivez les réalisations en direct"
de la page d'accueil, sous forme de cartes cliquables. Liste vide = seules les cartes
profils s'affichent. **Aucune clé API nécessaire.**

Les liens des profils (`SOCIAL_LINKS`) et l'URL des avis Google (`GOOGLE_REVIEWS_URL`)
se modifient dans le même fichier.

## ⭐ Activer le bouton "Voir les avis Google"

`src/data/social.ts` :

```ts
export const GOOGLE_REVIEWS_URL = 'https://g.page/r/XXXXXXXX/review'
```

Tant que la constante est vide, la section avis affiche une invitation à chercher
l'atelier sur Google (aucun bouton cassé).

## ❓ Modifier la FAQ

`src/components/sections/FAQSection.tsx` — tableau `faqs` en haut du fichier.
Le schema `FAQPage` (SEO) est **généré automatiquement** depuis ce tableau :
modifier une réponse met à jour les deux en même temps.

## 🌍 Modifier les zones GEO

- `src/components/sections/LocalSection.tsx` — tableau `ZONES` (villes + temps de trajet affichés)
- `src/lib/jsonld.ts` — champ `areaServed` (villes déclarées aux moteurs de recherche)

Garder les deux synchronisés.

## 📧 Configurer Resend (quand le domaine sera prêt)

1. Créer un compte sur https://resend.com
2. **Domains → Add Domain** : ajouter le domaine d'envoi et poser les DNS (SPF + DKIM)
3. Attendre la vérification du domaine (obligatoire, sinon les envois échouent)
4. **API Keys → Create** : générer une clé
5. Dans Vercel → Settings → Environment Variables (environnement Production) :
   - `RESEND_API_KEY` = la clé générée
   - `BUSINESS_EMAIL` = adresse de réception des demandes
6. Redéployer (ou attendre le prochain push)
7. Tester `/rendez-vous` et `/contact` avec de vraies adresses

Sans ces variables, le site fonctionne en **mode mock** : les demandes sont logguées
côté serveur (`[EMAIL MOCK]` dans les logs Vercel) mais **aucun email ne part**.
Un avertissement explicite apparaît dans les logs de production tant que la clé est absente.
L'expéditeur (`noreply@perfexhaust.fr`) est défini dans `src/lib/email.ts`.

## ⚙️ Variables Vercel

Dashboard Vercel → projet `perfexhaust` → Settings → Environment Variables.
Après tout ajout/modification, redéployer pour prise en compte
(Deployments → ⋯ → Redeploy).

## 🗺️ Vérifier sitemap / robots

```bash
curl https://perfexhaust.fr/sitemap.xml   # 6 pages + 15 réalisations
curl https://perfexhaust.fr/robots.txt
```

Le sitemap est généré par `src/app/sitemap.ts` (les projets y sont ajoutés
automatiquement depuis `projects.ts`). Robots : `src/app/robots.ts`.

## 📐 Faire un audit responsive

```bash
npm install -D playwright && npx playwright install chromium
```

Puis avec un script Playwright, pour chaque page × viewport
(320/360/375/390/430/768/1024/1440), vérifier :

```js
const overflow = await page.evaluate(() =>
  document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
```

Astuce : désactiver l'intro dans les tests avec
`sessionStorage.setItem("pe-intro-seen", "1")` (via `context.addInitScript`).
Désinstaller Playwright après l'audit (`npm uninstall playwright`).

## 📝 Tester les formulaires

1. Local : `npm run dev`, remplir `/rendez-vous` — la demande apparaît dans le
   terminal (`[EMAIL MOCK] Appointment to shop: ...`)
2. Vérifier les messages d'erreur en soumettant des champs invalides
   (année « abcd », téléphone court…)
3. En production avec Resend actif : vérifier la réception réelle des deux emails

API directe :

```bash
curl -X POST http://localhost:3000/api/rendez-vous \
  -H "Content-Type: application/json" -d '{"nom":"x"}'
# → {"error":"Données invalides"} attendu
```

## 🔀 Vérifier les redirections 308

Les anciennes URLs accentuées doivent rediriger vers les slugs propres :

```bash
curl -sI "https://perfexhaust.fr/realisations/bmw-serie-3-sonorit%C3%A9-grave" | head -2
# HTTP/2 308
# location: /realisations/bmw-serie-3-sonorite-grave
```

Cette logique vit dans `src/app/realisations/[slug]/page.tsx` (`permanentRedirect`)
et `src/data/projects.ts` (`getProjectBySlug` normalise le slug reçu).

## ⚡ Performance — note sur l'intro

L'intro « soudure » de la page d'accueil est le plus grand élément peint
(LCP) mesuré par Lighthouse : le score Performance de la home (~85) reflète
ce choix de marque, pas un défaut technique (SEO/Best Practices = 100).
Pour privilégier la métrique, désactiver l'intro = supprimer `<IntroGate />`
dans `src/app/page.tsx` (une ligne).

Le formulaire de devis **sauvegarde automatiquement** la saisie
(localStorage, clé `pe-devis-draft`) et la restaure à la prochaine visite ;
le consentement RGPD n'est jamais restauré.

## 🩺 Problèmes courants

| Symptôme | Cause probable | Solution |
|---|---|---|
| Build échoue avec "Slug invalide pour le projet…" | Slug avec accent/majuscule dans `projects.ts` | Utiliser la forme suggérée dans le message d'erreur |
| Les demandes de devis n'arrivent pas par email | `RESEND_API_KEY` absente ou domaine Resend non vérifié | Voir section Resend ; contrôler les logs Vercel (`[EMAIL MOCK]` = mode mock) |
| Un filtre galerie ne remonte aucun projet | `filterTags` manquant sur les projets | Ajouter la valeur du filtre dans `filterTags` |
| Page projet en 404 | Slug du lien ≠ slug des données | Vérifier `src/data/projects.ts` ; les anciennes URLs accentuées redirigent en 308 |
| Layout cassé après modification | Classe Tailwind invalide | `npm run build` en local avant push ; vérifier la console navigateur |
| Le bouton avis Google n'apparaît pas | `GOOGLE_REVIEWS_URL` vide | Renseigner l'URL dans `src/data/social.ts` |
| Couleur orange visible quelque part | Régression du design system | La palette est `brand-*` (globals.css) ; `grep -rn "orange" src/` doit rester vide |

## 📁 Fichiers de référence

| Fichier | Rôle |
|---|---|
| `src/data/projects.ts` | Les 15 réalisations (slugs, filtres, contenus) |
| `src/data/services.ts` | Les 7 prestations affichées |
| `src/data/social.ts` | Liens sociaux, posts manuels, URL avis Google |
| `src/data/partners.ts` | Partenaires (SHIFTECH) |
| `src/components/sections/` | Toutes les sections de la home |
| `src/components/forms/` | Formulaires devis + contact |
| `src/app/mentions-legales/page.tsx` | SIRET, adresse, confidentialité |
| `src/lib/email.ts` | Envoi d'emails (Resend + mock) |
| `src/lib/jsonld.ts` | Données structurées SEO/GEO |
| `src/app/sitemap.ts` / `src/app/robots.ts` | Sitemap et robots |
| `src/app/globals.css` | Design system (palette `brand-*` #1266EA) |
| `docs/PRODUCTION_CHECKLIST.md` | Checklist de mise en ligne finale |
