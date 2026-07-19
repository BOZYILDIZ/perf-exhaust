/**
 * Type partagé entre les deux content scripts (admin PERF'EXHAUST et
 * Pennylane) — doit rester synchronisé avec
 * src/lib/pennylane/extension-data.ts côté site (PennylaneExtensionQuoteData).
 */
export interface PerfexhaustQuoteData {
  quoteRequestId: string;
  clientName: string;
  email: string;
  phone: string;
  vehicle: string;
  brand: string;
  model: string;
  year: string;
  engine: string;
  projectType: string;
  soundPreference: string;
  rearDiffuser: string;
  message: string;
  suggestedLine: string;
  vatRate: number;
}

/** Enveloppe stockée dans chrome.storage.session — ajoute l'horodatage de préparation. */
export interface StoredQuote {
  data: PerfexhaustQuoteData;
  preparedAt: number;
}

export const STORAGE_KEY = "perfexhaustQuote";
export const DEBUG_STORAGE_KEY = "perfexhaustDebug";

/** Au-delà de cette durée, les données sont considérées périmées (voir mission § tests "données expirées"). */
export const QUOTE_TTL_MS = 30 * 60 * 1000; // 30 minutes

export function isExpired(stored: StoredQuote): boolean {
  return Date.now() - stored.preparedAt > QUOTE_TTL_MS;
}
