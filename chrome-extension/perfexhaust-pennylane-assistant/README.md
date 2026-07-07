# PERF'EXHAUST — Assistant Pennylane

Extension Chrome **privée** (usage interne atelier uniquement, jamais publiée
sur le Chrome Web Store) qui aide à préremplir manuellement un devis dans
Pennylane à partir d'une demande enregistrée dans le CRM PERF'EXHAUST —
utile tant que le compte Pennylane est sur le **plan gratuit** (sans accès
API).

## Principe non négociable

- **Pennylane reste l'outil officiel** pour les devis et les factures.
- **PERF'EXHAUST reste le CRM** des demandes — il ne crée jamais de devis.
- Cette extension **ne valide et n'envoie jamais rien automatiquement**.
- Elle **ne clique jamais** sur un bouton de validation/envoi/soumission de
  Pennylane — elle se limite à remplir des champs de saisie visibles.
- **L'admin vérifie toujours le prix et valide lui-même** dans Pennylane.
- Aucune API Pennylane, aucun scraping de données sensibles, aucun vol de
  session, aucun mot de passe stocké.

## Fonctionnement

```
/admin/devis/[id] (PERF'EXHAUST)
  → clic sur « Préparer Pennylane »
  → l'extension lit les données déjà affichées sur la page
    (script #perfexhaust-quote-data, rendu côté serveur)
  → sauvegarde temporaire dans chrome.storage.session (effacée à la
    fermeture du navigateur, jamais écrite sur disque)

app.pennylane.com (n'importe quelle page, une fois les données préparées)
  → un bandeau flottant apparaît : « Données PERF'EXHAUST détectées »
  → clic sur « Préremplir le devis »
  → l'extension recherche les champs disponibles (nom, email, téléphone,
    description, désignation de la ligne, TVA) et les remplit
  → un rapport s'affiche : combien de champs ont été remplis, lesquels
    n'ont pas été trouvés (à compléter à la main)
  → l'admin renseigne le prix, vérifie tout, et valide lui-même
```

## Installation en mode développeur

