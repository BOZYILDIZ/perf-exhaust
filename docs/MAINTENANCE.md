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
puis contrôler https://perfexhaust.vercel.app.

---

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

## 🚗 Ajouter une réalisation

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
curl https://perfexhaust.vercel.app/sitemap.xml   # 6 pages + 15 réalisations
curl https://perfexhaust.vercel.app/robots.txt
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
curl -sI "https://perfexhaust.vercel.app/realisations/bmw-serie-3-sonorit%C3%A9-grave" | head -2
# HTTP/2 308
# location: /realisations/bmw-serie-3-sonorite-grave
```

Cette logique vit dans `src/app/realisations/[slug]/page.tsx` (`permanentRedirect`)
et `src/data/projects.ts` (`getProjectBySlug` normalise le slug reçu).

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
