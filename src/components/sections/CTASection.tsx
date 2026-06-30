import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";

export default function CTASection() {
  return (
    <section
      className="py-24 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0f0800 0%, #1a0a00 50%, #0f0800 100%)",
        borderTop: "1px solid rgba(249,115,22,0.15)",
        borderBottom: "1px solid rgba(249,115,22,0.15)",
      }}
    >
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: "radial-gradient(rgba(249,115,22,1) 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      />
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at center, rgba(249,115,22,0.08) 0%, transparent 70%)" }}
      />

      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-px bg-orange-500" />
          <span className="text-orange-500 text-xs font-bold tracking-widest uppercase">Prêt pour votre projet ?</span>
          <div className="w-12 h-px bg-orange-500" />
        </div>

        <h2
          className="text-white font-black mb-6"
          style={{
            fontFamily: "Oswald, sans-serif",
            fontSize: "clamp(2.5rem, 6vw, 5rem)",
            lineHeight: "0.95",
          }}
        >
          VOTRE ÉCHAPPEMENT<br/>
          <span style={{ WebkitTextStroke: "2px #f97316", color: "transparent" }}>
            SUR MESURE
          </span>
        </h2>

        <p className="text-gray-300 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
          Devis gratuit et personnalisé. Notre équipe analyse votre projet et vous propose la meilleure solution pour votre véhicule.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <Link
            href="/rendez-vous"
            className="inline-flex items-center gap-3 px-10 py-5 text-sm font-bold tracking-widest uppercase text-black transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-orange-500/30"
            style={{
              background: "linear-gradient(135deg, #f97316, #ea580c)",
              clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))",
            }}
          >
            Demander un devis gratuit <ArrowRight size={16} />
          </Link>
          <a
            href="tel:+33XXXXXXXXX"
            className="inline-flex items-center gap-3 px-10 py-5 text-sm font-bold tracking-widest uppercase text-white border border-white/20 hover:border-orange-500 hover:text-orange-400 transition-all hover:-translate-y-0.5"
          >
            <Phone size={14} /> Appeler l&apos;atelier
          </a>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500">
          {["Prix sur devis", "Fabrication artisanale", "Inox garanti", "Partenaire SHIFTECH"].map((b) => (
            <div key={b} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
              {b}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
