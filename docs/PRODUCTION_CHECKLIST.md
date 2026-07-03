# Production Checklist — PERF'EXHAUST

Checklist avant mise en ligne finale sur le domaine définitif.
Les cases cochées `[x]` correspondent à ce qui est **réellement fait et vérifié** à ce jour.

---

## 🌐 Domaine & DNS

- [ ] Acheter / confirmer le domaine définitif (ex : `perfexhaust.fr`)
- [ ] Ajouter le domaine dans Vercel (Settings → Domains)
- [ ] Configurer les enregistrements DNS (A / CNAME selon Vercel)
- [ ] Vérifier le certificat SSL automatique Vercel
- [ ] Remplacer `https://perfexhaust.vercel.app` par le domaine final dans le code
      (rechercher la chaîne dans `src/` — présente dans `layout.tsx`, `sitemap.ts`, `robots.ts`, `jsonld.ts` et les pages)

## ▲ Vercel

- [x] Projet lié au repo GitHub (`BOZYILDIZ/perf-exhaust`)
- [x] Déploiement automatique sur push `main`
- [x] Build de production sans erreur
- [ ] Ajouter le domaine custom
- [ ] Activer Vercel Analytics (Dashboard → Analytics)
- [ ] Activer Speed Insights (Dashboard → Speed Insights)

## 🔐 Variables d'environnement (Vercel → Settings → Environment Variables)

- [ ] `RESEND_API_KEY` — après connexion du domaine (voir section Resend)
- [ ] `BUSINESS_EMAIL` — adresse de réception des demandes (ex : `contact@perfexhaust.fr`)
- [ ] `NEXT_PUBLIC_SITE_URL` — URL canonique finale
- [ ] `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_SECRET` — active le panel `/admin`
- [ ] `DATABASE_URL` — PostgreSQL (Neon/Vercel Postgres) pour les réalisations dynamiques
- [ ] `BLOB_READ_WRITE_TOKEN` — Vercel Blob pour l'upload d'images admin
- [x] Le site fonctionne **sans** ces variables (mock email, données statiques, aucun blocage)

## 🗄️ Base de données & panel admin

- [x] Schéma Prisma + migration initiale (`prisma/migrations`)
- [x] Fallback statique automatique sans `DATABASE_URL` (production non cassée)
- [x] Seed idempotent des 15 réalisations (`npm run db:seed`)
- [ ] Créer la base PostgreSQL de production (Neon / Vercel Postgres)
- [ ] Poser `DATABASE_URL` sur Vercel puis lancer `npx prisma migrate deploy`
- [ ] Lancer le seed en production
- [ ] Créer le store Vercel Blob + poser `BLOB_READ_WRITE_TOKEN`
- [ ] Définir des identifiants admin FORTS (`ADMIN_*`) — jamais les valeurs d'exemple

## 📧 Resend (emails)

- [ ] Créer/valider le compte Resend
- [ ] **Vérifier le domaine d'envoi dans Resend** (DNS : SPF + DKIM) — prérequis absolu
- [ ] Générer la clé API et l'ajouter dans Vercel (`RESEND_API_KEY`)
- [ ] Tester un envoi réel depuis `/rendez-vous` et `/contact`
- [ ] Vérifier la réception sur `BUSINESS_EMAIL` + l'email de confirmation client
- [x] Mode mock fonctionnel en attendant (logs `[EMAIL MOCK]` côté serveur)
- [x] Erreurs d'envoi Resend détectées et remontées (pas de faux succès)
- [x] Avertissement console explicite si clé absente en production

## 🔍 Google Search Console

- [ ] Ajouter la propriété (domaine final)
- [ ] Vérifier la propriété (DNS ou balise)
- [ ] Soumettre `sitemap.xml`
- [ ] Vérifier l'indexation des pages principales après quelques jours
- [ ] Contrôler les résultats enrichis (FAQ, LocalBusiness, Breadcrumb)

## 📊 Google Analytics

- [ ] Créer la propriété GA4
- [ ] Intégrer le tag (via `@next/third-parties` recommandé)
- [ ] Configurer les événements clés (envoi formulaire devis, clic téléphone)
- [ ] Mettre à jour la politique de confidentialité + bannière cookies si GA activé

## 🔬 Microsoft Clarity (optionnel)

- [ ] Créer le projet Clarity
- [ ] Intégrer le script
- [ ] Mettre à jour la politique cookies en conséquence

## 🗺️ Sitemap & Robots

