"use client";

import Link from "next/link";
import { ArrowRight, Car } from "lucide-react";
import type { Project } from "@/types";

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/realisations/${project.slug}`}
      className="group block overflow-hidden border transition-all duration-300 hover:-translate-y-1"
      style={{
        background: "#111111",
        borderColor: "#1e1e1e",
        borderRadius: "2px",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor =
          "rgba(249,115,22,0.3)";
        (e.currentTarget as HTMLElement).style.boxShadow =
          "0 20px 60px rgba(0,0,0,0.5)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "#1e1e1e";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      {/* Image placeholder */}
      <div
        className="relative h-52 flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #141414, #1a1a1a)" }}
      >
        <div className="flex flex-col items-center gap-2 text-gray-700">
          <Car size={40} />
          <span className="text-xs font-medium">{project.marque}</span>
        </div>
        {project.featured && (
          <div className="absolute top-3 right-3">
            <span
              className="text-xs font-bold tracking-wider uppercase text-black px-2 py-1"
              style={{ background: "#f97316" }}
            >
              Mis en avant
            </span>
          </div>
        )}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background:
              "linear-gradient(135deg, rgba(249,115,22,0.04) 0%, transparent 100%)",
          }}
        />
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex flex-wrap gap-2 mb-3">
          <span
            className="text-xs font-bold tracking-wider uppercase text-orange-400 px-2 py-0.5"
            style={{
              background: "rgba(249,115,22,0.1)",
              border: "1px solid rgba(249,115,22,0.2)",
            }}
          >
            {project.sonoriteTag}
          </span>
          <span
            className="text-xs font-bold tracking-wider uppercase text-gray-400 px-2 py-0.5"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {project.prestation}
          </span>
        </div>
        <h3
          className="text-white font-bold text-xl leading-tight group-hover:text-orange-400 transition-colors mb-1"
          style={{ fontFamily: "Oswald, sans-serif" }}
        >
          {project.vehicule}
        </h3>
        <p className="text-gray-400 text-xs mb-1">{project.annee}</p>
        <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">
          {project.description}
        </p>
        <div className="mt-4 flex items-center gap-2 text-orange-500 text-xs font-bold tracking-wider uppercase">
          Voir le projet <ArrowRight size={12} />
        </div>
      </div>
    </Link>
  );
}
