"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  X, Loader2, AlertCircle, Phone, Mail, MapPin, ExternalLink, FileText, Receipt,
  Car, Calendar, Clock, CheckCircle2, XCircle, UserX, CalendarClock, Save, Image as ImageIcon,
} from "lucide-react";
import ScheduleAppointmentModal, { type DurationOption } from "./ScheduleAppointmentModal";
import { useAppointmentActions } from "./useAppointmentActions";
import { APPOINTMENT_STATUS_LABELS, APPOINTMENT_STATUS_STYLES } from "./AppointmentSection";

interface DetailAppointment {
  id: string;
  quoteRequestId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  vehicle: string;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  status: string;
  notes: string;
  cancelledBy: string | null;
  cancellationReason: string | null;
}

interface DetailProfile {
  pennylaneCustomerId: number | null;
  pennylaneCustomerName: string | null;
  pennylaneBillingAddress: string | null;
  vehicles: { marque: string; modele: string; annee: string; motorisation: string | null; requestCount: number }[];
  badge: { emoji: string; label: string; tone: string };
  appointmentHistory: { id: string; quoteRequestId: string; startAt: string; status: string; vehicle: string }[];
  financials: {
    notSynced: boolean;
    quotes: { id: number; number: string | null; date: string | null; status: string; amountTTC: string | null; webUrl: string }[];
    invoices: { id: number; number: string | null; date: string | null; displayStatus: string; amountTTC: number | null; amountRemaining: number | null; webUrl: string }[];
    summary: { totalBilled: number; totalRemaining: number };
  };
}

interface DetailResponse {
  appointment: DetailAppointment;
  profile: DetailProfile | null;
  pennylaneHomeUrl: string;
}

const EUR = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
function euro(n: number | string | null): string {
  if (n === null) return "—";
  const v = typeof n === "string" ? Number(n) : n;
  return Number.isFinite(v) ? EUR.format(v) : "—";
}
function frDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" });
}
function frDateTime(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", { timeZone: "Europe/Paris", weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
}

export interface AppointmentDetailPanelProps {
  appointmentId: string;
  onClose: () => void;
  onChanged: () => void;
  durationOptions: DurationOption[];
}

