"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProjectCard from "@/components/ui/ProjectCard";
import type { Project } from "@/types";

const FILTERS = [
  { id: "all", label: "Tous les projets" },
  { id: "ligne-complete", label: "Ligne complète" },
  { id: "demi-ligne", label: "Demi-ligne" },
  { id: "silencieux", label: "Silencieux" },
  { id: "grave", label: "Son grave" },
  { id: "sportif", label: "Sportif" },
];

export default function GalleryWithFilters({ projects }: { projects: Project[] }) {
  const [active, setActive] = useState("all");

  const filtered = active === "all"
    ? projects
    : projects.filter((p) => p.filterTags.includes(active));

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-10" role="tablist" aria-label="Filtrer les réalisations">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setActive(f.id)}
            role="tab"
            aria-selected={active === f.id}
            className={[
              "px-4 py-2 text-xs font-bold tracking-widest uppercase transition-all duration-200 border",
              active === f.id
                ? "bg-brand-500 text-white border-brand-500"
                : "bg-transparent text-white/50 border-white/20 hover:border-white/40 hover:text-white",
            ].join(" ")}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Count */}
      <div className="text-xs text-white/30 mb-6 font-medium tracking-wider">
        {filtered.length} projet{filtered.length > 1 ? "s" : ""}
        {active !== "all" && " · filtrés"}
      </div>

      {/* Grid */}
      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <AnimatePresence mode="popLayout">
          {filtered.map((project) => (
            <motion.div
              key={project.id}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25 }}
            >
              <ProjectCard project={project} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {filtered.length === 0 && (
        <div className="py-24 text-center">
          <div className="text-white/20 text-lg mb-2">Aucun projet dans cette catégorie.</div>
          <button onClick={() => setActive("all")} className="text-brand-400 text-sm hover:text-brand-300 transition-colors">
            Voir tous les projets →
          </button>
        </div>
      )}
    </div>
  );
}
