import type { PennylaneErrorBody } from './types'

/**
 * Erreur typée pour tout appel Pennylane API v2 — jamais de message brut de
 * l'API renvoyé tel quel au client public (voir `toAdminMessage` réservé au
 * panel admin, et `toPublicSafeMessage` pour toute surface potentiellement
 * publique, qui ne doit jamais exister mais reste définie par prudence).
 */
export class PennylaneApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly details?: Record<string, unknown>
  /** Vrai pour 429/5xx — indique qu'une nouvelle tentative a du sens (voir http-client.ts). */
  readonly retryable: boolean

  constructor(status: number, body: PennylaneErrorBody | null, rawMessage?: string) {
    super(body?.message || rawMessage || `Erreur Pennylane (HTTP ${status})`)
    this.name = 'PennylaneApiError'
    this.status = status
    this.code = body?.error
    this.details = body?.details
    this.retryable = status === 429 || status >= 500
  }

  /** Message affiché à l'admin dans le panel — jamais le corps brut de l'erreur API. */
  toAdminMessage(): string {
    switch (this.status) {
      case 400:
        // Le message Pennylane pour un 400 est concret et actionnable (ex:
        // "Missing required fields: billing_address.address, ...") — confirmé
        // en conditions réelles (voir docs/MAINTENANCE.md § "Limites connues") :
        // jamais masqué par un message générique, contrairement aux autres codes.
        return `Données rejetées par Pennylane : ${this.message}`
      case 401:
        return "Le token API Pennylane est invalide ou expiré — vérifiez PENNYLANE_API_TOKEN."
      case 403:
        return "Le token API Pennylane n'a pas les permissions nécessaires (scopes clients/devis/factures)."
      case 404:
        return "Ressource introuvable dans Pennylane (client, devis ou facture supprimé ?)."
      case 409:
        return "Conflit Pennylane — la ressource existe peut-être déjà."
      case 422:
        return `Données refusées par Pennylane${this.code ? ` (${this.code})` : ''} — vérifiez les champs envoyés.`
      case 429:
        return 'Trop de requêtes envoyées à Pennylane (limite de débit atteinte) — nouvelle tentative recommandée.'
      default:
        if (this.status >= 500) return 'Pennylane est temporairement indisponible.'
        return 'Erreur inattendue lors de la communication avec Pennylane.'
    }
  }
}

/** Erreur de timeout réseau — distincte de PennylaneApiError (aucun code HTTP reçu). */
export class PennylaneTimeoutError extends Error {
  constructor() {
    super('Délai dépassé lors de la communication avec Pennylane.')
    this.name = 'PennylaneTimeoutError'
  }
}

/**
 * Précondition locale non satisfaite avant même d'appeler Pennylane (ex:
 * adresse postale manquante pour créer un client) — le message est écrit
 * pour être affiché tel quel à l'admin, contrairement aux erreurs API/réseau.
 */
export class PennylanePreconditionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PennylanePreconditionError'
  }
}

export function pennylaneErrorToAdminMessage(err: unknown): string {
  if (err instanceof PennylaneApiError) return err.toAdminMessage()
  if (err instanceof PennylaneTimeoutError) return err.message
  if (err instanceof PennylanePreconditionError) return err.message
  return 'Erreur inattendue lors de la communication avec Pennylane.'
}
