import SectionTitle from "@/components/ui/SectionTitle";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Maxime R.",
    vehicle: "Golf GTI Mk8",
    rating: 5,
    text: "Travail irréprochable sur ma Golf GTI. Son sportif exactement comme je le voulais, finitions parfaites. PERF'EXHAUST c'est de l'artisanat de qualité.",
    prestation: "Ligne complète inox",
  },
  {
    name: "Thomas K.",
    vehicle: "Audi RS3",
    rating: 5,
    text: "Le son 5 cylindres RS3 est maintenant à un autre niveau. Soudures TIG impeccables, conseils professionnels. Je recommande les yeux fermés.",
    prestation: "Ligne complète + valve",
  },
  {
    name: "Nicolas B.",
    vehicle: "BMW M2 Competition",
    rating: 5,
    text: "Silencieux inox poli miroir absolument magnifique. Le son M2 est sublimé. Équipe professionnelle et passionnée. Merci !",
    prestation: "Silencieux personnalisé",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-24" style={{ background: "#0d0d0d" }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <SectionTitle
            label="Avis clients"
            title="Ce que disent<br/>nos clients"
            centered
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="p-6 border relative"
              style={{ background: "#111111", borderColor: "#1e1e1e", borderRadius: "2px" }}
            >
              <Quote size={32} className="text-orange-500/20 mb-4" />
              <p className="text-gray-300 text-sm leading-relaxed mb-6 italic">&quot;{t.text}&quot;</p>

              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} size={12} className="text-orange-400 fill-orange-400" />
                ))}
              </div>

              <div className="border-t border-gray-800 pt-4">
                <p className="text-white font-bold text-sm" style={{ fontFamily: "Oswald, sans-serif" }}>{t.name}</p>
                <p className="text-orange-500 text-xs font-medium">{t.vehicle}</p>
                <p className="text-gray-600 text-xs mt-1">{t.prestation}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-6 px-8 py-4 border border-gray-800">
            <div className="text-center">
              <div className="text-3xl font-black text-white" style={{ fontFamily: "Oswald, sans-serif" }}>5.0</div>
              <div className="flex items-center gap-0.5 justify-center mt-1">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={10} className="text-orange-400 fill-orange-400" />)}
              </div>
              <div className="text-gray-500 text-xs mt-1">Note moyenne</div>
            </div>
            <div className="w-px h-12 bg-gray-800" />
            <div className="text-center">
              <div className="text-3xl font-black text-white" style={{ fontFamily: "Oswald, sans-serif" }}>15+</div>
              <div className="text-gray-500 text-xs mt-1">Projets réalisés</div>
            </div>
            <div className="w-px h-12 bg-gray-800" />
            <div className="text-center">
              <div className="text-3xl font-black text-white" style={{ fontFamily: "Oswald, sans-serif" }}>100%</div>
              <div className="text-gray-500 text-xs mt-1">Clients satisfaits</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
