import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Shield, Wrench, Award, MapPin } from "lucide-react";
import { partners } from "@/data/partners";

export const metadata: Metadata = {
  title: "À propos — PERF'EXHAUST Alsace",
  description: "Découvrez PERF'EXHAUST, atelier artisanal d'échappements sur mesure à Rountzenheim-Auenheim, Alsace. Soudure TIG inox, fabrication sur mesure, partenaire SHIFTECH.",
};

export default function AProposPage() {
  return (
    <div className="pt-20" style={{ background: "#080808" }}>
      <div className="relative py-16" style={{ background: "linear-gradient(135deg, #0a0a0a, #0f0808)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-0.5 bg-orange-500" />
            <span className="text-orange-500 text-xs font-bold tracking-widest uppercase">Notre atelier</span>
          </div>
          <h1 className="font-black text-white mb-4" style={{ fontFamily: "Oswald, sans-serif", fontSize: "clamp(2rem, 5vw, 4rem)", lineHeight: "1" }}>
            À PROPOS
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-16">
          <div>
            <h2 className="text-3xl font-black text-white mb-6" style={{ fontFamily: "Oswald, sans-serif" }}>
              L&apos;atelier PERF&apos;EXHAUST
            </h2>
            <div className="space-y-4 text-gray-400 leading-relaxed">
              <p>PERF&apos;EXHAUST est un atelier artisanal spécialisé dans la conception, fabrication et pose d&apos;échappements sur mesure, basé à Rountzenheim-Auenheim en Alsace.</p>
              <p>Notre spécialité : la soudure TIG sur inox 304L/316L, aluminium et métaux ferreux. Chaque ligne d&apos;échappement est fabriquée à la main, adaptée précisément à votre véhicule et à vos objectifs.</p>
              <p>Que vous souhaitiez une sonorité sportive affirmée, un son grave profond, ou une modification discrète, nous concevons la solution idéale pour votre projet.</p>
              <p>Partenaire officiel SHIFTECH, nous combinons notre expertise en fabrication avec les meilleures reprogrammations moteur pour des projets de performance complète.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Wrench, title: "Fabrication artisanale", desc: "Chaque pièce est fabriquée à la main dans notre atelier alsacien." },
              { icon: Shield, title: "Inox garanti", desc: "Matériaux premium inox 304L/316L, résistants et durables." },
              { icon: Award, title: "Soudure TIG", desc: "Soudure TIG professionnelle, cordons parfaits, étanchéité garantie." },
              { icon: MapPin, title: "Alsace · Bas-Rhin", desc: "Situé à Rountzenheim-Auenheim, accessible depuis Strasbourg." },
            ].map((item, i) => (
              <div key={i} className="p-5 border" style={{ background: "#0f0f0f", borderColor: "#1e1e1e" }}>
                <item.icon size={20} className="text-orange-500 mb-3" />
                <h3 className="text-white font-bold text-sm mb-1" style={{ fontFamily: "Oswald, sans-serif" }}>{item.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Partner */}
        <div className="mb-16">
          <h2 className="text-2xl font-black text-white mb-8" style={{ fontFamily: "Oswald, sans-serif" }}>Partenaire performance</h2>
          {partners.map((p) => (
            <div key={p.id} className="p-8 border" style={{ background: "#0f0f0f", borderColor: "#1e1e1e" }}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 flex items-center justify-center" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
                  <span className="text-white font-black" style={{ fontFamily: "Oswald, sans-serif" }}>{p.name.substring(0, 2)}</span>
                </div>
                <div>
                  <h3 className="text-white font-black text-xl" style={{ fontFamily: "Oswald, sans-serif" }}>{p.name}</h3>
                  <p className="text-orange-500 text-xs font-bold tracking-widest uppercase">{p.type}</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">{p.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center py-12 border" style={{ background: "rgba(249,115,22,0.03)", borderColor: "rgba(249,115,22,0.15)" }}>
          <h2 className="text-2xl font-black text-white mb-3" style={{ fontFamily: "Oswald, sans-serif" }}>Votre projet nous intéresse</h2>
          <Link href="/rendez-vous" className="inline-flex items-center gap-2 px-8 py-4 text-sm font-bold tracking-widest uppercase text-black" style={{ background: "linear-gradient(135deg, #f97316, #ea580c)", clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))" }}>
            Demander un devis <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
