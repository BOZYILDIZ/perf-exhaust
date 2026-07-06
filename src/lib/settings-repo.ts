import { cache } from 'react'
import { getDb, isDbConfigured } from '@/lib/db'
import { FALLBACK_SETTINGS, type SiteSettingsData } from '@/data/settings'

export type { SiteSettingsData }
export { FALLBACK_SETTINGS }

const SETTINGS_ID = 'singleton'

/**
 * Paramètres du site — DB si configurée et une ligne existe, sinon repli sur
 * les valeurs codées en dur (FALLBACK_SETTINGS). `cache()` déduplique les
 * appels multiples dans un même rendu (layout + page consomment tous deux
 * ces paramètres).
 */
export const getSiteSettings = cache(async function getSiteSettings(): Promise<SiteSettingsData> {
  if (!isDbConfigured()) return FALLBACK_SETTINGS
  try {
    const row = await getDb().siteSettings.findUnique({ where: { id: SETTINGS_ID } })
    if (!row) return FALLBACK_SETTINGS
    return {
      businessName: row.businessName,
      phone: row.phone,
      email: row.email,
      address: row.address,
      postalCode: row.postalCode,
      city: row.city,
      instagramUrl: row.instagramUrl,
      tiktokUrl: row.tiktokUrl,
      googleReviewsUrl: row.googleReviewsUrl,
      shiftechUrl: row.shiftechUrl,
      openingHours: row.openingHours,
      legalForm: row.legalForm,
      siret: row.siret,
      publicationDirector: row.publicationDirector,
      pennylaneManualUrl: row.pennylaneManualUrl,
    }
  } catch (error) {
    console.error('[settings-repo] Lecture SiteSettings échouée, repli sur les valeurs par défaut:', error)
    return FALLBACK_SETTINGS
  }
})

/** Upsert de la ligne unique de paramètres (utilisé par /api/admin/settings). */
export async function saveSiteSettings(data: SiteSettingsData): Promise<void> {
  await getDb().siteSettings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, ...data },
    update: data,
  })
}
