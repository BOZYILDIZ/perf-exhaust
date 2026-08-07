"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { Camera, Upload, X, AlertCircle, Loader2, FileImage } from "lucide-react";
import {
  ALLOWED_PHOTO_MIME_TYPES,
  MAX_PHOTO_SIZE_BYTES,
  VEHICLE_PHOTO_SLOTS,
  type VehiclePhoto,
  type VehiclePhotoSlotKey,
} from "@/lib/vehicle-photo-slots";

const ACCEPT = ALLOWED_PHOTO_MIME_TYPES.join(",");

function formatSize(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} Ko` : `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function validateFile(file: File): string | null {
  if (!ALLOWED_PHOTO_MIME_TYPES.includes(file.type as (typeof ALLOWED_PHOTO_MIME_TYPES)[number])) {
    return "Format non supporté — JPG, PNG ou WebP uniquement.";
  }
  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    return "Fichier trop volumineux — 10 Mo maximum.";
  }
  return null;
}

/** Upload avec suivi de progression réel (XHR — fetch() ne l'expose pas). */
function uploadWithProgress(
  file: File,
  slot: VehiclePhotoSlotKey,
  onProgress: (pct: number) => void
): Promise<{ url: string; name: string; size: number; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/rendez-vous/upload");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      let body: { success?: boolean; error?: string; url?: string; name?: string; size?: number; mimeType?: string } = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        reject(new Error("Réponse du serveur invalide"));
        return;
      }
      if (xhr.status >= 200 && xhr.status < 300 && body.success && body.url) {
        resolve({ url: body.url, name: body.name ?? file.name, size: body.size ?? file.size, mimeType: body.mimeType ?? file.type });
      } else {
        reject(new Error(body.error || "Échec de l'upload"));
      }
    };
    xhr.onerror = () => reject(new Error("Échec de l'upload — vérifiez votre connexion"));
    const formData = new FormData();
    formData.append("file", file);
    formData.append("slot", slot);
    xhr.send(formData);
  });
}

interface SlotState {
  photo: VehiclePhoto | null;
  progress: number | null; // null = pas d'upload en cours
  error: string | null;
  previewUrl: string | null; // aperçu local instantané avant que l'upload ne se termine
}

function SlotCard({
  slot,
  state,
  onFile,
  onRemove,
}: {
  slot: (typeof VEHICLE_PHOTO_SLOTS)[number];
  state: SlotState;
  onFile: (file: File) => void;
  onRemove: () => void;
}) {
  const inputId = useId();
  const [dragOver, setDragOver] = useState(false);
  const uploading = state.progress !== null;

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) onFile(file);
  };

  return (
    <div
      className="p-4 border transition-colors"
      style={{
        borderColor: dragOver ? "#1266ea" : "#1e1e1e",
        background: dragOver ? "rgba(18,102,234,0.05)" : "#0d0d0d",
      }}
      onDragOver={(e) => { e.preventDefault(); if (!uploading) setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (!uploading) handleFiles(e.dataTransfer.files);
      }}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 flex items-center justify-center bg-brand-500/10 border border-brand-500/20 text-brand-400 flex-shrink-0">
          <Camera size={16} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-white font-bold text-sm">{slot.title}</h3>
            <span
              className={`text-[10px] font-bold tracking-widest uppercase px-1.5 py-0.5 ${
                slot.required ? "text-brand-400 bg-brand-500/10" : "text-gray-500 bg-white/5"
              }`}
            >
              {slot.required ? "Obligatoire" : "Optionnel"}
            </span>
          </div>
          <p className="text-gray-500 text-xs mt-0.5">{slot.description}</p>
        </div>
      </div>

      {state.photo || state.previewUrl ? (
        <div className="relative">
          <div className="relative aspect-video overflow-hidden border border-gray-800">
            {state.previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- aperçu local instantané (blob: URL), next/image ne gère pas ce protocole
              <img src={state.previewUrl} alt={`Aperçu — ${slot.title}`} className="w-full h-full object-cover" />
            ) : (
              <Image src={state.photo!.url} alt={`Photo — ${slot.title}`} fill sizes="(max-width: 640px) 100vw, 300px" className="object-cover" />
            )}
            {uploading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70">
                <Loader2 size={20} className="animate-spin text-brand-400" />
                <div className="w-2/3 h-1 bg-white/10 overflow-hidden">
                  <div className="h-full bg-brand-500 transition-all duration-150" style={{ width: `${state.progress}%` }} />
                </div>
                <span className="text-xs text-gray-300 tabular-nums">{state.progress}%</span>
              </div>
            )}
          </div>
          {state.photo && !uploading && (
            <>
              <button
                type="button"
                onClick={onRemove}
                className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-black/70 hover:bg-red-500/80 text-white transition-colors"
                aria-label={`Supprimer la photo — ${slot.title}`}
              >
                <X size={14} />
              </button>
              <p className="text-gray-600 text-xs mt-1.5 truncate flex items-center gap-1.5">
                <FileImage size={11} className="flex-shrink-0" aria-hidden="true" />
                {state.photo.name} · {formatSize(state.photo.size)}
              </p>
            </>
          )}
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className="flex flex-col items-center justify-center gap-2 aspect-video border border-dashed border-gray-800 cursor-pointer hover:border-brand-500/50 transition-colors text-center px-3"
        >
          <Upload size={18} className="text-gray-600" aria-hidden="true" />
          <span className="text-gray-400 text-xs">
            Glissez une photo ici ou <span className="text-brand-400 underline underline-offset-2">choisir un fichier</span>
          </span>
        </label>
      )}

      <input
        id={inputId}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        disabled={uploading}
        onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
        aria-describedby={state.error ? `${inputId}-error` : undefined}
      />

      {state.error && (
        <p id={`${inputId}-error`} role="alert" className="text-red-400 text-xs mt-2 flex items-center gap-1.5">
          <AlertCircle size={11} className="flex-shrink-0" /> {state.error}
        </p>
      )}
    </div>
  );
}

