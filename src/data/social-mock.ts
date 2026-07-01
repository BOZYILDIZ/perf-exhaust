import type { SocialPost } from '@/types'

export const mockSocialPosts: SocialPost[] = [
  {
    id: 'ig-1',
    platform: 'instagram',
    thumbnail: '/images/social/post-1.jpg',
    url: 'https://www.instagram.com/perfexhaust67/',
    caption: '🔥 Nouvelle ligne complète inox sur Golf GTI — Son sportif parfait. Travail de précision en atelier.',
    likes: 234,
    date: '2024-12-01',
  },
  {
    id: 'ig-2',
    platform: 'instagram',
    thumbnail: '/images/social/post-2.jpg',
    url: 'https://www.instagram.com/perfexhaust67/',
    caption: '⚡ BMW M2 Competition — Silencieux inox poli miroir sur mesure. Le détail fait la différence.',
    likes: 312,
    date: '2024-11-25',
  },
  {
    id: 'ig-3',
    platform: 'instagram',
    thumbnail: '/images/social/post-3.jpg',
    url: 'https://www.instagram.com/perfexhaust67/',
    caption: '🛠️ Soudure TIG inox en cours — Chaque cordon est une signature artisanale.',
    likes: 189,
    date: '2024-11-18',
  },
  {
    id: 'tt-1',
    platform: 'tiktok',
    thumbnail: '/images/social/post-4.jpg',
    url: 'https://www.tiktok.com/@perfexhaust',
    caption: 'Audi RS3 5 cylindres — Le son que vous attendez 🔊',
    likes: 1247,
    date: '2024-11-10',
  },
  {
    id: 'tt-2',
    platform: 'tiktok',
    thumbnail: '/images/social/post-5.jpg',
    url: 'https://www.tiktok.com/@perfexhaust',
    caption: 'Avant/Après — Renault Mégane RS Trophy-R ⚡',
    likes: 892,
    date: '2024-11-03',
  },
  {
    id: 'ig-4',
    platform: 'instagram',
    thumbnail: '/images/social/post-6.jpg',
    url: 'https://www.instagram.com/perfexhaust67/',
    caption: '🏆 Porsche 718 Cayman — Silencieux titane/inox premium. Le son d\'un flat-6 sublimé.',
    likes: 445,
    date: '2024-10-28',
  },
]

// Module isolé : remplacer cette fonction par l\'API officielle Instagram/TikTok
export async function fetchSocialFeed(): Promise<SocialPost[]> {
  // TODO: Remplacer par l\'appel API Instagram Graph + TikTok API
  // Instagram: GET https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink
  // TikTok: GET https://open.tiktokapis.com/v2/video/list/
  return mockSocialPosts
}
