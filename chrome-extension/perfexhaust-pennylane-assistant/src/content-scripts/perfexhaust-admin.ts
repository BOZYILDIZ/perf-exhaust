import { DEBUG_STORAGE_KEY, STORAGE_KEY, type PerfexhaustQuoteData, type StoredQuote } from "../shared-types";

const LOG_PREFIX = "[PERF'EXHAUST Assistant]";

// Log inconditionnel (pas derrière le flag debug) : sert à prouver que le
// content script a bien été injecté sur cette page — la première chose à
// vérifier quand "Préparer Pennylane" semble ne rien faire.
console.log(`${LOG_PREFIX} content script loaded (perfexhaust-admin.ts) — ${window.location.href}`);

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

/**
 * Lit le script `#perfexhaust-quote-data` injecté par le serveur (voir
 * src/lib/pennylane/extension-data.ts côté site) — jamais exécuté, jamais
 * transmis à un serveur tiers, uniquement lu et recopié dans
 * chrome.storage.session (temporaire, effacé à la fermeture du navigateur).
 */
function readQuoteData(): PerfexhaustQuoteData | null {
  const el = document.getElementById("perfexhaust-quote-data");
  if (!el || !el.textContent) {
    console.error(`${LOG_PREFIX} Bouton "Préparer Pennylane" cliqué mais aucune donnée trouvée sur la page (script #perfexhaust-quote-data absent). Rechargez la page et réessayez.`);
    return null;
  }
  try {
    const parsed = JSON.parse(el.textContent) as Partial<PerfexhaustQuoteData>;
    if (!parsed.quoteRequestId || !parsed.clientName) {
      console.error(`${LOG_PREFIX} Données incomplètes lues sur la page :`, parsed);
      return null;
    }
    return parsed as PerfexhaustQuoteData;
  } catch (err) {
    console.error(`${LOG_PREFIX} Impossible de lire les données de la demande (JSON invalide) :`, err);
    return null;
  }
}

async function handleQuoteReady(): Promise<void> {
  console.log(`${LOG_PREFIX} événement "perfexhaust:quote-ready" reçu`);
  const data = readQuoteData();
  if (!data) return; // déjà journalisé dans readQuoteData — jamais d'échec silencieux
  console.log(`${LOG_PREFIX} données JSON trouvées et valides pour`, data.clientName);

  const stored: StoredQuote = { data, preparedAt: Date.now() };
  try {
    await chrome.storage.session.set({ [STORAGE_KEY]: stored });
    console.log(`${LOG_PREFIX} chrome.storage.session.set() réussi`);
    await debugLog("Données sauvegardées dans chrome.storage.session :", stored);
    // Confirme à la page React que l'extension a bien reçu les données —
    // affiche une confirmation concrète plutôt qu'un message optimiste.
    window.dispatchEvent(new CustomEvent("perfexhaust:extension-ack"));
    console.log(`${LOG_PREFIX} événement "perfexhaust:extension-ack" envoyé à la page`);
  } catch (err) {
    console.error(`${LOG_PREFIX} Échec de la sauvegarde des données (chrome.storage.session) :`, err);
  }
}

window.addEventListener("perfexhaust:quote-ready", () => {
  void handleQuoteReady();
});

void debugLog("Content script admin PERF'EXHAUST chargé sur", window.location.href);
