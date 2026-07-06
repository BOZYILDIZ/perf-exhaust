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
les factures officiels.** PERF'EXHAUST ne génère jamais de devis complet : le
site collecte les demandes et crée un **brouillon** dans Pennylane pour que
l'atelier n'ait pas à ressaisir les informations client. Tout ce qui suit —
prix, envoi au client, acceptation, facturation — se fait **exclusivement
dans Pennylane**. Le panel `/admin/devis` reste un CRM de demandes : il
consulte le statut et le lien Pennylane, il ne construit rien.

```
Client envoie /rendez-vous
  → demande enregistrée dans QuoteRequest (CRM PERF'EXHAUST)
  → emails Resend envoyés (atelier + confirmation client), comme avant
  → SI PENNYLANE_API_KEY configurée : brouillon Pennylane créé automatiquement
      (client retrouvé/créé + devis avec une ligne générique 0 € HT
       "Échappement sur mesure — prix à définir après analyse")
  → résultat (ID, numéro, lien) sauvegardé sur la demande
  → le client voit toujours "Demande envoyée avec succès", même si
    l'étape Pennylane échoue (jamais visible côté public)
```

Le devis Pennylane embarque dans sa description tout ce que l'atelier a
besoin de savoir sans rouvrir le CRM : nom, téléphone, email, véhicule,
motorisation, type de projet, sonorité souhaitée, message du client, et la
mention *« Prix à compléter dans Pennylane après analyse »*. Aucun prix
définitif n'est jamais inventé par le site.

### Créer une clé API Pennylane

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
PENNYLANE_API_KEY=<le token généré ci-dessus>
```

`PENNYLANE_BASE_URL` et `PENNYLANE_COMPANY_ID` sont **optionnelles** — à
n'ajouter que si Pennylane l'exige explicitement pour votre configuration
(sandbox de test, compte cabinet comptable multi-entreprises). Un compte
« Company API » standard n'en a pas besoin : le token est déjà rattaché à
une seule entreprise.

Sans `PENNYLANE_API_KEY` : la demande est enregistrée normalement, les
emails partent normalement, et la section « Devis Pennylane » de
`/admin/devis/[id]` affiche simplement *« Pennylane non configuré »* — rien
ne casse ailleurs sur le site.

### Comment tester l'intégration

1. Poser `PENNYLANE_API_KEY` (local ou Vercel).
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

- **Adresse de facturation** : Pennylane exige un objet `billing_address`
  pour créer un client, alors que notre formulaire public ne collecte pas
  d'adresse postale. L'intégration envoie un objet vide ; si Pennylane le
  refuse (422), le message précis de Pennylane s'affiche dans l'admin —
  il faut alors compléter l'adresse du client directement dans Pennylane,
  puis réessayer.
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
