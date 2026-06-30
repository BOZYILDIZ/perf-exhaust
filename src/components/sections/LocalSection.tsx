import Link from "next/link";

const ZONES = [
  { city: "Rountzenheim-Auenheim", dept: "67480", note: "Siège atelier" },
  { city: "Haguenau", dept: "67500", note: "25 min" },
  { city: "Strasbourg", dept: "67000", note: "40 min" },
  { city: "Saverne", dept: "67700", note: "45 min" },
  { city: "Sélestat", dept: "67600", note: "55 min" },
  { city: "Colmar", dept: "68000", note: "1h" },
];

export default function LocalSection() {
  return (
    <section className="py-24 bg-[#0a0a0a] relative overflow-hidden" aria-label="Zone d'intervention Alsace">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 right-0 w-96 h-96 opacity-5" style={{ background: "radial-gradient(circle, #f97316 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="text-xs font-bold tracking-widest uppercase text-orange-400 mb-4">Localisation</div>
            <h2 className="font-oswald text-4xl md:text-5xl font-bold text-white uppercase tracking-wider mb-6 leading-tight">
              Un atelier spécialisé<br />
              <span className="text-orange-400">en Alsace</span>
            </h2>
            <p className="text-white/60 leading-relaxed mb-6 text-lg">
              PERF&apos;EXHAUST est implanté à <strong className="text-white">Rountzenheim-Auenheim</strong>, dans le
              Bas-Rhin (67), en Alsace. Nous accueillons des clients de tout le <strong className="text-white">Grand Est</strong> —
              Strasbourg, Haguenau, Saverne, Sélestat, Colmar — pour des projets d&apos;échappements sur mesure uniques.
            </p>
            <p className="text-white/60 leading-relaxed mb-8">
              Notre atelier spécialisé en <strong className="text-white">soudure TIG inox</strong> est l&apos;un des rares
              en Alsace à proposer une fabrication 100% sur mesure, de la conception à la pose.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/rendez-vous"
                className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-black font-bold text-sm tracking-widest uppercase hover:bg-orange-400 transition-colors"
                style={{ clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))" }}
              >
                Prendre rendez-vous
              </Link>
              <a href="tel:+33636523058" className="inline-flex items-center gap-2 px-6 py-3 border border-white/20 text-white font-bold text-sm tracking-wider hover:border-orange-500 hover:text-orange-400 transition-colors">
                +33 6 36 52 30 58
              </a>
            </div>
          </div>

          <div>
            <div className="text-xs font-bold tracking-widest uppercase text-white/30 mb-4">Zones desservies</div>
            <div className="grid grid-cols-2 gap-2">
              {ZONES.map((zone) => (
                <div key={zone.city} className="flex items-center justify-between p-3 border border-white/10 bg-white/5 hover:border-orange-500/30 hover:bg-orange-500/5 transition-all">
                  <div>
                    <div className="font-bold text-white text-sm">{zone.city}</div>
                    <div className="text-xs text-white/30">{zone.dept}</div>
                  </div>
                  <div className="text-xs text-orange-400/70 font-medium">{zone.note}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 border border-orange-500/20 bg-orange-500/5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                    <circle cx="12" cy="9" r="2.5"/>
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-bold text-white mb-1">Atelier sur rendez-vous</div>
                  <div className="text-xs text-white/50">
                    Lundi — Vendredi, 8h00–18h00<br />
                    Rountzenheim-Auenheim, Bas-Rhin 67480
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
