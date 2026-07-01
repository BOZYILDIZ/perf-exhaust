import { mockSocialPosts } from "@/data/social-mock";
import SectionTitle from "@/components/ui/SectionTitle";
import { ExternalLink, Heart } from "lucide-react";

function InstagramIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

export default function SocialFeedSection() {
  const posts = mockSocialPosts.slice(0, 6);

  return (
    <section className="py-24" style={{ background: "#0a0a0a" }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <SectionTitle
            label="Réseaux sociaux"
            title="Dernières<br/>réalisations"
            subtitle="Suivez notre actualité en direct depuis l'atelier."
          />
          <div className="flex items-center gap-4 flex-shrink-0">
            <a
              href="https://www.instagram.com/perfexhaust67/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-bold tracking-widest uppercase text-gray-400 hover:text-brand-400 transition-colors"
            >
              <InstagramIcon size={14} /> Instagram
            </a>
            <a
              href="https://www.tiktok.com/@perfexhaust"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-bold tracking-widest uppercase text-gray-400 hover:text-brand-400 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
              </svg>
              TikTok
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {posts.map((post) => (
            <a
              key={post.id}
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden aspect-square block"
              style={{ background: "linear-gradient(135deg, #141414, #1a1a1a)", borderRadius: "2px" }}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-700">
                {post.platform === "instagram" ? <InstagramIcon size={24} /> : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
                  </svg>
                )}
                <span className="text-xs">{post.platform}</span>
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-2 p-3">
                <ExternalLink size={16} className="text-white" />
                {post.likes && (
                  <div className="flex items-center gap-1 text-white text-xs font-medium">
                    <Heart size={10} fill="currentColor" className="text-brand-400" />
                    {post.likes}
                  </div>
                )}
                <p className="text-white text-xs text-center leading-tight line-clamp-3">{post.caption}</p>
              </div>

              {/* Platform badge */}
              <div className="absolute top-2 left-2">
                <span
                  className="text-xs font-bold uppercase px-1.5 py-0.5"
                  style={{
                    background: post.platform === "instagram" ? "rgba(225,48,108,0.9)" : "rgba(0,0,0,0.8)",
                    color: "white",
                    borderRadius: "2px",
                  }}
                >
                  {post.platform === "instagram" ? "IG" : "TT"}
                </span>
              </div>
            </a>
          ))}
        </div>

        <p className="text-center text-gray-600 text-xs mt-4">
          * Aperçu simulé — connectez les APIs Instagram/TikTok pour afficher vos vraies publications
        </p>
      </div>
    </section>
  );
}
