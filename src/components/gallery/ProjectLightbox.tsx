"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export interface LightboxImage {
  src: string;
  alt: string;
  type?: string;
}

const TYPE_LABELS: Record<string, string> = { avant: "Avant", apres: "Après", detail: "Détail" };

/**
 * Galerie projet avec lightbox plein écran :
 * clavier (←/→/Échap), swipe tactile, compteur, préchargement des voisines.
 * Zéro dépendance externe — cohérent avec le design system.
 */
export default function ProjectLightbox({ images }: { images: LightboxImage[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  const close = useCallback(() => setOpen(null), []);
  const prev = useCallback(
    () => setOpen((i) => (i === null ? null : (i - 1 + images.length) % images.length)),
    [images.length]
  );
  const next = useCallback(
    () => setOpen((i) => (i === null ? null : (i + 1) % images.length)),
    [images.length]
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close, prev, next]);

  return (
    <>
      {/* Grille miniatures */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {images.map((img, i) => (
          <button
            key={img.src + i}
            onClick={() => setOpen(i)}
            className="group relative aspect-video overflow-hidden border border-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
            aria-label={`Agrandir : ${img.alt}`}
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              sizes="(max-width: 640px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {img.type && TYPE_LABELS[img.type] && (
              <span className="absolute top-2 left-2 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-white bg-black/60 backdrop-blur-sm">
                {TYPE_LABELS[img.type]}
              </span>
            )}
            <span className="absolute inset-0 bg-brand-500/0 group-hover:bg-brand-500/10 transition-colors" aria-hidden="true" />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {open !== null && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center animate-fade-in"
          style={{ background: "rgba(4,4,4,0.96)" }}
          role="dialog"
          aria-modal="true"
          aria-label={`Image ${open + 1} sur ${images.length} : ${images[open].alt}`}
          onClick={close}
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchStartX.current;
            if (dx > 60) prev();
            else if (dx < -60) next();
            touchStartX.current = null;
          }}
        >
          <div className="relative w-full h-full max-w-6xl max-h-[86vh] m-4 sm:m-10" onClick={(e) => e.stopPropagation()}>
            <Image
              src={images[open].src}
              alt={images[open].alt}
              fill
              sizes="100vw"
              priority
              className="object-contain"
            />
          </div>

          {/* Préchargement des voisines */}
          {images.length > 1 && (
            <div className="hidden" aria-hidden="true">
              <Image src={images[(open + 1) % images.length].src} alt="" width={16} height={16} />
              <Image src={images[(open - 1 + images.length) % images.length].src} alt="" width={16} height={16} />
            </div>
          )}

          <button
            onClick={close}
            className="absolute top-4 right-4 p-3 text-white/70 hover:text-white transition-colors"
            aria-label="Fermer la galerie"
          >
            <X size={26} />
          </button>

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 p-3 text-white/60 hover:text-brand-400 transition-colors"
                aria-label="Image précédente"
              >
                <ChevronLeft size={32} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 p-3 text-white/60 hover:text-brand-400 transition-colors"
                aria-label="Image suivante"
              >
                <ChevronRight size={32} />
              </button>
            </>
          )}

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 text-sm text-white/60">
            <span>{images[open].alt}</span>
            <span className="text-white/30">·</span>
            <span className="tabular-nums">{open + 1} / {images.length}</span>
          </div>
        </div>
      )}
    </>
  );
}
