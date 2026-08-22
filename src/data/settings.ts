import { SOCIAL_LINKS, GOOGLE_REVIEWS_URL } from '@/data/social'

export interface SiteSettingsData {
  businessName: string
  phone: string
  email: string
  address: string
  postalCode: string
  city: string
  instagramUrl: string
  tiktokUrl: string
  googleReviewsUrl: string
  shiftechUrl: string
  openingHours: string
  legalForm: string
  siret: string
  publicationDirector: string
  /** Mode manuel Pennylane — URL ouverte par le bouton "Ouvrir Pennylane". */
  pennylaneManualUrl: string

  /** Relances commerciales (devis envoyé sans évolution) — voir src/lib/quote-followup.ts. */
  followupDelay1Days: number
  followupDelay2Days: number
  followupAutomationEnabled: boolean

  /** Rappels de rendez-vous — voir src/lib/agenda/reminders.ts. */
  reminder24hEnabled: boolean
  reminder1hEnabled: boolean

  /** Demande d'avis Google après restitution du véhicule. */
  reviewRequestEnabled: boolean
  reviewRequestDelayHours: number
}

/**
 * Valeurs actuelles codées en dur ailleurs dans le site (Header, Footer,
 * JSON-LD, mentions légales...) — utilisées tant qu'aucune ligne SiteSettings
 * n'existe en base (src/lib/settings-repo.ts) et pour amorcer la base
 * (scripts/seed-settings.ts).
 */
export const FALLBACK_SETTINGS: SiteSettingsData = {
  businessName: "PERF'EXHAUST",
  phone: '+33636523058',
  email: 'contact@perfexhaust.fr',
  address: '30 Rue de Soufflenheim',
  postalCode: '67480',
  city: 'Rountzenheim-Auenheim',
  instagramUrl: SOCIAL_LINKS.instagram,
  tiktokUrl: SOCIAL_LINKS.tiktok,
  googleReviewsUrl: GOOGLE_REVIEWS_URL,
  shiftechUrl: 'https://www.shiftech.eu',
  openingHours: 'Lun–Ven : 8h–18h (sur rendez-vous)',
  legalForm: '',
  siret: '882 838 667 00021',
  publicationDirector: '',
  pennylaneManualUrl: 'https://app.pennylane.com/',
  followupDelay1Days: 3,
  followupDelay2Days: 7,
  followupAutomationEnabled: false,
  reminder24hEnabled: false,
  reminder1hEnabled: false,
  reviewRequestEnabled: false,
  reviewRequestDelayHours: 24,
}
