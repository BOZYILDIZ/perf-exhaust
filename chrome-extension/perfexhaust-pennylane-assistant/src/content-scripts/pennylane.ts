import { DEBUG_STORAGE_KEY, QUOTE_TTL_MS, STORAGE_KEY, isExpired, type StoredQuote } from "../shared-types";
import { FIELD_CONFIGS, VAT_OPTION_TEXT_CANDIDATES, fillTextField, resolveField, selectOptionByText, type FieldKey } from "./pennylane-selectors";

const LOG_PREFIX = "[PERF'EXHAUST Assistant]";
const BANNER_ID = "perfexhaust-pennylane-banner";

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
  bindDismiss(banner);
}

function renderReadyBanner(stored: StoredQuote): void {
  const banner = createBanner();
  banner.innerHTML = `
    <div class="pe-banner pe-banner--ready">
      <div class="pe-banner__header">
        <span class="pe-banner__title">Données PERF'EXHAUST détectées</span>
        <button type="button" class="pe-banner__close" data-pe-action="dismiss" aria-label="Fermer">×</button>
      </div>
      <p class="pe-banner__text">${escapeHtml(stored.data.clientName)} — ${escapeHtml(stored.data.vehicle)}</p>
      <button type="button" class="pe-banner__button" data-pe-action="fill">Préremplir le devis</button>
      <div class="pe-banner__report" data-pe-report hidden></div>
    </div>
  `;
  bindDismiss(banner);
  banner.querySelector('[data-pe-action="fill"]')?.addEventListener("click", () => {
    void fillQuote(stored, banner);
  });
}

function bindDismiss(banner: HTMLDivElement): void {
  banner.querySelector('[data-pe-action="dismiss"]')?.addEventListener("click", () => banner.remove());
}

/**
 * Prérempile les champs disponibles — ne clique JAMAIS sur un bouton de
 * validation/envoi/soumission de Pennylane. Rapporte toujours un résultat
 * explicite (champs remplis / non trouvés), jamais d'échec silencieux.
 */
async function fillQuote(stored: StoredQuote, banner: HTMLDivElement): Promise<void> {
  const { data } = stored;
  const debug = await isDebugEnabled();

  const valuesByField: Record<FieldKey, string> = {
    clientName: data.clientName,
    email: data.email,
    phone: data.phone,
    description: buildDescriptionText(data),
    lineDescription: data.suggestedLine,
    vatRate: "",
  };

  const filled: FieldKey[] = [];
  const notFound: FieldKey[] = [];

  for (const key of Object.keys(FIELD_CONFIGS) as FieldKey[]) {
    const resolution = resolveField(key);
    if (debug) {
      console.log(LOG_PREFIX, `Champ "${key}" →`, resolution.strategyUsed ? `trouvé via ${resolution.strategyUsed}` : "non trouvé", resolution.element);
    }
    if (!resolution.element) {
      notFound.push(key);
      continue;
    }

    const ok = key === "vatRate"
      ? selectOptionByText(resolution.element, VAT_OPTION_TEXT_CANDIDATES)
      : fillTextField(resolution.element, valuesByField[key]);

    if (ok) filled.push(key);
    else notFound.push(key);
  }

  renderReport(banner, filled, notFound);
  console.log(`${LOG_PREFIX} Préremplissage : ${filled.length}/${Object.keys(FIELD_CONFIGS).length} champs remplis.`, { filled, notFound });
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

/** Rapport toujours visible et explicite — jamais de succès/échec silencieux. */
function renderReport(banner: HTMLDivElement, filled: FieldKey[], notFound: FieldKey[]): void {
  const report = banner.querySelector<HTMLDivElement>("[data-pe-report]");
  if (!report) return;
  report.hidden = false;

  const total = filled.length + notFound.length;
  const summary = `${filled.length}/${total} champs remplis automatiquement.`;
  const missingList = notFound.length > 0
    ? `<p class="pe-banner__missing">À compléter manuellement : ${notFound.map((k) => escapeHtml(FIELD_CONFIGS[k].displayName)).join(", ")}.</p>`
    : `<p class="pe-banner__missing pe-banner__missing--ok">Tous les champs détectés ont été remplis.</p>`;

  report.innerHTML = `
    <p class="pe-banner__summary">${escapeHtml(summary)}</p>
    ${missingList}
    <p class="pe-banner__reminder">Vérifiez le prix et validez vous-même dans Pennylane — l'extension ne le fait jamais.</p>
  `;
}

async function init(): Promise<void> {
  await debugLog("Content script Pennylane chargé sur", window.location.href);
  let result: Record<string, unknown>;
  try {
    result = await chrome.storage.session.get(STORAGE_KEY);
  } catch (err) {
    console.error(`${LOG_PREFIX} Impossible de lire chrome.storage.session :`, err);
    return;
  }

  const stored = result[STORAGE_KEY] as StoredQuote | undefined;
  if (!stored) {
    await debugLog("Aucune donnée PERF'EXHAUST en attente.");
    return;
  }

  if (isExpired(stored)) {
    await debugLog("Données trouvées mais expirées :", stored);
    renderExpiredBanner(stored);
    return;
  }

  await debugLog("Données prêtes :", stored);
  renderReadyBanner(stored);
}

void init();
