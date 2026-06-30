import { partners } from "@/data/partners";
import SectionTitle from "@/components/ui/SectionTitle";
import { ExternalLink, Shield } from "lucide-react";

export default function PartnersSection() {
  return (
    <section className="py-20" style={{ background: "#0a0a0a", borderTop: "1px solid #141414" }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <SectionTitle
            label="Partenaires"
            title="Ils nous font confiance"
            centered
          />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6">
          {partners.map((partner) => (
            <div
              key={partner.id}
              className="w-full max-w-md p-8 border relative overflow-hidden group"
              style={{ background: "#0f0f0f", borderColor: "#1e1e1e", borderRadius: "2px" }}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: "linear-gradient(135deg, rgba(249,115,22,0.03), transparent)" }}
              />
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className="w-14 h-14 flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, #1a1a1a, #222)",
                      border: "1px solid #2a2a2a",
                    }}
                  >
                    <span
                      className="text-white font-black text-lg"
                      style={{ fontFamily: "Oswald, sans-serif", letterSpacing: "0.05em" }}
                    >
                      {partner.name.substring(0, 2)}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3
                        className="text-white font-black text-xl"
                        style={{ fontFamily: "Oswald, sans-serif" }}
                      >
                        {partner.name}
                      </h3>
                      <Shield size={14} className="text-orange-500" />
                    </div>
                    <p className="text-orange-500 text-xs font-bold tracking-widest uppercase">{partner.type}</p>
                  </div>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">{partner.description}</p>
                {partner.url && (
                  <a
                    href={partner.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-orange-400 hover:text-orange-300 transition-colors"
                  >
                    Visiter <ExternalLink size={10} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-gray-600 text-sm mt-6">
          Vous souhaitez devenir partenaire ?{" "}
          <a href="/contact" className="text-orange-500 hover:text-orange-400 transition-colors">
            Contactez-nous
          </a>
        </p>
      </div>
    </section>
  );
}
