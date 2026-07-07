import { STORAGE_KEY } from "./shared-types";

/**
 * Service worker minimal : met à jour le badge de l'icône de l'extension
 * pour indiquer visuellement qu'une demande PERF'EXHAUST est en attente de
 * préremplissage. Ne fait ni requête réseau, ni traitement de données —
 * se contente de refléter l'état de chrome.storage.session.
 */
function setBadge(pending: boolean): void {
  if (pending) {
    chrome.action.setBadgeText({ text: "1" });
    chrome.action.setBadgeBackgroundColor({ color: "#1266EA" });
  } else {
    chrome.action.setBadgeText({ text: "" });
  }
}

// chrome.storage.session est réservé aux contextes de confiance (service worker,
// pages d'extension) par défaut — les content scripts (perfexhaust-admin.ts,
// pennylane.ts) n'y ont accès qu'une fois ce niveau explicitement relevé ici.
chrome.storage.session.setAccessLevel({ accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS" });

chrome.storage.session.onChanged.addListener((changes) => {
  if (!(STORAGE_KEY in changes)) return;
  setBadge(Boolean(changes[STORAGE_KEY].newValue));
});

// Reflète l'état déjà présent au démarrage du service worker (ex: après un rechargement de l'extension).
chrome.storage.session.get(STORAGE_KEY).then((result) => {
  setBadge(Boolean(result[STORAGE_KEY]));
});
