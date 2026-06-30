"use client";

import { useEffect, useRef } from "react";

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export default function WeldingIntro({ onComplete }: { onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) { onComplete(); return; }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const sparks: Spark[] = [];
    const colors = ["#f97316", "#fb923c", "#fed7aa", "#fbbf24", "#fff7ed", "#dc2626"];

    const createSparks = (x: number, y: number, count: number) => {
      for (let i = 0; i < count; i++) {
        const angle = (Math.random() * Math.PI * 2);
        const speed = 1 + Math.random() * 4;
        sparks.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - Math.random() * 3,
          life: 1,
          maxLife: 0.6 + Math.random() * 0.8,
          size: 1 + Math.random() * 3,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    };

    let startTime = Date.now();
    let weldX = 0;
    const weldY = canvas.height / 2;
    const WELD_DURATION = 2000;
    const FADE_START = 2500;
    const TOTAL_DURATION = 3200;

    const draw = () => {
      const elapsed = Date.now() - startTime;
      ctx.fillStyle = "rgba(8,8,8,0.15)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (elapsed < WELD_DURATION) {
        const progress = elapsed / WELD_DURATION;
        weldX = progress * canvas.width;

        // Weld line
        const gradient = ctx.createLinearGradient(Math.max(0, weldX - 200), 0, weldX, 0);
        gradient.addColorStop(0, "rgba(249,115,22,0)");
        gradient.addColorStop(0.7, "rgba(249,115,22,0.3)");
        gradient.addColorStop(1, "rgba(255,255,255,0.9)");
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, weldY);
        ctx.lineTo(weldX, weldY);
        ctx.stroke();

        // Weld glow point
        const grd = ctx.createRadialGradient(weldX, weldY, 0, weldX, weldY, 30);
        grd.addColorStop(0, "rgba(255,255,255,1)");
        grd.addColorStop(0.2, "rgba(249,115,22,0.8)");
        grd.addColorStop(1, "rgba(249,115,22,0)");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(weldX, weldY, 30, 0, Math.PI * 2);
        ctx.fill();

        if (Math.random() > 0.4) {
          createSparks(weldX, weldY, Math.floor(Math.random() * 4 + 2));
        }
      }

      // Update and draw sparks
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.12;
        s.life -= 0.018;
        if (s.life <= 0) { sparks.splice(i, 1); continue; }

        ctx.save();
        ctx.globalAlpha = s.life;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (elapsed < TOTAL_DURATION) {
        animFrameRef.current = requestAnimationFrame(draw);
      } else {
        onComplete();
      }
    };

    animFrameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: "#080808" }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div className="relative z-10 text-center pointer-events-none">
        <div
          className="text-5xl md:text-7xl font-black text-white mb-2"
          style={{
            fontFamily: "Oswald, sans-serif",
            letterSpacing: "0.08em",
            textShadow: "0 0 40px rgba(249,115,22,0.8), 0 0 80px rgba(249,115,22,0.4)",
          }}
        >
          PERF&apos;EXHAUST
        </div>
        <div
          className="text-orange-500 text-sm tracking-widest uppercase font-medium"
          style={{ letterSpacing: "0.3em" }}
        >
          Échappements sur mesure · Alsace
        </div>
      </div>
    </div>
  );
}