1. Ouvrir un terminal dans ce dossier et installer les dépendances de build :
   ```bash
   npm install
   npm run build
   ```
   (génère le dossier `dist/` — requis, l'extension ne se charge pas sans lui)
2. Dans Chrome, ouvrir `chrome://extensions`.
3. Activer **« Mode développeur »** (interrupteur en haut à droite).
4. Cliquer **« Charger l'extension non empaquetée »**.
5. Sélectionner ce dossier (`chrome-extension/perfexhaust-pennylane-assistant`).
6. L'icône « PE » apparaît dans la barre d'outils Chrome.

Après toute modification du code source (`src/`), relancer `npm run build`
puis cliquer sur l'icône ↻ (recharger) de l'extension dans
`chrome://extensions`.

## Utilisation

1. Se connecter à `/admin` sur perfexhaust.fr et ouvrir une demande sur
   `/admin/devis/[id]`.
2. Dans la section **« Assistant Chrome »**, cliquer **« Préparer Pennylane »**.
   Un message confirme si l'extension a bien reçu les données
   (« Extension détectée — les données ont bien été transmises »).
3. Ouvrir ou passer sur un onglet `app.pennylane.com` (avec le bouton
   « Ouvrir Pennylane » de la section « Pennylane manuel », ou manuellement).
4. Un bandeau apparaît en bas à droite : cliquer **« Préremplir le devis »**.
5. Vérifier le rapport affiché (champs remplis / à compléter manuellement).
6. Compléter le prix et tout champ manquant, vérifier l'ensemble, puis
   **valider vous-même** dans Pennylane comme d'habitude.

L'icône de l'extension affiche un badge bleu **"1"** tant qu'une demande est
en attente de préremplissage.

## Permissions demandées — et pourquoi

| Permission | Pourquoi |
|---|---|
| `storage` | Stocker temporairement les données préparées (`chrome.storage.session`) et la préférence de mode debug (`chrome.storage.local`). |
| `host_permissions: https://perfexhaust.fr/admin/*` | Lire les données de la demande affichée sur `/admin/devis/[id]`. |
| `host_permissions: https://app.pennylane.com/*` | Afficher le bandeau et remplir les champs du formulaire de devis. |

Aucune permission `activeTab`, `scripting`, `tabs`, `webRequest` ou accès
à d'autres sites : l'extension ne peut agir que sur ces deux domaines
précis, déclarés explicitement.

## Données lues

Sur `/admin/devis/[id]` uniquement, au moment du clic sur « Préparer
Pennylane » (jamais en arrière-plan, jamais sur une autre page) :
nom et prénom du client, email, téléphone, véhicule (marque/modèle/année),
motorisation, type de projet, sonorité souhaitée, message du client, la
ligne suggérée *"Échappement sur mesure — prix à compléter"* et le taux de
TVA (20 %). Ce sont exactement les informations déjà visibles à l'écran
pour l'admin sur cette page — rien de plus (pas de notes internes, pas
d'identifiants Pennylane, pas de mot de passe).

## Données stockées

- **`chrome.storage.session`** : la demande préparée, avec un horodatage.
  Zone de stockage **en mémoire uniquement** — jamais écrite sur disque,
  automatiquement vidée à la fermeture du navigateur. Considérée comme
  **périmée après 30 minutes** (le bandeau l'indique alors clairement et ne
  propose plus de préremplissage avec des données obsolètes).
- **`chrome.storage.local`** : uniquement la préférence "mode debug"
  (aucune donnée de demande).
- **Aucune donnée n'est jamais envoyée à un serveur externe** — tout reste
  local au navigateur.

Bouton **« Effacer les données »** disponible dans le popup de l'extension
(clic sur l'icône « PE ») pour vider `chrome.storage.session` à tout moment.

## Désinstallation

`chrome://extensions` → trouver « PERF'EXHAUST — Assistant Pennylane » →
**Supprimer**. Toutes les données stockées par l'extension sont effacées
avec elle.

## Mode debug

Dans le popup de l'extension, cocher **« Mode debug »** pour journaliser
dans la console de chaque page (`F12` → Console) le détail des tentatives
de détection de champs (quelle stratégie a fonctionné, quel élément a été
trouvé ou non) — utile pour diagnostiquer un champ qui ne se remplit pas.

## Robustesse & limites connues

**Aucune API Pennylane n'étant utilisée**, la détection des champs repose
sur la lecture du HTML affiché par Pennylane à un instant donné. Trois
stratégies sont essayées dans l'ordre pour chaque champ (voir
`src/content-scripts/pennylane-selectors.ts`, fichier **isolé et unique
point de correction** si Pennylane change son interface) :

1. Sélecteurs CSS directs (rapide, précis si le HTML n'a pas changé).
2. Correspondance par texte de `<label>` (plus résistant aux changements
   de structure/nommage interne).
3. Correspondance par `placeholder`/`aria-label`.

Si aucune des trois ne trouve le champ, il est listé explicitement dans le
rapport affiché — **jamais d'échec silencieux**. C'est un comportement
normal et attendu tant que les sélecteurs n'ont pas été ajustés au HTML
réel de Pennylane (voir ci-dessous).

**Limite honnête à annoncer au client** : les sélecteurs CSS et mots-clés
de `pennylane-selectors.ts` sont des estimations raisonnables (types de
champs standards, libellés français usuels), pas une vérification faite
sur l'interface authentifiée réelle de Pennylane. La première utilisation
réelle déterminera quels champs sont détectés automatiquement et lesquels
doivent être ajustés. Pour corriger :

1. Ouvrir la page de création de devis dans Pennylane, `F12` → inspecter le
   champ concerné.
2. Noter son attribut `name`, `id`, ou le texte de son `<label>`.
3. Ajouter cette information dans `FIELD_CONFIGS` (`pennylane-selectors.ts`),
   `cssSelectors` ou `labelKeywords` selon le cas.
4. `npm run build`, puis recharger l'extension dans `chrome://extensions`.

Autres limites connues :
- Si Pennylane utilise un **champ de recherche client** (autocomplete) plutôt
  qu'un simple champ texte pour le nom/l'email, le préremplissage peut ne
  remplir que le texte de recherche sans sélectionner le résultat — à
  valider/sélectionner manuellement.
- Le TTL de 30 minutes est arbitraire (raisonnable pour une session de
  travail) — modifiable dans `src/shared-types.ts` (`QUOTE_TTL_MS`).
- Fonctionne uniquement sur Chrome desktop (Manifest V3, `chrome.storage.session`
  nécessite Chrome 102+) — non prévu pour mobile.

## Développement

```bash
npm install       # dépendances (esbuild, typescript, eslint)
npm run build     # compile src/ → dist/ (à refaire après chaque modification)
npm run typecheck # vérification TypeScript stricte
npm run lint      # ESLint
```

Structure :
```
manifest.json                          Manifest V3
popup.html / styles.css                Interface popup + bandeau Pennylane
src/background.ts                      Service worker (badge)
src/popup.ts                           Logique du popup
src/shared-types.ts                    Types partagés + clés de storage + TTL
src/content-scripts/perfexhaust-admin.ts   Lit les données sur /admin/devis/[id]
src/content-scripts/pennylane.ts           Bandeau + préremplissage sur Pennylane
src/content-scripts/pennylane-selectors.ts Sélecteurs isolés + résolution de champs
dist/                                   Généré par `npm run build` — ignoré par git
```
