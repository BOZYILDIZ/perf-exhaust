"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import AppointmentSchedulePicker, { type DurationOption, type ScheduledSlot } from "./AppointmentSchedulePicker";
import { REAR_DIFFUSER_OPTIONS } from "@/lib/quote-request-options";

export interface CreateManualAppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  durationOptions: DurationOption[];
  defaultDurationMinutes: number;
  onCreated: () => void;
}

const inputStyle = "w-full bg-transparent border border-gray-800 text-white text-sm px-3 py-3 focus:outline-none focus:border-brand-500 transition-colors placeholder-gray-700";
const labelStyle = "block text-xs font-bold tracking-widest uppercase text-gray-400 mb-2";
const sectionTitle = "text-white font-bold text-xs tracking-widest uppercase mb-3 pb-2 border-b border-[#1e1e1e]";

/**
 * Création manuelle d'un rendez-vous — client passé au comptoir ou par
 * téléphone, sans demande de devis existante (voir POST
 * /api/admin/appointments/manual). Drawer latéral plein écran sur mobile,
 * panneau latéral sur tablette/desktop (formulaire long — plus adapté qu'une
 * modale centrée pour ce volume de champs).
 */
export default function CreateManualAppointmentModal({ open, onOpenChange, durationOptions, defaultDurationMinutes, onCreated }: CreateManualAppointmentModalProps) {
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [marque, setMarque] = useState("");
  const [modele, setModele] = useState("");
  const [annee, setAnnee] = useState("");
  const [motorisation, setMotorisation] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [rearDiffuser, setRearDiffuser] = useState("");
  const [vehicleNotes, setVehicleNotes] = useState("");
  const [notes, setNotes] = useState("");
  const [selection, setSelection] = useState<ScheduledSlot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const canSubmit = Boolean(prenom.trim() && nom.trim() && telephone.trim() && marque.trim() && modele.trim() && annee.trim() && selection);

  const submit = async () => {
    if (!selection) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/appointments/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prenom, nom, telephone,
          email: email || undefined,
          address: address || undefined,
          marque, modele, annee,
          motorisation: motorisation || undefined,
          licensePlate: licensePlate || undefined,
          rearDiffuser: rearDiffuser || undefined,
          vehicleNotes: vehicleNotes || undefined,
          notes: notes || undefined,
          startAt: selection.startAt,
          durationMinutes: selection.durationMinutes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Impossible de créer ce rendez-vous.");
      onCreated();
      if (!data.emailSent && email) {
        setSuccessNotice("Rendez-vous créé — Confirmation email non envoyée (échec d'envoi), vérifiez l'adresse.");
      } else if (!email) {
        setSuccessNotice("Rendez-vous créé — Confirmation email non envoyée : aucune adresse email renseignée.");
      } else {
        onOpenChange(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur réseau — réessayez.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 z-50" />
        <Dialog.Content
          className="fixed z-50 flex flex-col bg-[#0d0d0d] border-l border-[#1e1e1e] inset-0 sm:inset-y-0 sm:right-0 sm:left-auto sm:w-full sm:max-w-md"
        >
          <div className="flex items-center justify-between p-5 pb-4 flex-shrink-0 border-b border-[#1e1e1e]">
            <Dialog.Title className="text-white font-bold text-sm tracking-widest uppercase">Nouveau rendez-vous</Dialog.Title>
            <Dialog.Close className="text-gray-500 hover:text-white transition-colors p-1 -m-1" aria-label="Fermer">
              <X size={20} />
            </Dialog.Close>
          </div>

          <div className="p-5 overflow-y-auto flex-1 space-y-6">
            {successNotice ? (
              <div className="flex flex-col items-center text-center py-8 gap-4">
                <CheckCircle2 size={40} className="text-green-400" />
                <p className="text-white text-sm max-w-xs">{successNotice}</p>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="px-5 py-2.5 text-xs font-bold tracking-widest uppercase text-white"
                  style={{ background: "linear-gradient(135deg, #1266ea, #0d54c8)" }}
                >
                  Fermer
                </button>
              </div>
            ) : (
              <>
                <section>
                  <h3 className={sectionTitle}>Client</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="man-prenom" className={labelStyle}>Prénom *</label>
                      <input id="man-prenom" value={prenom} onChange={(e) => setPrenom(e.target.value)} className={inputStyle} />
                    </div>
                    <div>
                      <label htmlFor="man-nom" className={labelStyle}>Nom *</label>
                      <input id="man-nom" value={nom} onChange={(e) => setNom(e.target.value)} className={inputStyle} />
                    </div>
                    <div>
                      <label htmlFor="man-tel" className={labelStyle}>Téléphone *</label>
                      <input id="man-tel" type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} className={inputStyle} placeholder="06 XX XX XX XX" />
                    </div>
                    <div>
                      <label htmlFor="man-email" className={labelStyle}>Email</label>
                      <input id="man-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputStyle} placeholder="Optionnel" />
                    </div>
                    <div className="col-span-2">
                      <label htmlFor="man-address" className={labelStyle}>Adresse</label>
                      <input id="man-address" value={address} onChange={(e) => setAddress(e.target.value)} className={inputStyle} placeholder="Optionnelle" />
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className={sectionTitle}>Véhicule</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="man-marque" className={labelStyle}>Marque *</label>
                      <input id="man-marque" value={marque} onChange={(e) => setMarque(e.target.value)} className={inputStyle} />
                    </div>
                    <div>
                      <label htmlFor="man-modele" className={labelStyle}>Modèle *</label>
                      <input id="man-modele" value={modele} onChange={(e) => setModele(e.target.value)} className={inputStyle} />
                    </div>
                    <div>
                      <label htmlFor="man-annee" className={labelStyle}>Année *</label>
                      <input id="man-annee" value={annee} onChange={(e) => setAnnee(e.target.value)} inputMode="numeric" className={inputStyle} placeholder="2021" />
                    </div>
                    <div>
                      <label htmlFor="man-motorisation" className={labelStyle}>Motorisation</label>
                      <input id="man-motorisation" value={motorisation} onChange={(e) => setMotorisation(e.target.value)} className={inputStyle} />
                    </div>
                    <div>
                      <label htmlFor="man-plate" className={labelStyle}>Immatriculation <span className="text-gray-600 normal-case">(facultatif)</span></label>
                      <input id="man-plate" value={licensePlate} onChange={(e) => setLicensePlate(e.target.value)} className={inputStyle} placeholder="AA-123-AA" />
                    </div>
                    <div className="col-span-2">
                      <label htmlFor="man-diffuseur" className={labelStyle}>Diffuseur arrière</label>
                      <div className="flex gap-4 pt-1">
                        {REAR_DIFFUSER_OPTIONS.map((opt) => (
                          <label key={opt.value} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer min-h-[44px]">
                            <input type="radio" name="man-diffuseur" value={opt.value} checked={rearDiffuser === opt.value} onChange={() => setRearDiffuser(opt.value)} className="accent-brand-500 w-4 h-4" />
                            {opt.label}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label htmlFor="man-vehicle-notes" className={labelStyle}>Notes véhicule</label>
                      <textarea id="man-vehicle-notes" value={vehicleNotes} onChange={(e) => setVehicleNotes(e.target.value)} rows={2} className={`${inputStyle} resize-y`} />
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className={sectionTitle}>Rendez-vous</h3>
                  <AppointmentSchedulePicker
                    durationOptions={durationOptions}
                    defaultDurationMinutes={defaultDurationMinutes}
                    onChange={setSelection}
                  />
                  <div className="mt-3">
                    <label htmlFor="man-notes" className={labelStyle}>Notes atelier</label>
                    <textarea id="man-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={`${inputStyle} resize-y`} />
                  </div>
                </section>

                {error && (
                  <p className="text-sm text-red-400 px-4 py-2.5 border border-red-500/25 bg-red-500/5 flex items-start gap-2">
                    <AlertCircle size={15} className="flex-shrink-0 mt-0.5" /> {error}
                  </p>
                )}
              </>
            )}
          </div>

          {!successNotice && (
            <div className="p-5 pt-4 flex-shrink-0 border-t border-[#1e1e1e] flex flex-col sm:flex-row sm:justify-end gap-3" style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}>
              <Dialog.Close asChild>
                <button type="button" className="w-full sm:w-auto px-5 py-3 text-xs font-bold tracking-widest uppercase text-gray-400 hover:text-white transition-colors">
                  Annuler
                </button>
              </Dialog.Close>
              <button
                type="button"
                onClick={submit}
                disabled={!canSubmit || submitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold tracking-widest uppercase text-white disabled:opacity-50 transition-transform active:scale-95"
                style={{ background: "linear-gradient(135deg, #1266ea, #0d54c8)" }}
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
                Créer le rendez-vous
              </button>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
