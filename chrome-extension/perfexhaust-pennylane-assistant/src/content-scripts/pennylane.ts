import { DEBUG_STORAGE_KEY, QUOTE_TTL_MS, STORAGE_KEY, isExpired, type StoredQuote } from "../shared-types";
import { AUTOCOMPLETE_FIELDS, FIELD_CONFIGS, VAT_OPTION_TEXT_CANDIDATES, fillTextField, findExpandToggle, resolveField, selectOptionByText, type FieldKey } from "./pennylane-selectors";

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
  const manualSelect: FieldKey[] = [];
  let descriptionCopiedToClipboard = false;
  const usedElements = new Set<Element>();

  for (const key of Object.keys(FIELD_CONFIGS) as FieldKey[]) {
    let resolution = resolveField(key, document, usedElements);

    // Champ probablement masqué derrière un bouton disclosure (ex: description) :
    // on essaie de le révéler, jamais de bouton "Enregistrer"/"Envoyer".
    if (!resolution.element && key === "description") {
      const toggle = findExpandToggle(["ajouter une description"]);
      if (toggle) {
        if (debug) console.log(LOG_PREFIX, "Clic sur le bouton disclosure pour révéler la description :", toggle);
        toggle.click();
        await wait(300);
        resolution = resolveField(key, document, usedElements);
      }
    }

    if (debug) {
      console.log(LOG_PREFIX, `Champ "${key}" →`, resolution.strategyUsed ? `trouvé via ${resolution.strategyUsed}` : "non trouvé", resolution.element);
    }

    if (!resolution.element) {
      if (key === "description") {
        // Dernier recours explicitement demandé : copier dans le presse-papiers
        // plutôt que de laisser l'admin sans aucune info exploitable.
        try {
          await navigator.clipboard.writeText(descriptionText);
          descriptionCopiedToClipboard = true;
        } catch (err) {
          console.error(`${LOG_PREFIX} Impossible de copier la description dans le presse-papiers :`, err);
        }
      }
      if (AUTOCOMPLETE_FIELDS.has(key)) manualSelect.push(key);
      else notFound.push(key);
      continue;
    }

    usedElements.add(resolution.element);
    const ok = key === "vatRate"
      ? selectOptionByText(resolution.element, VAT_OPTION_TEXT_CANDIDATES)
      : fillTextField(resolution.element, valuesByField[key]);

    if (AUTOCOMPLETE_FIELDS.has(key)) {
      // Trouvé et éventuellement pré-rempli pour aider la recherche, mais on
      // ne prétend jamais qu'une sélection réelle a été faite dans la liste.
      manualSelect.push(key);
    } else if (ok) {
      filled.push(key);
    } else {
      notFound.push(key);
    }
  }

  renderReport(banner, { filled, notFound, manualSelect, descriptionCopiedToClipboard });
  console.log(`${LOG_PREFIX} Préremplissage : ${filled.length} remplis, ${manualSelect.length} à sélectionner manuellement, ${notFound.length} non trouvés.`, { filled, manualSelect, notFound });
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
    "",
    `Message client : ${data.message}`,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

const MANUAL_SELECT_LABELS: Partial<Record<FieldKey, string>> = {
  clientName: "Client à sélectionner manuellement",
  lineDescription: "Produit à sélectionner manuellement",
};

interface FillResult {
  filled: FieldKey[];
  notFound: FieldKey[];
  manualSelect: FieldKey[];
  descriptionCopiedToClipboard: boolean;
}

/** Rapport toujours visible et explicite — jamais de succès/échec silencieux. */
function renderReport(banner: HTMLDivElement, result: FillResult): void {
  const report = banner.querySelector<HTMLDivElement>("[data-pe-report]");
  if (!report) return;
  report.hidden = false;

  const { filled, notFound, manualSelect, descriptionCopiedToClipboard } = result;
  const total = filled.length + notFound.length + manualSelect.length;
  const summary = `${filled.length}/${total} champs remplis automatiquement.`;

  const lines: string[] = [];
  if (manualSelect.length > 0) {
    for (const key of manualSelect) {
      lines.push(`<p class="pe-banner__missing">${escapeHtml(MANUAL_SELECT_LABELS[key] ?? `${FIELD_CONFIGS[key].displayName} à sélectionner manuellement`)}.</p>`);
    }
  }
  if (descriptionCopiedToClipboard) {
    lines.push(`<p class="pe-banner__missing">Description copiée dans le presse-papiers — cliquez sur « + Ajouter une description » dans Pennylane puis collez (Cmd/Ctrl+V).</p>`);
  }
  if (notFound.length > 0) {
    lines.push(`<p class="pe-banner__missing">À compléter manuellement : ${notFound.map((k) => escapeHtml(FIELD_CONFIGS[k].displayName)).join(", ")}.</p>`);
  }
  if (lines.length === 0) {
    lines.push(`<p class="pe-banner__missing pe-banner__missing--ok">Tous les champs détectés ont été remplis.</p>`);
  }

  report.innerHTML = `
    <p class="pe-banner__summary">${escapeHtml(summary)}</p>
    ${lines.join("\n")}
    <p class="pe-banner__reminder">Vérifiez le prix et validez vous-même dans Pennylane — l'extension ne le fait jamais.</p>
  `;
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