- [x] `sitemap.xml` généré dynamiquement (6 pages indexables + 15 réalisations)
- [x] Slugs propres sans accents, aucun doublon
- [x] `robots.txt` : indexation autorisée, `/api/` exclu, `/_next/` accessible
- [x] `/mentions-legales` en noindex, exclue du sitemap, canonical propre
- [ ] Re-vérifier après passage au domaine final

## 🎯 SEO / GEO

- [x] Metadata complète sur chaque page (title, description, canonical)
- [x] Open Graph + Twitter Cards avec image dédiée (`/og-image.jpg`)
- [x] Contenu GEO (zones desservies réelles, expertise, FAQ conversationnelle)
- [ ] Remplacer l'image OG générée par une vraie photo de l'atelier (recommandé)

## 🧬 Schema.org (JSON-LD)

- [x] `LocalBusiness` + `AutomotiveBusiness` (adresse réelle, téléphone, horaires, geo)
- [x] `WebSite`, `FAQPage` (générée depuis la FAQ visible), `Service`, `BreadcrumbList`
- [x] `CreativeWork` + fil d'Ariane sur chaque page réalisation
- [x] `sameAs` : Instagram + TikTok officiels
- [ ] Valider sur https://search.google.com/test/rich-results après domaine final

## ⚖️ Mentions légales & RGPD

- [x] SIRET intégré : 882 838 667 00021
- [x] Adresse réelle : 30 Rue de Soufflenheim, 67480 Rountzenheim-Auenheim
- [x] Téléphone réel : +33 6 36 52 30 58
- [ ] **Forme juridique** — à compléter (`src/app/mentions-legales/page.tsx`)
- [ ] **Responsable de publication** — à ajouter si requis
- [x] Politique de confidentialité présente (données, droits, conservation)
- [x] Consentement RGPD sur le formulaire de devis
- [x] Cookies : uniquement techniques actuellement (pas de bannière requise) —
      **à revoir si GA/Clarity sont ajoutés**

## 🏪 Google Business Profile

- [ ] Créer/revendiquer la fiche Google Business de l'atelier
- [ ] Renseigner adresse, horaires, téléphone, photos
- [ ] Récupérer l'URL des avis et la renseigner dans `src/data/social.ts`
      (`GOOGLE_REVIEWS_URL`) → le bouton "Voir les avis Google" s'activera automatiquement
- [ ] Encourager les premiers clients à laisser un avis

## 📸 Contenus réels

- [ ] **Photos réelles des réalisations** (remplacer les placeholders "Photo à venir")
      → déposer dans `public/images/projects/` et renseigner `images` dans `src/data/projects.ts`
- [ ] Valider avec l'atelier la liste des 15 projets affichés (véhicules, descriptions)
- [ ] Reformuler ou retirer les mentions "décat / suppression FAP / suppression catalyseur"
      dans 3 projets (`projects.ts`) — prestations non homologuées route, à encadrer juridiquement
- [ ] Vidéos réelles (TikTok) — ajouter les URLs dans `featuredPosts` (`src/data/social.ts`)

## 📱 Réseaux sociaux

- [x] Liens officiels configurés (Instagram `@perfexhaust67`, TikTok `@perfexhaust`)
- [x] Section sociale honnête (aucun faux post, aucun faux compteur)
- [x] Structure `featuredPosts` prête pour mise en avant manuelle de posts
- [ ] Ajouter 3-6 posts réels dans `featuredPosts` quand disponibles
- [ ] (Plus tard, optionnel) brancher les APIs officielles Instagram Graph / TikTok Display

## ✅ Tests avant mise en ligne

- [x] Responsive : 9 pages × 8 viewports (320→1440px), zéro overflow (audit Playwright)
- [x] Formulaires : validation, états loading/succès/erreur, accessibilité labels
- [x] Filtres galerie : 6/6 fonctionnels
- [x] Redirections 308 des anciennes URLs accentuées
- [x] Aucune erreur console sur les pages principales
- [ ] Lighthouse ≥ 90 sur mobile (à lancer sur le domaine final)
- [ ] Test des formulaires avec Resend réel activé
- [ ] Test de réception email sur mobile (rendu du template)

## 💾 Sauvegarde & livraison

- [x] Code versionné sur GitHub (`BOZYILDIZ/perf-exhaust`, branche `main`)
- [x] Documentation maintenance (`docs/MAINTENANCE.md`)
- [ ] Transférer/partager l'accès au repo avec le client si demandé
- [ ] Validation finale du client sur le contenu (textes, projets, mentions)
