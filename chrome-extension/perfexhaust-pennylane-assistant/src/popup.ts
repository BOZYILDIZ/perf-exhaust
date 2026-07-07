import { DEBUG_STORAGE_KEY, QUOTE_TTL_MS, STORAGE_KEY, isExpired, type StoredQuote } from "./shared-types";

const statusEl = document.getElementById("pe-popup-status") as HTMLDivElement;
const clearButton = document.getElementById("pe-popup-clear") as HTMLButtonElement;
const debugCheckbox = document.getElementById("pe-popup-debug") as HTMLInputElement;

function escapeHtml(value: string): string {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

async function renderStatus(): Promise<void> {
  let result: Record<string, unknown>;
  try {
    result = await chrome.storage.session.get(STORAGE_KEY);
  } catch (err) {
    statusEl.innerHTML = `<p class="pe-popup__status-line pe-popup__status-line--error">Erreur de lecture des données : ${escapeHtml(String(err))}</p>`;
    clearButton.disabled = true;
    return;
  }

  const stored = result[STORAGE_KEY] as StoredQuote | undefined;

  if (!stored) {
    statusEl.innerHTML = `
      <p class="pe-popup__status-line">Aucune donnée en attente.</p>
      <p class="pe-popup__status-hint">Ouvrez une demande sur perfexhaust.fr/admin/devis puis cliquez sur « Préparer Pennylane ».</p>
    `;
    clearButton.disabled = true;
    return;
  }

  clearButton.disabled = false;

  if (isExpired(stored)) {
    const minutesAgo = Math.round((Date.now() - stored.preparedAt) / 60000);
    statusEl.innerHTML = `
      <p class="pe-popup__status-line pe-popup__status-line--warning">Données expirées (${minutesAgo} min, limite ${Math.round(QUOTE_TTL_MS / 60000)} min).</p>
      <p class="pe-popup__status-hint">Repréparez-les depuis /admin/devis pour les rafraîchir.</p>
    `;
    return;
  }

  const preparedAgo = Math.round((Date.now() - stored.preparedAt) / 60000);
  statusEl.innerHTML = `
    <p class="pe-popup__status-line pe-popup__status-line--ok">Données prêtes ✓</p>
    <p class="pe-popup__status-detail"><strong>${escapeHtml(stored.data.clientName)}</strong></p>
    <p class="pe-popup__status-detail">${escapeHtml(stored.data.vehicle)}</p>
    <p class="pe-popup__status-hint">Préparées il y a ${preparedAgo} min.</p>
  `;
}

clearButton.addEventListener("click", async () => {
  await chrome.storage.session.remove(STORAGE_KEY);
  await renderStatus();
});

debugCheckbox.addEventListener("change", async () => {
  await chrome.storage.local.set({ [DEBUG_STORAGE_KEY]: debugCheckbox.checked });
});

async function init(): Promise<void> {
  const { [DEBUG_STORAGE_KEY]: debug } = await chrome.storage.local.get(DEBUG_STORAGE_KEY);
  debugCheckbox.checked = Boolean(debug);
  await renderStatus();
}

void init();
