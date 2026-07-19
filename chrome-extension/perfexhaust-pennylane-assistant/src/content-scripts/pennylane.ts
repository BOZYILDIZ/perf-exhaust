import { DEBUG_STORAGE_KEY, QUOTE_TTL_MS, STORAGE_KEY, isExpired, type StoredQuote } from "../shared-types";
import {
  AUTOCOMPLETE_FIELDS,
  FIELD_CONFIGS,
  captureVisibleSlateEditors,
  fillRichTextField,
  fillTextField,
  findExpandToggle,
  resolveDescriptionEditor,
  resolveField,
  selectReactSelectOptionByText,
  type FieldKey,
} from "./pennylane-selectors";

const LOG_PREFIX = "[PERF'EXHAUST Assistant]";
const BANNER_ID = "perfexhaust-pennylane-banner";

// Log inconditionnel (pas derrière le flag debug) : prouve que le content
// script Pennylane a bien été injecté sur cette page, y compris sur des
// routes profondes (ex: .../customer_estimates/new?quote_from_sidepanel=true).
console.log(`${LOG_PREFIX} Pennylane content script loaded — ${window.location.href}`);

async function isDebugEnabled(): Promise<boolean> {
  try {
    const { [DEBUG_STORAGE_KEY]: debug } = await chrome.storage.local.get(DEBUG_STORAGE_KEY);
    return Boolean(debug);
  } catch {
    return false;
  }
}

async function debugLog(...args: unknown[]): Promise<void> {
  if (await isDebugEnabled()) console.log(LOG_PREFIX, ...args);
}

function removeBanner(): void {
  document.getElementById(BANNER_ID)?.remove();
}

function createBanner(): HTMLDivElement {
  removeBanner();
  const banner = document.createElement("div");
  banner.id = BANNER_ID;
  banner.setAttribute("role", "region");
  banner.setAttribute("aria-label", "Assistant PERF'EXHAUST");
  document.body.appendChild(banner);
  return banner;
}

