"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { Project } from "@/types";
import { projectCoverImage } from "@/lib/utils";

// Correspondance par préfixe : les prestations réelles sont des libellés longs
// ("Ligne complète inox", "Demi-ligne sur mesure"...) — on matche sur le début.
const PRESTATION_COLORS: [string, string][] = [
  ["Ligne complète", "#1266ea"],
  ["Ligne arrière", "#1266ea"],
  ["Demi-ligne", "#3b82f6"],
  ["Silencieux", "#8b5cf6"],
  ["Réparation", "#10b981"],
  ["Soudure", "#10b981"],
  ["Modification", "#4d8ef0"],
];

const SONORITY_GRADIENTS: Record<string, string> = {
  "Son grave": "from-purple-900/60 to-black",
  "Son agressif": "from-red-900/60 to-black",
  "Son sportif": "from-blue-900/60 to-black",
  "Son aigu": "from-brand-900/60 to-black",
  "Discret": "from-gray-800/60 to-black",
};

export default function ProjectCard({ project }: { project: Project }) {
  const prestColor = PRESTATION_COLORS.find(([prefix]) => project.prestation.startsWith(prefix))?.[1] ?? "#6b7280";
  const grad = SONORITY_GRADIENTS[project.sonoriteTag] || "from-gray-900/60 to-black";
  const cover = projectCoverImage(project);

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="group relative bg-[#111] border border-white/10 overflow-hidden"
      style={{ willChange: "transform" }}
    >
      <Link href={"/realisations/" + project.slug}>
        {/* Visuel : photo réelle si disponible, sinon placeholder premium */}
        <div
          className={"relative h-56 bg-gradient-to-br " + grad + " flex items-center justify-center overflow-hidden"}
          aria-hidden={cover ? undefined : true}
        >
          {cover && (
            <Image
              src={cover.src}
              alt={cover.alt}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          )}
          {!cover && (
          <>
          {/* Metal texture lines */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 8px, rgba(255,255,255,0.3) 8px, rgba(255,255,255,0.3) 9px)" }} />

          {/* Car silhouette SVG */}
          <svg
            width="120"
            height="60"
            viewBox="0 0 120 60"
            fill="none"
            className="opacity-20 group-hover:opacity-30 transition-opacity duration-300"
          >
            <path d="M10 40 C10 40 20 20 40 18 L60 14 L80 18 C100 20 110 40 110 40" stroke="white" strokeWidth="2" fill="none"/>
            <rect x="5" y="40" width="110" height="12" rx="3" fill="white" opacity="0.3"/>
            <circle cx="28" cy="52" r="8" stroke="white" strokeWidth="2" fill="none"/>
            <circle cx="92" cy="52" r="8" stroke="white" strokeWidth="2" fill="none"/>
            <circle cx="28" cy="52" r="3" fill="white" opacity="0.5"/>
            <circle cx="92" cy="52" r="3" fill="white" opacity="0.5"/>
          </svg>
          </>
          )}

          {/* Hover glow */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{ background: "radial-gradient(circle at 50% 100%, rgba(18,102,234,0.25) 0%, transparent 60%)" }}
          />

          {/* Sonority badge */}
          {project.sonoriteTag && (
            <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 border border-white/10 text-xs font-bold text-white/70 tracking-wider uppercase backdrop-blur-sm">
              {project.sonoriteTag}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
            <div className="min-w-0">
              <h3 className="font-oswald text-lg font-bold text-white uppercase tracking-wide leading-tight group-hover:text-brand-400 transition-colors duration-300">
                {project.vehicule}
              </h3>
              <div className="text-xs text-white/40 mt-0.5">{project.annee}</div>
            </div>
            <div
              className="shrink-0 px-2 py-1 text-xs font-bold tracking-wider uppercase border whitespace-nowrap"
              style={{ color: prestColor, borderColor: prestColor + "40", background: prestColor + "15" }}
            >
              {project.prestation}
            </div>
          </div>

          <p className="text-sm text-white/50 leading-relaxed line-clamp-2 mb-4">
            {project.description}
          </p>

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {project.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 bg-white/5 border border-white/10 text-white/40"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-1 text-xs font-bold tracking-wider uppercase text-brand-400/70 group-hover:text-brand-400 transition-colors duration-300">
            Voir le projet <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform duration-300" />
          </div>
        </div>

        {/* Bottom glow line */}
        <div
          className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: "linear-gradient(90deg, transparent, #1266ea, transparent)" }}
        />
      </Link>
    </motion.article>
  );
}
