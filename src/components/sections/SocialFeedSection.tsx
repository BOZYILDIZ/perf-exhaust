import SectionTitle from "@/components/ui/SectionTitle";
import { SOCIAL_LINKS, featuredPosts } from "@/data/social";
import { ExternalLink, ArrowRight } from "lucide-react";

function InstagramIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function TikTokIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
    </svg>
  );
}

const NETWORKS = [
  {
    key: "instagram" as const,
    name: "Instagram",
    handle: "@perfexhaust67",
    description: "Photos des réalisations, avant/après, coulisses de l'atelier et finitions en détail.",
    cta: "Voir Instagram",
    url: SOCIAL_LINKS.instagram,
    icon: InstagramIcon,
  },
  {
    key: "tiktok" as const,
    name: "TikTok",
    handle: "@perfexhaust",
    description: "Sonorités en vidéo : démarrages, accélérations et soudure TIG en action.",
    cta: "Voir TikTok",
    url: SOCIAL_LINKS.tiktok,
    icon: TikTokIcon,
  },
];

export default function SocialFeedSection() {
  return (
    <section className="py-24" style={{ background: "#0a0a0a" }} aria-label="Réseaux sociaux">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12">
          <SectionTitle
            label="Réseaux sociaux"
            title="Suivez les réalisations<br/>en direct"
            subtitle="Les projets récents, les sonorités en vidéo et les coulisses de l'atelier sont publiés sur nos comptes officiels."
          />
        </div>

        {/* Cartes profils */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {NETWORKS.map((network) => (
            <a
              key={network.key}
              href={network.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative p-8 border border-white/10 bg-white/[0.02] hover:border-brand-500/40 hover:bg-brand-500/[0.04] transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 flex items-center justify-center border border-white/15 text-white group-hover:text-brand-400 group-hover:border-brand-500/50 transition-colors">
                    <network.icon size={22} />
                  </div>
                  <div>
                    <h3 className="font-oswald text-white font-bold text-xl uppercase tracking-wide">{network.name}</h3>
                    <p className="text-brand-400 text-sm font-medium">{network.handle}</p>
                  </div>
                </div>
                <ExternalLink size={16} className="text-gray-600 group-hover:text-brand-400 transition-colors" aria-hidden="true" />
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">{network.description}</p>
              <span className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-white/70 group-hover:text-brand-400 transition-colors">
                {network.cta}
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </span>
              {/* Ligne accent bas de carte */}
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: "linear-gradient(90deg, transparent, #1266ea, transparent)" }}
                aria-hidden="true"
              />
            </a>
          ))}
        </div>

        {/* Posts mis en avant (ajoutés manuellement dans src/data/social.ts) */}
        {featuredPosts.length > 0 && (
          <div className="mt-10">
            <h3 className="text-white/40 text-xs font-bold tracking-widest uppercase mb-4">À la une</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredPosts.map((post) => (
                <a
                  key={post.url}
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 p-4 border border-white/10 bg-white/[0.02] hover:border-brand-500/40 transition-all"
                >
                  <div className="w-9 h-9 flex items-center justify-center border border-white/15 text-gray-400 group-hover:text-brand-400 transition-colors flex-shrink-0">
                    {post.platform === "instagram" ? <InstagramIcon size={16} /> : <TikTokIcon size={16} />}
                  </div>
                  <span className="text-gray-300 text-sm leading-snug group-hover:text-white transition-colors">{post.caption}</span>
                  <ExternalLink size={12} className="text-gray-600 ml-auto flex-shrink-0" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
