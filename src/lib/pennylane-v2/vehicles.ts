/**
 * Historique des véhicules d'un client — dérivé uniquement des demandes
 * locales PERF'EXHAUST (marque/modèle/année/motorisation), jamais de
 * Pennylane (qui n'a aucune notion de véhicule). Un même véhicule (marque +
 * modèle + année identiques, motorisation ignorée pour la déduplication —
 * une même voiture peut être décrite avec une motorisation légèrement
 * différente d'une demande à l'autre) ne doit jamais apparaître deux fois.
 */

export interface VehicleSource {
  marque: string
  modele: string
  annee: string
  motorisation: string | null
}

export interface VehicleHistoryEntry {
  marque: string
  modele: string
  annee: string
  motorisation: string | null
  requestCount: number
}

function vehicleKey(v: VehicleSource): string {
  return `${v.marque.trim().toLowerCase()}|${v.modele.trim().toLowerCase()}|${v.annee.trim()}`
}

export function buildVehicleHistory(requests: VehicleSource[]): VehicleHistoryEntry[] {
  const byKey = new Map<string, VehicleHistoryEntry>()
  for (const r of requests) {
    const key = vehicleKey(r)
    const existing = byKey.get(key)
    if (existing) {
      existing.requestCount += 1
      if (!existing.motorisation && r.motorisation) existing.motorisation = r.motorisation
    } else {
      byKey.set(key, { marque: r.marque, modele: r.modele, annee: r.annee, motorisation: r.motorisation, requestCount: 1 })
    }
  }
  return Array.from(byKey.values()).sort((a, b) => b.requestCount - a.requestCount)
}
