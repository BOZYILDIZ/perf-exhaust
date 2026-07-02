import SectionTitle from "@/components/ui/SectionTitle";

const steps = [
  { num: "01", title: "Prise de contact", desc: "Envoyez votre demande en ligne ou appelez-nous. Décrivez votre véhicule et vos objectifs sonores.", icon: "📞" },
  { num: "02", title: "Analyse du véhicule", desc: "Nous analysons votre véhicule en atelier pour définir la meilleure solution technique.", icon: "🔍" },
  { num: "03", title: "Devis personnalisé", desc: "Vous recevez un devis détaillé, sans engagement, avec toutes les options possibles.", icon: "📋" },
  { num: "04", title: "Fabrication sur mesure", desc: "Chaque pièce est fabriquée à la main dans notre atelier avec des matériaux premium.", icon: "🔧" },
  { num: "05", title: "Pose et finitions", desc: "Pose professionnelle, vérification de l'étanchéité, finitions soignées.", icon: "⚡" },
  { num: "06", title: "Test final", desc: "Test sonore, vérification complète, remise du véhicule avec garantie.", icon: "✅" },
];

export default function ProcessSection() {
  return (
    <section className="py-24 relative" style={{ background: "#080808" }}>
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(18,102,234,1) 1px, transparent 1px), linear-gradient(90deg, rgba(18,102,234,1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <SectionTitle
            label="Notre processus"
            title="De la demande<br/>à la réalisation"
            subtitle="Un accompagnement complet, de la première prise de contact jusqu'à la remise de votre véhicule."
            centered
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((step) => (
            <div
              key={step.num}
              className="p-6 border relative overflow-hidden"
              style={{ background: "#0f0f0f", borderColor: "#1a1a1a", borderRadius: "2px" }}
            >
              <div
                className="absolute top-0 left-0 w-1 h-full"
                style={{ background: "linear-gradient(180deg, #1266ea, #dc2626)" }}
              />
              <div className="pl-4">
                <div className="flex items-center gap-4 mb-4">
                  <span
                    className="text-4xl font-black"
                    style={{
                      fontFamily: "Oswald, sans-serif",
                      WebkitTextStroke: "1px rgba(18,102,234,0.4)",
                      color: "transparent",
                    }}
                  >
                    {step.num}
                  </span>
                  <span className="text-2xl">{step.icon}</span>
                </div>
                <h3
                  className="text-white font-bold text-lg mb-2"
                  style={{ fontFamily: "Oswald, sans-serif" }}
                >
                  {step.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
