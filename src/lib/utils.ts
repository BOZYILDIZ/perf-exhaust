import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // supprime les diacritiques (é→e, è→e, ç→c, ...)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('fr-FR', { year: 'numeric', month: 'long' }).format(new Date(date))
}

/**
 * Une image de projet est « réelle » si c'est une URL http(s) (upload Vercel
 * Blob ou URL externe saisie dans l'admin). Les chemins relatifs historiques
 * (/images/projects/...) pointent vers des fichiers inexistants : on garde
 * alors le placeholder premium plutôt qu'une image cassée.
 */
export function isRealImage(src?: string | null): src is string {
  return typeof src === 'string' && /^https?:\/\//.test(src)
}

/** Image de couverture d'un projet : imagePrincipale, sinon 1ʳᵉ image réelle de la galerie. */
export function projectCoverImage(p: {
  imagePrincipale?: string
  imageAlt?: string
  images: { src: string; alt: string }[]
}): { src: string; alt: string } | null {
  if (isRealImage(p.imagePrincipale)) {
    return { src: p.imagePrincipale, alt: p.imageAlt || 'Réalisation PERF\'EXHAUST' }
  }
  const first = p.images.find((img) => isRealImage(img.src))
  return first ? { src: first.src, alt: first.alt } : null
}
