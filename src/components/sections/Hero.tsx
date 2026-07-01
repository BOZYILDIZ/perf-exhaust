"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Phone } from "lucide-react";

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  color: string;
}

const SPARK_COLORS = ["#1266ea", "#4d8ef0", "#93c5fd", "#bfdbfe", "#fff"];

export default function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparksRef = useRef<Spark[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    let animId: number;
    let lastBurst = 0;

    const addBurst = (x: number, y: number) => {
      const count = 12 + Math.floor(Math.random() * 8);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 3;
        sparksRef.current.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2,
          alpha: 0.9 + Math.random() * 0.1,
          size: 1 + Math.random() * 2.5,
          color: SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)],
        });
      }
    };

    const animate = (ts: number) => {
      animId = requestAnimationFrame(animate);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (ts - lastBurst > 1800) {
        lastBurst = ts;
        const bx = canvas.width * (0.3 + Math.random() * 0.4);
        const by = canvas.height * (0.3 + Math.random() * 0.4);
        addBurst(bx, by);
      }

      sparksRef.current = sparksRef.current.filter((s) => s.alpha > 0.02);
      for (const s of sparksRef.current) {
        ctx.save();
        ctx.globalAlpha = s.alpha;
        ctx.fillStyle = s.color;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.08;
        s.vx *= 0.99;
        s.alpha -= 0.012;
        s.size *= 0.98;
      }
    };

    animId = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{ background: "#060606" }}
      aria-label="PERF'EXHAUST — Échappements sur mesure en Alsace"
    >
      {/* Ambient glow layers */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-20"
          style={{ background: "radial-gradient(ellipse, #1266ea 0%, transparent 60%)", filter: "blur(60px)" }}
        />
        <div
          className="absolute top-1/3 right-0 w-64 h-64 opacity-10"
          style={{ background: "radial-gradient(circle, #1266ea 0%, transparent 70%)", filter: "blur(40px)" }}
        />
      </div>

      {/* Diagonal grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
        aria-hidden="true"
      />

      {/* Spark canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-24 w-full">
        <div className="max-w-3xl">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-2 mb-8"
          >
            <span
              className="px-3 py-1 text-xs font-bold tracking-widest uppercase text-orange-400 border border-orange-500/40 bg-orange-500/10"
              style={{ clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))" }}
            >
              Atelier Alsace · Rountzenheim-Auenheim
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            className="font-oswald text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white uppercase leading-none tracking-wider mb-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
          >
            Échappements
            <br />
            <span
              className="text-transparent"
              style={{ WebkitTextStroke: "1px rgba(18,102,234,0.6)" }}
            >
              sur mesure
            </span>
          </motion.h1>

          {/* Accent line */}
          <motion.div
            className="flex items-center gap-4 mb-8"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            style={{ transformOrigin: "left" }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="h-0.5 w-16 bg-orange-500" />
            <span className="text-orange-400 font-bold text-sm tracking-widest uppercase">
              Fabrication artisanale · Soudure inox · Alsace
            </span>
          </motion.div>

          {/* Description */}
          <motion.p
            className="text-lg text-white/60 leading-relaxed mb-10 max-w-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            Atelier spécialisé en fabrication d&apos;échappements inox sur mesure en Alsace.
            Chaque ligne d&apos;échappement est conçue sur mesure afin d&apos;obtenir la sonorité qui correspond parfaitement à vos attentes.
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="flex flex-wrap gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.65 }}
          >
            <Link
              href="/rendez-vous"
              className="group inline-flex items-center gap-3 px-7 py-4 bg-orange-500 text-white font-bold text-sm tracking-widest uppercase hover:bg-orange-400 transition-all hover:-translate-y-0.5"
              style={{ clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))" }}
            >
              Devis gratuit
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="tel:+33636523058"
              className="inline-flex items-center gap-3 px-7 py-4 border border-white/20 text-white font-bold text-sm tracking-wider hover:border-orange-500 hover:text-orange-400 transition-all hover:-translate-y-0.5"
            >
              <Phone size={16} />
              +33 6 36 52 30 58
            </a>
            <Link
              href="/realisations"
              className="inline-flex items-center gap-3 px-7 py-4 text-white/60 font-bold text-sm tracking-wider hover:text-white transition-colors"
            >
              Voir les réalisations
              <ArrowRight size={14} />
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="flex flex-wrap gap-8 mt-16 pt-8 border-t border-white/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.9 }}
          >
            {[
              { value: "De nombreux", label: "Projets réalisés" },
              { value: "100%", label: "Sur mesure" },
              { value: "Inox 304L", label: "Matériau premium" },
              { value: "Alsace", label: "Bas-Rhin · 67" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1">
                <span className="font-oswald text-2xl font-bold text-orange-400">{stat.value}</span>
                <span className="text-xs text-white/40 font-medium tracking-wider uppercase">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 1, delay: 1.5 }}
        aria-hidden="true"
      >
        <span className="text-xs tracking-widest uppercase text-white/40">Scroll</span>
        <motion.div
          className="w-px h-12 bg-gradient-to-b from-white/40 to-transparent"
          animate={{ scaleY: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </section>
  );
}
