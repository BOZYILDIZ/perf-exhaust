"use client";

import { Download, FileImage } from "lucide-react";
import ProjectLightbox from "@/components/gallery/ProjectLightbox";
import { vehiclePhotoSlotTitle, type VehiclePhoto } from "@/lib/vehicle-photo-slots";

function formatSize(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} Ko` : `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

const MIME_LABELS: Record<string, string> = {
  "image/jpeg": "JPEG",
  "image/png": "PNG",
  "image/webp": "WebP",
};

/**
 * Photos du véhicule jointes à la demande — jamais transmises à Pennylane
 * (voir src/lib/pennylane/, src/lib/pennylane-v2/), uniquement consultables
 * ici. Réutilise ProjectLightbox (déjà utilisé sur /realisations) pour la
 * grille cliquable et la visionneuse plein écran ; ajoute en dessous le
 * détail par photo (type, poids, téléchargement) que ProjectLightbox
 * n'affiche pas.
 */
export default function VehiclePhotosSection({ photos }: { photos: VehiclePhoto[] }) {
  if (photos.length === 0) {
    return (
      <section>
        <h2 className="text-white font-bold text-sm tracking-widest uppercase mb-4 pb-2 border-b border-[#1e1e1e]">
          Photos du véhicule
        </h2>
        <p className="text-gray-600 text-sm">Aucune photo jointe à cette demande.</p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-white font-bold text-sm tracking-widest uppercase mb-4 pb-2 border-b border-[#1e1e1e]">
        Photos du véhicule <span className="text-gray-600 normal-case font-normal">({photos.length})</span>
      </h2>

      <ProjectLightbox
        images={photos.map((p) => ({ src: p.url, alt: `${vehiclePhotoSlotTitle(p.slot)} — ${p.name}` }))}
      />

      <ul className="mt-4 space-y-2">
        {photos.map((p) => (
          <li
            key={p.url}
            className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border border-[#1e1e1e] text-sm"
            style={{ background: "#0d0d0d" }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <FileImage size={14} className="text-gray-500 flex-shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-white truncate">{vehiclePhotoSlotTitle(p.slot)}</p>
                <p className="text-gray-600 text-xs truncate">
                  {p.name} · {formatSize(p.size)} · {MIME_LABELS[p.mimeType] ?? p.mimeType}
                </p>
              </div>
            </div>
            <a
              href={p.url}
              download={p.name}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-brand-400 hover:text-brand-300 text-xs font-bold tracking-widest uppercase flex-shrink-0"
              aria-label={`Télécharger la photo : ${vehiclePhotoSlotTitle(p.slot)}`}
            >
              <Download size={13} /> Télécharger
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