/** Échappe le texte inséré dans le bandeau — jamais de HTML non sécurisé, même pour des données internes. */
function escapeHtml(value: string): string {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

// Empêche le bandeau fermé par l'admin de réapparaître tout seul pour le
// même lot de données (identifié par son horodatage de préparation) — mais
// il réapparaît bien si de nouvelles données sont préparées ensuite, ou sur
// un nouveau chargement de page.
let dismissedForPreparedAt: number | null = null;

function renderExpiredBanner(stored: StoredQuote): void {
  const banner = createBanner();
  const minutesAgo = Math.round((Date.now() - stored.preparedAt) / 60000);
  banner.innerHTML = `
    <div class="pe-banner pe-banner--warning">
      <div class="pe-banner__header">
        <span class="pe-banner__title">Données PERF'EXHAUST expirées</span>
        <button type="button" class="pe-banner__close" data-pe-action="dismiss" aria-label="Fermer">×</button>
      </div>
      <p class="pe-banner__text">
        Les données préparées pour « ${escapeHtml(stored.data.clientName)} » ont plus de ${minutesAgo} minutes
        (limite : ${Math.round(QUOTE_TTL_MS / 60000)} min). Retournez sur /admin/devis et cliquez à nouveau sur
        « Préparer Pennylane » pour les rafraîchir.
      </p>
    </div>
  `;
  bindDismiss(banner, stored);
}

function renderReadyBanner(stored: StoredQuote): void {
  const banner = createBanner();
  banner.innerHTML = `
    <div class="pe-banner pe-banner--ready">
      <div class="pe-banner__header">
        <span class="pe-banner__title">Données PERF'EXHAUST détectées</span>
        <button type="button" class="pe-banner__close" data-pe-action="dismiss" aria-label="Fermer">×</button>
      </div>
      <p class="pe-banner__text">
        ${escapeHtml(stored.data.clientName)} — ${escapeHtml(stored.data.vehicle)}<br />
        Ouvrez ou créez un devis Pennylane, puis cliquez sur « Préremplir ».
      </p>
      <button type="button" class="pe-banner__button" data-pe-action="fill">Préremplir le devis</button>
      <div class="pe-banner__report" data-pe-report hidden></div>
    </div>
  `;
  bindDismiss(banner, stored);
  banner.querySelector('[data-pe-action="fill"]')?.addEventListener("click", () => {
    void fillQuote(stored, banner);
  });
}

function bindDismiss(banner: HTMLDivElement, stored: StoredQuote): void {
  banner.querySelector('[data-pe-action="dismiss"]')?.addEventListener("click", () => {
    dismissedForPreparedAt = stored.preparedAt;
    banner.remove();
  });
}

/** Un court délai pour laisser le DOM se mettre à jour après un clic sur un bouton "+ Ajouter...". */
function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Prérempile les champs disponibles — ne clique JAMAIS sur un bouton de
 * validation/envoi/soumission de Pennylane (seulement, si besoin, sur un
 * bouton de type "+ Ajouter une description" pour révéler un champ masqué).
 * Rapporte toujours un résultat explicite (champs remplis / non trouvés /
 * à sélectionner manuellement), jamais d'échec silencieux.
 */
async function fillQuote(stored: StoredQuote, banner: HTMLDivElement): Promise<void> {
  const { data } = stored;
  const debug = await isDebugEnabled();
  const descriptionText = buildDescriptionText(data);

  const valuesByField: Record<FieldKey, string> = {
    clientName: data.clientName,
    email: data.email,
    phone: data.phone,
    description: descriptionText,
    lineDescription: data.suggestedLine,
    vatRate: "",
  };

  const filled: FieldKey[] = [];
  const notFound: FieldKey[] = [];
  // Combobox async (Client, Produit) : on distingue "recherche tapée avec
  // succès" de "champ introuvable sur la page" — même workflow, même clic,
  // mais un rapport honnête doit pouvoir dire lequel des deux s'est produit
  // (voir renderReport). Aucune des deux catégories ne sélectionne jamais
  // d'option automatiquement, conformément à AUTOCOMPLETE_FIELDS.
  const manualSelectPrepared: FieldKey[] = [];
  const manualSelectMissing: FieldKey[] = [];
  const missingOnPage: FieldKey[] = [];
  let descriptionCopiedToClipboard = false;
  const usedElements = new Set<Element>();

  for (const key of Object.keys(FIELD_CONFIGS) as FieldKey[]) {
    const config = FIELD_CONFIGS[key];

    // "missing-on-page" (Email, Téléphone) : ce champ n'existe simplement pas
    // sur le formulaire de devis Pennylane, quel que soit le sélecteur — on
    // ne perd même pas de temps à chercher, et on l'affiche avec une
    // explication précise plutôt qu'un "non trouvé" muet.
    if (config.kind === "missing-on-page") {
      missingOnPage.push(key);
      continue;
    }

    // Description : éditeur Slate.js révélé derrière "+ Ajouter une
    // description" — on capture les éditeurs déjà visibles AVANT le clic pour
    // ne jamais confondre avec l'éditeur de "+ Ajouter un champ libre".
    if (config.kind === "richtext") {
      const previouslyVisible = captureVisibleSlateEditors();
      const toggle = findExpandToggle(config.toggleKeywords ?? []);
      if (toggle) {
        if (debug) console.log(LOG_PREFIX, "Clic sur le bouton disclosure pour révéler la description :", toggle);
        toggle.click();
        await wait(300);
      }
      const editor = resolveDescriptionEditor(previouslyVisible);
      if (debug) console.log(LOG_PREFIX, `Champ "${key}" →`, editor ? "trouvé (éditeur Slate.js)" : "non trouvé", editor);

      if (editor && fillRichTextField(editor, valuesByField[key])) {
        filled.push(key);
      } else {
        try {
          await navigator.clipboard.writeText(descriptionText);
          descriptionCopiedToClipboard = true;
        } catch (err) {
          console.error(`${LOG_PREFIX} Impossible de copier la description dans le presse-papiers :`, err);
        }
        notFound.push(key);
      }
      continue;
    }

    const resolution = resolveField(key, document, usedElements);
    if (debug) {
      console.log(LOG_PREFIX, `Champ "${key}" →`, resolution.strategyUsed ? `trouvé via ${resolution.strategyUsed}` : "non trouvé", resolution.element);
    }

    if (!resolution.element) {
      if (AUTOCOMPLETE_FIELDS.has(key)) manualSelectMissing.push(key);
      else notFound.push(key);
      continue;
    }
    usedElements.add(resolution.element);

    if (config.kind === "select-click") {
      // TVA : liste fermée et connue à l'avance (20 % par défaut en France) —
      // ouverture + clic réel sur l'option, comme un utilisateur le ferait.
      const ok = await selectReactSelectOptionByText(resolution.element, config.optionTextCandidates ?? []);
      if (ok) filled.push(key);
      else notFound.push(key);
      continue;
    }

    // "async-combobox" (Client, Produit) : on tape le texte de recherche pour
    // aider l'admin, mais on ne sélectionne JAMAIS d'option automatiquement —
    // impossible de garantir la bonne entrée (et un mauvais choix sur
    // "Produit" pourrait créer une nouvelle fiche catalogue via "Créer …").
    fillTextField(resolution.element, valuesByField[key]);
    manualSelectPrepared.push(key);
  }

  renderReport(banner, { filled, notFound, manualSelectPrepared, manualSelectMissing, missingOnPage, descriptionCopiedToClipboard });
  console.log(
    `${LOG_PREFIX} Préremplissage : ${filled.length} remplis, ${manualSelectPrepared.length} recherches préparées, ${manualSelectMissing.length + notFound.length} introuvables, ${missingOnPage.length} inexistants sur cette page.`,
    { filled, manualSelectPrepared, manualSelectMissing, notFound, missingOnPage },
  );
}

function buildDescriptionText(data: StoredQuote["data"]): string {
  return [
    `Client : ${data.clientName}`,
    `Téléphone : ${data.phone}`,
    `Email : ${data.email}`,
    `Véhicule : ${data.vehicle}`,
    data.engine ? `Motorisation : ${data.engine}` : null,
    `Type de projet : ${data.projectType}`,
    `Sonorité souhaitée : ${data.soundPreference}`,
    `Diffuseur arrière : ${data.rearDiffuser}`,
    "",
    `Message client : ${data.message}`,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

/** Ce qui a réellement été automatisé — une ligne ✓ par action concrète, jamais un score. */
const DONE_LABELS: Partial<Record<FieldKey, string>> = {
  description: "Description ajoutée",
  vatRate: "TVA 20 % sélectionnée",
  clientName: "Recherche du client préparée",
  lineDescription: "Recherche du produit préparée",
};

/** Message explicite quand une action automatisable a concrètement échoué (jamais "champ non rempli"). */
const FAILURE_MESSAGES: Partial<Record<FieldKey, string>> = {
  vatRate: "Impossible de sélectionner automatiquement la TVA.",
};

/** Ce qu'il reste à faire dans Pennylane pour chaque champ à sélection manuelle, selon qu'une recherche a pu être tapée ou non. */
const TODO_PREPARED_LABELS: Partial<Record<FieldKey, string>> = {
  clientName: "sélectionner le client proposé",
  lineDescription: "sélectionner le produit",
};
const TODO_MISSING_LABELS: Partial<Record<FieldKey, string>> = {
  clientName: "rechercher et sélectionner le client manuellement",
  lineDescription: "rechercher et sélectionner le produit manuellement",
};

/** Actions qui restent toujours nécessaires, quel que soit ce qui a pu être automatisé : jamais de prix, jamais d'envoi automatique. */
const ALWAYS_TODO = ["renseigner le prix HT", "vérifier le devis", "enregistrer le devis"];

/** Formulation courte pour l'admin — la justification technique détaillée reste dans FIELD_CONFIGS[key].missingReason (mode debug). */
const MISSING_ON_PAGE_SHORT_REASONS: Partial<Record<FieldKey, string>> = {
  email: "Non présent sur la page de création d'un devis Pennylane.",
  phone: "Non présent sur cette page.",
};

interface FillResult {
  filled: FieldKey[];
  notFound: FieldKey[];
  manualSelectPrepared: FieldKey[];
  manualSelectMissing: FieldKey[];
  missingOnPage: FieldKey[];
  descriptionCopiedToClipboard: boolean;
}

/**
 * Rapport toujours visible et explicite — jamais de succès/échec silencieux,
 * et jamais de score façon "2/6 champs remplis" : Pennylane n'expose tout
 * simplement pas certains champs à l'automatisation (Email/Téléphone) ou
 * exige une sélection humaine dans une liste (Client/Produit) — ce n'est pas
 * un échec de l'extension, donc ce n'est jamais présenté comme tel.
 */
function renderReport(banner: HTMLDivElement, result: FillResult): void {
  const report = banner.querySelector<HTMLDivElement>("[data-pe-report]");
  if (!report) return;
  report.hidden = false;

  const { filled, notFound, manualSelectPrepared, manualSelectMissing, missingOnPage, descriptionCopiedToClipboard } = result;

  // Un vrai échec = une action automatisable qui a concrètement raté (TVA).
  // La description qui retombe sur le presse-papiers a déjà un plan B utile :
  // ce n'est pas présenté comme un échec, juste comme une étape "info".
  const hardFailures: FieldKey[] = notFound.filter((k) => k !== "description");

  const doneItems = [...filled, ...manualSelectPrepared]
    .filter((k) => !hardFailures.includes(k))
    .map((k) => DONE_LABELS[k] ?? FIELD_CONFIGS[k].displayName);

  const failureItems = hardFailures.map((k) => FAILURE_MESSAGES[k] ?? `Impossible de préremplir automatiquement « ${FIELD_CONFIGS[k].displayName} ».`);

  const infoItems: string[] = [];
  if (descriptionCopiedToClipboard) {
    infoItems.push("Description copiée dans le presse-papiers — cliquez sur « + Ajouter une description » dans Pennylane puis collez (Cmd/Ctrl+V).");
  }
  for (const key of missingOnPage) {
    // Reformulation courte pour l'admin — la justification technique complète
    // (FIELD_CONFIGS[key].missingReason) reste disponible en mode debug.
    const reason = MISSING_ON_PAGE_SHORT_REASONS[key] ?? "Non présent sur cette page.";
    infoItems.push(`<strong>${escapeHtml(FIELD_CONFIGS[key].displayName)} :</strong> ${escapeHtml(reason)}`);
  }

  const todoItems = [
    ...manualSelectPrepared.map((k) => TODO_PREPARED_LABELS[k] ?? `sélectionner « ${FIELD_CONFIGS[k].displayName} »`),
    ...manualSelectMissing.map((k) => TODO_MISSING_LABELS[k] ?? `rechercher et sélectionner « ${FIELD_CONFIGS[k].displayName} » manuellement`),
    ...ALWAYS_TODO,
  ];

  const headerHtml = hardFailures.length === 0
    ? `
      <p class="pe-report__lead">Préremplissage terminé.</p>
      <p class="pe-report__sub">Les éléments pouvant être automatisés ont été préparés. Il reste uniquement les actions nécessitant une validation humaine.</p>
    `
    : `
      <p class="pe-report__lead pe-report__lead--partial">Préremplissage partiel.</p>
      <p class="pe-report__sub">Certains éléments n'ont pas pu être automatisés sur cette page — voir ci-dessous.</p>
    `;

  const sections: string[] = [headerHtml];

  if (doneItems.length > 0) {
    sections.push(`
      <ul class="pe-report__list pe-report__list--done">
        ${doneItems.map((label) => `<li>${escapeHtml(label)}</li>`).join("")}
      </ul>
    `);
  }

  if (failureItems.length > 0) {
    sections.push(`
      <ul class="pe-report__list pe-report__list--warning">
        ${failureItems.map((label) => `<li>${escapeHtml(label)}</li>`).join("")}
      </ul>
    `);
  }

  if (infoItems.length > 0) {
    sections.push(`
      <ul class="pe-report__list pe-report__list--info">
        ${infoItems.map((label) => `<li>${label}</li>`).join("")}
      </ul>
    `);
  }

  sections.push(`<div class="pe-report__divider"></div>`);
  sections.push(`
    <p class="pe-report__todo-title">À compléter dans Pennylane :</p>
    <ul class="pe-report__list pe-report__list--todo">
      ${todoItems.map((label) => `<li>${escapeHtml(label)}</li>`).join("")}
    </ul>
  `);

  report.innerHTML = `<div class="pe-report">${sections.join("\n")}</div>`;
}

function renderForStored(stored: StoredQuote | undefined): void {
  if (!stored) {
    removeBanner();
    return;
  }
  if (isExpired(stored)) {
    renderExpiredBanner(stored);
    return;
  }
  if (dismissedForPreparedAt === stored.preparedAt) return; // déjà fermé par l'admin pour ce lot précis
  renderReadyBanner(stored);
}

async function readStored(): Promise<StoredQuote | undefined> {
  const result = await chrome.storage.session.get(STORAGE_KEY);
  return result[STORAGE_KEY] as StoredQuote | undefined;
}

async function init(): Promise<void> {
  await debugLog("Content script Pennylane chargé sur", window.location.href);

  // Toujours enregistrer l'écouteur de changement AVANT la lecture initiale,
  // et même si celle-ci échoue : si ce content script se charge juste avant
  // que le service worker ait appliqué chrome.storage.session.setAccessLevel()
  // (course possible au tout premier chargement de l'extension/du navigateur),
  // la lecture ci-dessous peut échouer une fois — mais sans cet écouteur déjà
  // en place, cet onglet ne réagirait plus JAMAIS aux données préparées
  // ensuite, même après un accès rétabli. C'est exactement le bug observé :
  // bandeau absent alors que le popup affichait "Données prêtes".
  chrome.storage.session.onChanged.addListener((changes) => {
    if (!(STORAGE_KEY in changes)) return;
    const next = changes[STORAGE_KEY].newValue as StoredQuote | undefined;
    console.log(`${LOG_PREFIX} chrome.storage.session mis à jour, ré-affichage du bandeau.`);
    renderForStored(next);
  });

  let stored: StoredQuote | undefined;
  try {
    stored = await readStored();
  } catch (err) {
    console.error(`${LOG_PREFIX} Lecture initiale de chrome.storage.session refusée (probablement un démarrage trop rapide) :`, err);
    await wait(300);
    try {
      stored = await readStored();
      console.log(`${LOG_PREFIX} Nouvelle tentative de lecture réussie.`);
    } catch (err2) {
      console.error(`${LOG_PREFIX} Deuxième tentative de lecture également refusée — le bandeau apparaîtra dès le prochain changement (onChanged reste actif) :`, err2);
    }
  }

  if (!stored) {
    await debugLog("Aucune donnée PERF'EXHAUST en attente au chargement — le bandeau apparaîtra dès qu'une demande sera préparée.");
  } else {
    await debugLog("Données trouvées au chargement :", stored);
  }
  renderForStored(stored);

  // Filet de sécurité pour les SPA (comme Pennylane) qui peuvent, lors d'une
  // navigation interne, re-rendre des portions du DOM et supprimer notre
  // bandeau même si les données restent valides.
  const observer = new MutationObserver(() => {
    if (document.getElementById(BANNER_ID)) return;
    readStored()
      .then((current) => {
        if (current && !isExpired(current) && dismissedForPreparedAt !== current.preparedAt) {
          renderReadyBanner(current);
        }
      })
      .catch(() => {
        // Lecture ponctuellement indisponible — l'écouteur onChanged reprendra le relais.
      });
  });
  observer.observe(document.body, { childList: true, subtree: false });
}

void init();
