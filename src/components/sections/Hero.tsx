"use client";

import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useEffect, useRef } from "react";

export default function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles: { x: number; y: number; vx: number; vy: number; life: number; size: number }[] = [];
    let animId: number;

    const addParticle = () => {
      if (Math.random() > 0.7) return;
      const x = Math.random() * canvas.width;
      const y = canvas.height * 0.5 + (Math.random() - 0.5) * 100;
      particles.push({ x, y, vx: (Math.random() - 0.5) * 3, vy: -1 - Math.random() * 2, life: 1, size: Math.random() * 2 + 0.5 });
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      addParticle();
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy; p.life -= 0.012;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        ctx.save();
        ctx.globalAlpha = p.life * 0.6;
        ctx.fillStyle = `hsl(${20 + Math.random() * 20}, 100%, ${50 + p.life * 30}%)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #050505 0%, #0a0a0a 40%, #0d0808 100%)",
      }}
    >
      {/* Animated background canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-40" />

      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "linear-gradient(rgba(249,115,22,1) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Diagonal accent */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, transparent 60%, rgba(249,115,22,0.03) 100%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 text-center">
        {/* Eyebrow */}
        <div className="flex items-center justify-center gap-3 mb-6 opacity-0 animate-fade-in">
          <div className="w-12 h-px bg-orange-500" />
          <span className="text-orange-500 text-xs font-bold tracking-widest uppercase">
            Rountzenheim-Auenheim · Alsace
          </span>
          <div className="w-12 h-px bg-orange-500" />
        </div>

        {/* Main title */}
        <h1
          className="font-black text-white mb-6 opacity-0 animate-fade-in delay-200"
          style={{
            fontFamily: "Oswald, sans-serif",
            fontSize: "clamp(3rem, 10vw, 8rem)",
            lineHeight: "0.9",
            letterSpacing: "-0.02em",
          }}
        >
          <span className="block">ÉCHAPPEMENTS</span>
          <span
            className="block"
            style={{
              WebkitTextStroke: "2px #f97316",
              color: "transparent",
            }}
          >
            SUR MESURE
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto mb-8 leading-relaxed opacity-0 animate-fade-in delay-300">
          Fabrication artisanale · Soudure inox · Sonorité personnalisée
        </p>

        {/* Badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12 opacity-0 animate-fade-in delay-400">
          {["Inox 304L/316L", "Soudure TIG", "Fabrication artisanale", "Partenaire SHIFTECH"].map((b) => (
            <span
              key={b}
              className="px-3 py-1 text-xs font-bold tracking-widest uppercase border text-orange-400"
              style={{
                background: "rgba(249,115,22,0.08)",
                borderColor: "rgba(249,115,22,0.25)",
                borderRadius: "2px",
              }}
            >
              {b}
            </span>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 opacity-0 animate-fade-in delay-500">
          <Link
            href="/rendez-vous"
            className="inline-flex items-center gap-3 px-8 py-4 text-sm font-bold tracking-widest uppercase text-black transition-all hover:-translate-y-1 hover:shadow-orange-500/40 hover:shadow-2xl"
            style={{
              background: "linear-gradient(135deg, #f97316, #ea580c)",
              clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))",
            }}
          >
            Demander un devis
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/realisations"
            className="inline-flex items-center gap-3 px-8 py-4 text-sm font-bold tracking-widest uppercase text-white border border-white/20 hover:border-orange-500 hover:text-orange-400 transition-all hover:-translate-y-1"
          >
            Voir les réalisations
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-3 px-8 py-4 text-sm font-bold tracking-widest uppercase text-gray-400 hover:text-orange-400 transition-colors"
          >
            Contacter l&apos;atelier
          </Link>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-0 animate-fade-in delay-900">
          <div className="flex flex-col items-center gap-2 text-gray-600">
            <span className="text-xs tracking-widest uppercase">Découvrir</span>
            <ChevronDown size={16} className="animate-bounce" />
          </div>
        </div>
      </div>
    </section>
  );
}
