"use client";

import { useRef, useState } from "react";
import { Camera, Trash2, Loader2, AlertCircle, ImagePlus } from "lucide-react";
import type { WorkshopPhoto } from "@/lib/agenda/workshop-photos";

export interface WorkshopPhotosPanelProps {
  appointmentId: string;
  photosAvant: WorkshopPhoto[];
  photosApres: WorkshopPhoto[];
  onChanged: () => void;
}

type Category = "avant" | "apres";

function CategorySection({
  appointmentId, category, label, photos, onChanged,
}: { appointmentId: string; category: Category; label: string; photos: WorkshopPhoto[]; onChanged: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("category", category);
      const res = await fetch(`/api/admin/appointments/${appointmentId}/photos`, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Envoi impossible");
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur réseau.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = async (url: string) => {
    if (!window.confirm("Supprimer cette photo ?")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/appointments/${appointmentId}/photos`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Suppression impossible");
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur réseau.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-bold tracking-widest uppercase text-gray-400">{label}</span>
        <span className="text-gray-600 text-xs">{photos.length} photo{photos.length > 1 ? "s" : ""}</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-2">
        {photos.map((p) => (
          <div key={p.url} className="relative w-20 h-20 flex-shrink-0 border border-gray-800 overflow-hidden group">
            {/* eslint-disable-next-line @next/next/no-img-element -- URLs Vercel Blob externes, pas un asset next/image local */}
            <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
            <button
              type="button"
              disabled={busy}
              onClick={() => remove(p.url)}
              aria-label={`Supprimer ${p.name}`}
              className="absolute top-1 right-1 w-7 h-7 flex items-center justify-center bg-black/70 text-red-400 disabled:opacity-40"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}

        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="w-20 h-20 flex-shrink-0 flex flex-col items-center justify-center gap-1 border border-dashed border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300 disabled:opacity-40 transition-colors"
        >
          {busy ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
          <span className="text-[10px] uppercase tracking-wider">Ajouter</span>
        </button>
      </div>

      {/* capture="environment" ouvre directement l'appareil photo arrière sur mobile — accept="image/*" seul laisse aussi le choix de la galerie. */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
        }}
      />

      {error && (
        <p className="text-xs px-2.5 py-2 border flex items-center gap-1.5 text-red-400 border-red-500/25 bg-red-500/5">
          <AlertCircle size={12} className="flex-shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}

/**
 * Photos avant/après intervention — nécessite BLOB_READ_WRITE_TOKEN (Vercel
 * Blob) configuré ; sans token, l'upload échoue avec un message explicite
 * (503), jamais de faux système de stockage local. Voir docs/MAINTENANCE.md.
 */
export default function WorkshopPhotosPanel({ appointmentId, photosAvant, photosApres, onChanged }: WorkshopPhotosPanelProps) {
  return (
    <div className="p-4 border grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ borderColor: "#1e1e1e", background: "#0d0d0d" }}>
      <CategorySection appointmentId={appointmentId} category="avant" label="Avant intervention" photos={photosAvant} onChanged={onChanged} />
      <CategorySection appointmentId={appointmentId} category="apres" label="Après intervention" photos={photosApres} onChanged={onChanged} />
      <p className="sm:col-span-2 text-gray-700 text-[11px] flex items-center gap-1.5">
        <ImagePlus size={12} className="flex-shrink-0" /> JPG, PNG ou WebP, 10 Mo max par photo.
      </p>
    </div>
  );
}