export default function AppointmentDetailPanel({ appointmentId, onClose, onChanged, durationOptions }: AppointmentDetailPanelProps) {
  const [data, setData] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/admin/appointments/${appointmentId}/detail`);
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      setData(d);
      setNotes(d.appointment.notes ?? "");
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Impossible de charger la fiche.");
    } finally {
      setLoading(false);
    }
  };

  const actions = useAppointmentActions(appointmentId, () => {
    onChanged();
    void load();
  });

  useEffect(() => {
    let cancelled = false;
    // IIFE async définie directement dans le corps de l'effet (pas un appel
    // à une fonction externe) : les mises à jour d'état se font après un
    // point de suspension, jamais de façon synchrone au corps de l'effet
    // lui-même — même contrainte que ScheduleAppointmentModal.tsx
    // (react-hooks/set-state-in-effect).
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await fetch(`/api/admin/appointments/${appointmentId}/detail`);
        const d = await res.json();
        if (cancelled) return;
        if (d.error) throw new Error(d.error);
        setData(d);
        setNotes(d.appointment.notes ?? "");
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Impossible de charger la fiche.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [appointmentId]);

  const saveNotes = async () => {
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/admin/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) throw new Error("Enregistrement impossible");
    } catch {
      // best-effort visuel uniquement — pas de blocage de l'UI pour une note
    } finally {
      setSavingNotes(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button type="button" aria-label="Fermer" onClick={onClose} className="absolute inset-0 bg-black/70" />
      <div
        className="relative w-full sm:max-w-md h-full overflow-y-auto p-6 z-10"
        style={{ background: "#0a0a0a", borderLeft: "1px solid #1e1e1e" }}
      >
        <button type="button" onClick={onClose} aria-label="Fermer" className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
          <X size={20} />
        </button>

        {loading ? (
          <div className="flex items-center justify-center h-40 text-gray-500"><Loader2 size={24} className="animate-spin" /></div>
        ) : loadError || !data ? (
          <p className="text-red-400 text-sm flex items-center gap-2 mt-8"><AlertCircle size={15} /> {loadError ?? "Erreur"}</p>
        ) : (
          <div className="pt-2">
            <h2 className="text-white font-black text-lg mb-1 pr-8" style={{ fontFamily: "var(--font-oswald), sans-serif" }}>
              {data.appointment.customerName}
            </h2>
            <div className="flex items-center gap-2 mb-5">
              <span className={`text-xs font-bold px-2 py-0.5 uppercase tracking-wider ${APPOINTMENT_STATUS_STYLES[data.appointment.status] ?? "text-gray-400 bg-white/5"}`}>
                {APPOINTMENT_STATUS_LABELS[data.appointment.status] ?? data.appointment.status}
              </span>
              {data.profile?.badge && (
                <span className="text-xs text-gray-500">{data.profile.badge.emoji} {data.profile.badge.label}</span>
              )}
            </div>

            {/* Actions rapides */}
            <div className="flex flex-wrap gap-2 mb-6">
              <a href={`tel:${data.appointment.customerPhone}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-300 border border-gray-700 hover:border-gray-500 transition-colors">
                <Phone size={12} /> Appeler
              </a>
              <a href={`mailto:${data.appointment.customerEmail}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-300 border border-gray-700 hover:border-gray-500 transition-colors">
                <Mail size={12} /> Email
              </a>
              {data.profile?.pennylaneBillingAddress && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.profile.pennylaneBillingAddress)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-300 border border-gray-700 hover:border-gray-500 transition-colors"
                >
                  <MapPin size={12} /> Maps
                </a>
              )}
              {data.profile?.pennylaneCustomerId && (
                <a href={data.pennylaneHomeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-300 border border-gray-700 hover:border-gray-500 transition-colors">
                  <ExternalLink size={12} /> Pennylane
                </a>
              )}
              <Link href={`/admin/devis/${data.appointment.quoteRequestId}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-300 border border-gray-700 hover:border-gray-500 transition-colors">
                <FileText size={12} /> Ouvrir la demande
              </Link>
            </div>
            {data.profile?.pennylaneBillingAddress && (
              <p className="text-gray-600 text-xs -mt-4 mb-6">
                {data.profile.pennylaneBillingAddress}
                <span className="block text-gray-700">Adresse Pennylane — peut correspondre à l&apos;atelier si le client n&apos;a pas fourni la sienne.</span>
              </p>
            )}

            {/* Infos rendez-vous */}
            <div className="mb-6 space-y-1.5 text-sm text-gray-300">
              <div className="flex items-center gap-2"><Calendar size={13} className="text-brand-400" /> {frDateTime(data.appointment.startAt)}</div>
              <div className="flex items-center gap-2"><Clock size={13} className="text-brand-400" /> {data.appointment.durationMinutes} min</div>
              <div className="flex items-center gap-2"><Car size={13} className="text-brand-400" /> {data.appointment.vehicle}</div>
            </div>

            {actions.error && (
              <p className="text-sm px-4 py-2.5 border flex items-center gap-2 mb-4 text-red-400 border-red-500/25 bg-red-500/5">
                <AlertCircle size={15} /> {actions.error}
              </p>
            )}

            {(data.appointment.status === "PENDING" || data.appointment.status === "CONFIRMED") && (
              <div className="flex flex-wrap gap-2 mb-6">
                <button type="button" onClick={() => setRescheduleOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-300 border border-gray-700 hover:border-gray-500 transition-colors">
                  <CalendarClock size={12} /> Déplacer
                </button>
                <button type="button" disabled={actions.busy !== null} onClick={actions.complete} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-green-400 border border-green-500/30 hover:border-green-400 disabled:opacity-40 transition-colors">
                  {actions.busy === "complete" ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Terminer
                </button>
                <button type="button" disabled={actions.busy !== null} onClick={actions.noShow} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-orange-400 border border-orange-500/30 hover:border-orange-400 disabled:opacity-40 transition-colors">
                  {actions.busy === "no-show" ? <Loader2 size={12} className="animate-spin" /> : <UserX size={12} />} Absent
                </button>
                <button type="button" disabled={actions.busy !== null} onClick={actions.cancel} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-red-400 border border-red-500/30 hover:border-red-400 disabled:opacity-40 transition-colors">
                  {actions.busy === "cancel" ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />} Annuler
                </button>
              </div>
            )}

            {/* Notes */}
            <div className="mb-6">
              <label htmlFor="detail-notes" className="block text-xs font-bold tracking-widest uppercase text-gray-400 mb-2">Notes</label>
              <textarea
                id="detail-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full bg-transparent border border-gray-800 text-white text-sm px-3 py-2 focus:outline-none focus:border-brand-500 transition-colors resize-y"
              />
              <button
                type="button"
                onClick={saveNotes}
                disabled={savingNotes}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #1266ea, #0d54c8)" }}
              >
                {savingNotes ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Enregistrer
              </button>
            </div>

            {/* Véhicules connus */}
            {data.profile && data.profile.vehicles.length > 0 && (
              <div className="mb-6">
                <h3 className="text-gray-400 text-xs font-bold tracking-widest uppercase mb-2">Véhicules connus</h3>
                <ul className="space-y-1.5">
                  {data.profile.vehicles.map((v, i) => (
                    <li key={i} className="text-gray-300 text-sm flex items-center gap-2">
                      <Car size={12} className="text-brand-400" /> {v.marque} {v.modele} ({v.annee}) — {v.requestCount} demande{v.requestCount > 1 ? "s" : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Historique rendez-vous */}
            {data.profile && data.profile.appointmentHistory.length > 0 && (
              <div className="mb-6">
                <h3 className="text-gray-400 text-xs font-bold tracking-widest uppercase mb-2">Historique des rendez-vous</h3>
                <ul className="space-y-1.5">
                  {data.profile.appointmentHistory.map((a) => (
                    <li key={a.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-300">{frDate(a.startAt)}</span>
                      <span className={`text-xs font-bold px-1.5 py-0.5 uppercase tracking-wider ${APPOINTMENT_STATUS_STYLES[a.status] ?? "text-gray-400 bg-white/5"}`}>
                        {APPOINTMENT_STATUS_LABELS[a.status] ?? a.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Pennylane devis/factures */}
            {data.profile && !data.profile.financials.notSynced && (
              <div className="mb-6">
                <h3 className="text-gray-400 text-xs font-bold tracking-widest uppercase mb-2">Pennylane</h3>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="px-3 py-2 border" style={{ borderColor: "#1e1e1e", background: "#0f0f0f" }}>
                    <div className="text-white text-sm font-bold">{euro(data.profile.financials.summary.totalBilled)}</div>
                    <div className="text-gray-600 text-[10px] uppercase tracking-wider">Total facturé</div>
                  </div>
                  <div className="px-3 py-2 border" style={{ borderColor: data.profile.financials.summary.totalRemaining > 0 ? "rgba(239,68,68,0.3)" : "#1e1e1e", background: "#0f0f0f" }}>
                    <div className={`text-sm font-bold ${data.profile.financials.summary.totalRemaining > 0 ? "text-red-400" : "text-white"}`}>{euro(data.profile.financials.summary.totalRemaining)}</div>
                    <div className="text-gray-600 text-[10px] uppercase tracking-wider">Reste dû</div>
                  </div>
                </div>
                {data.profile.financials.quotes.length === 0 && data.profile.financials.invoices.length === 0 ? (
                  <p className="text-gray-600 text-xs">Aucun devis ni facture Pennylane.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {data.profile.financials.quotes.map((q) => (
                      <li key={`q-${q.id}`}>
                        <a href={q.webUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-sm text-gray-300 hover:text-white">
                          <span className="inline-flex items-center gap-1.5"><FileText size={12} className="text-brand-400" /> {q.number ?? `#${q.id}`}</span>
                          <span>{euro(q.amountTTC)}</span>
                        </a>
                      </li>
                    ))}
                    {data.profile.financials.invoices.map((inv) => (
                      <li key={`i-${inv.id}`}>
                        <a href={inv.webUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-sm text-gray-300 hover:text-white">
                          <span className="inline-flex items-center gap-1.5"><Receipt size={12} className="text-brand-400" /> {inv.number ?? `#${inv.id}`}</span>
                          <span>{euro(inv.amountTTC)}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Photos — fonctionnalité non disponible sur cette branche, jamais simulée */}
            <div className="mb-2">
              <h3 className="text-gray-400 text-xs font-bold tracking-widest uppercase mb-2">Photos du véhicule</h3>
              <p className="text-gray-700 text-xs flex items-center gap-1.5"><ImageIcon size={12} /> Aucune photo disponible (fonctionnalité non activée).</p>
            </div>
          </div>
        )}
      </div>

      {data && (
        <ScheduleAppointmentModal
          key={String(rescheduleOpen)}
          open={rescheduleOpen}
          onOpenChange={setRescheduleOpen}
          mode="reschedule"
          quoteRequestId={data.appointment.quoteRequestId}
          appointmentId={data.appointment.id}
          durationOptions={durationOptions}
          defaultDurationMinutes={data.appointment.durationMinutes}
          onScheduled={() => { onChanged(); load(); }}
        />
      )}
    </div>
  );
}
