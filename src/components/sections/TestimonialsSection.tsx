import SectionTitle from "@/components/ui/SectionTitle";
import { GOOGLE_REVIEWS_URL } from "@/data/social";
import { Star, ExternalLink } from "lucide-react";

/**
 * Section avis clients — SANS scraping ni faux témoignages.
 * Renvoie vers la fiche Google Business de l'atelier (source vérifiable).
 * L'URL se configure dans src/data/social.ts (GOOGLE_REVIEWS_URL).
 */
export default function TestimonialsSection() {
  return (
    <section className="py-24" style={{ background: "#0d0d0d" }} aria-label="Avis clients">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <SectionTitle
          label="Avis clients"
          title="Ce que disent<br/>nos clients"
          centered
        />

        <div className="mt-12 p-8 sm:p-12 border border-white/10 bg-white/[0.02]">
          <div className="flex items-center justify-center gap-1 mb-6" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={20} className="text-brand-400 fill-brand-400" />
            ))}
          </div>
          <p className="text-gray-300 text-base sm:text-lg leading-relaxed max-w-xl mx-auto mb-8">
            Les avis de nos clients sont publiés sur notre fiche Google — authentiques et
            vérifiables. Consultez leurs retours sur la qualité des fabrications, la sonorité
            obtenue et l&apos;accompagnement de l&apos;atelier.
          </p>

          {GOOGLE_REVIEWS_URL ? (
            <a
              href={GOOGLE_REVIEWS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 text-sm font-bold tracking-widest uppercase text-white transition-all hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg, #1266ea, #0d54c8)",
                clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))",
              }}
            >
              Voir les avis Google
              <ExternalLink size={14} />
            </a>
          ) : (
            <p className="text-gray-500 text-sm">
              Recherchez <strong className="text-white">« PERF&apos;EXHAUST Rountzenheim-Auenheim »</strong> sur
              Google pour consulter les avis de l&apos;atelier.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