/**
 * Upload des photos du véhicule vers Vercel Blob (voir /api/rendez-vous/upload) —
 * un emplacement fixe par photo, jamais de galerie libre : plafonne
 * naturellement à 5 images. `onChange` reçoit la liste des photos
 * effectivement uploadées (jamais les fichiers eux-mêmes) pour être
 * intégrée aux données du formulaire par le composant parent.
 */
export default function VehiclePhotoUpload({
  initial,
  onChange,
}: {
  /** Photos déjà uploadées à restaurer (ex: reprise de brouillon) — jamais re-uploadées, juste ré-affichées dans leur emplacement. */
  initial?: VehiclePhoto[];
  onChange: (photos: VehiclePhoto[]) => void;
}) {
  const [states, setStates] = useState<Record<VehiclePhotoSlotKey, SlotState>>(() =>
    Object.fromEntries(
      VEHICLE_PHOTO_SLOTS.map((s) => [
        s.key,
        { photo: initial?.find((p) => p.slot === s.key) ?? null, progress: null, error: null, previewUrl: null },
      ])
    ) as Record<VehiclePhotoSlotKey, SlotState>
  );
  const objectUrls = useRef<Set<string>>(new Set());

  const revokePreview = useCallback((url: string | null) => {
    if (url && objectUrls.current.has(url)) {
      URL.revokeObjectURL(url);
      objectUrls.current.delete(url);
    }
  }, []);

  // Filet de sécurité : révoque toute URL d'aperçu encore en mémoire si le
  // formulaire est démonté avant la fin d'un upload (évite une fuite mémoire).
  useEffect(() => {
    const urls = objectUrls.current;
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
      urls.clear();
    };
  }, []);

  const emitChange = useCallback((next: Record<VehiclePhotoSlotKey, SlotState>) => {
    onChange(
      VEHICLE_PHOTO_SLOTS.map((s) => next[s.key].photo).filter((p): p is VehiclePhoto => p !== null)
    );
  }, [onChange]);

  const handleFile = useCallback((slot: VehiclePhotoSlotKey, file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setStates((prev) => {
        const next = { ...prev, [slot]: { ...prev[slot], error: validationError } };
        return next;
      });
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    objectUrls.current.add(previewUrl);

    setStates((prev) => {
      const next = { ...prev, [slot]: { photo: null, progress: 0, error: null, previewUrl } };
      return next;
    });

    uploadWithProgress(file, slot, (pct) => {
      setStates((prev) => ({ ...prev, [slot]: { ...prev[slot], progress: pct } }));
    })
      .then((result) => {
        revokePreview(previewUrl);
        setStates((prev) => {
          const next: Record<VehiclePhotoSlotKey, SlotState> = {
            ...prev,
            [slot]: { photo: { slot, ...result }, progress: null, error: null, previewUrl: null },
          };
          emitChange(next);
          return next;
        });
      })
      .catch((err: Error) => {
        revokePreview(previewUrl);
        setStates((prev) => ({ ...prev, [slot]: { photo: null, progress: null, error: err.message, previewUrl: null } }));
      });
  }, [emitChange, revokePreview]);

  const handleRemove = useCallback((slot: VehiclePhotoSlotKey) => {
    setStates((prev) => {
      revokePreview(prev[slot].previewUrl);
      const next: Record<VehiclePhotoSlotKey, SlotState> = {
        ...prev,
        [slot]: { photo: null, progress: null, error: null, previewUrl: null },
      };
      emitChange(next);
      return next;
    });
  }, [emitChange, revokePreview]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {VEHICLE_PHOTO_SLOTS.map((slot) => (
        <SlotCard
          key={slot.key}
          slot={slot}
          state={states[slot.key]}
          onFile={(file) => handleFile(slot.key, file)}
          onRemove={() => handleRemove(slot.key)}
        />
      ))}
    </div>
  );
}
