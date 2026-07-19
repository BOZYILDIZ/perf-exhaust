"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, CheckCircle, AlertCircle, Loader2, Save, ExternalLink } from "lucide-react";
import { rearDiffuserLabel } from "@/lib/quote-request-options";

const DEFAULT_PENNYLANE_URL = "https://app.pennylane.com/";

export interface PennylaneManualSource {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  marque: string;
  modele: string;
  annee: string;
  motorisation: string | null;
  typeProjet: string;
  sonorite: string;
  rearDiffuser: string;
  message: string;
}

export interface PennylaneManualState {
  pennylaneManualStatus: string | null;
  pennylaneQuoteNumber: string | null;
  pennylaneQuoteUrl: string | null;
}

const MANUAL_STATUSES = [
  { value: "a_creer", label: "À créer dans Pennylane" },
  { value: "devis_cree", label: "Devis créé" },
  { value: "devis_envoye", label: "Devis envoyé" },
  { value: "devis_accepte", label: "Devis accepté" },
  { value: "devis_refuse", label: "Devis refusé" },
  { value: "facture_creee", label: "Facture créée" },
  { value: "paye", label: "Payé" },
];

const MANUAL_STATUS_STYLES: Record<string, string> = {
  a_creer: "text-gray-400 bg-white/5",
  devis_cree: "text-brand-400 bg-brand-500/10",
  devis_envoye: "text-yellow-400 bg-yellow-500/10",
  devis_accepte: "text-green-400 bg-green-500/10",
  devis_refuse: "text-red-400 bg-red-500/10",
  facture_creee: "text-purple-300 bg-purple-500/10",
  paye: "text-green-400 bg-green-500/10",
};

const label = "block text-xs font-bold tracking-widest uppercase text-gray-400 mb-2";
const input = "w-full bg-transparent border border-gray-800 text-white text-sm px-4 py-2.5 focus:outline-none focus:border-brand-500 transition-colors";

/** Texte prêt à coller dans Pennylane — jamais de prix définitif. */
function buildClipboardText(r: PennylaneManualSource): string {
  return [
    `Nom : ${r.prenom} ${r.nom}`,
    `Email : ${r.email}`,
    `Téléphone : ${r.telephone}`,
    `Véhicule : ${r.marque} ${r.modele} (${r.annee})`,
    `Motorisation : ${r.motorisation || "Non précisée"}`,
    `Diffuseur arrière : ${rearDiffuserLabel(r.rearDiffuser)}`,
    `Type de projet : ${r.typeProjet}`,
    `Sonorité souhaitée : ${r.sonorite}`,
    "",
    "Message client :",
    r.message,
    "",
    "Ligne suggérée : Échappement sur mesure — prix à compléter",
    "TVA : 20 %",
  ].join("\n");
}

/**
 * Plan gratuit Pennylane (sans accès API) : le devis se crée à la main dans
 * Pennylane. Ce bloc ne fait qu'aider à transférer l'information sans
 * ressaisie — le suivi (statut/numéro/lien) reste déclaratif, saisi par
 * l'admin après l'avoir fait dans Pennylane. Voir docs/MAINTENANCE.md
 * § "Intégration Pennylane" (mode manuel).
 *
 * Copie et ouverture sont deux boutons distincts, jamais un seul clic
 * combiné : `window.open()` déplace le focus vers le nouvel onglet, et si un
 * `navigator.clipboard.writeText()` est encore en attente à ce moment-là,
 * certains navigateurs (Chrome en particulier) le rejettent avec
 * `NotAllowedError: Document is not focused` — la copie échouait donc de
 * façon intermittente selon la rapidité du navigateur à changer de focus.
 * En séparant les deux actions, chaque clic reste un geste utilisateur
 * direct et sans concurrence, ce qui rend la copie fiable à 100 %.
 */
export default function PennylaneManualSection({
  quoteRequestId,
  source,
  state,
  pennylaneManualUrl,
}: {
  quoteRequestId: string;
  source: PennylaneManualSource;
  state: PennylaneManualState;
  pennylaneManualUrl?: string;
}) {
  const router = useRouter();
  const [copying, setCopying] = useState(false);
  const [flowMsg, setFlowMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [showFallback, setShowFallback] = useState(false);
  const fallbackRef = useRef<HTMLTextAreaElement>(null);

  const [status, setStatus] = useState(state.pennylaneManualStatus || "a_creer");
  const [quoteNumber, setQuoteNumber] = useState(state.pennylaneQuoteNumber || "");
  const [quoteUrl, setQuoteUrl] = useState(state.pennylaneQuoteUrl || "");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const clipboardText = buildClipboardText(source);

  useEffect(() => {
    if (showFallback && fallbackRef.current) {
      fallbackRef.current.focus();
      fallbackRef.current.select();
    }
  }, [showFallback]);

  /** Étape 1 : copier — seule action du clic, aucune navigation en concurrence. */
  const copyInfo = async () => {
    setCopying(true);
    try {
      await navigator.clipboard.writeText(clipboardText);
      setShowFallback(false);
      setFlowMsg({
        type: "ok",
        text: "Informations copiées. Ouvrez Pennylane puis collez-les dans la description du devis.",
      });
    } catch {
      setShowFallback(true);
      setFlowMsg({
        type: "err",
        text: "La copie automatique a été bloquée par le navigateur. Copiez manuellement le texte ci-dessous, puis collez-le dans Pennylane.",
      });
    } finally {
      setCopying(false);
    }
  };

  /** Étape 2 : ouvrir Pennylane — action indépendante, toujours disponible. */
  const openPennylane = () => {
    window.open(pennylaneManualUrl || DEFAULT_PENNYLANE_URL, "_blank", "noopener,noreferrer");
    setFlowMsg({
      type: "ok",
      text: "Pennylane est ouvert dans un nouvel onglet. Collez les informations dans la description du devis.",
    });
  };

  const save = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch(`/api/admin/quote-requests/${quoteRequestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pennylaneManualStatus: status,
          pennylaneQuoteNumber: quoteNumber,
          pennylaneQuoteUrl: quoteUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Enregistrement impossible");
      setSaveMsg({ type: "ok", text: "Suivi Pennylane enregistré." });
      router.refresh();
    } catch (e) {
      setSaveMsg({ type: "err", text: e instanceof Error ? e.message : "Erreur" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <h2 className="text-white font-bold text-sm tracking-widest uppercase mb-4 pb-2 border-b border-[#1e1e1e]">Pennylane manuel</h2>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <span className={`text-xs font-bold px-2.5 py-1 uppercase tracking-wider ${MANUAL_STATUS_STYLES[status] ?? MANUAL_STATUS_STYLES.a_creer}`}>
          {MANUAL_STATUSES.find((s) => s.value === status)?.label ?? status}
        </span>
        {state.pennylaneQuoteUrl && (
          <a
            href={state.pennylaneQuoteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-brand-400 hover:text-brand-300 text-xs"
          >
            Ouvrir dans Pennylane <ExternalLink size={12} />
          </a>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mb-3">
        <button
          type="button"
          onClick={copyInfo}
          disabled={copying}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold tracking-widest uppercase text-white disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #1266ea, #0d54c8)" }}
        >
          {copying ? <><Loader2 size={13} className="animate-spin" /> Copie...</> : <><Copy size={13} /> Copier les informations</>}
        </button>
        <button
          type="button"
          onClick={openPennylane}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold tracking-widest uppercase text-gray-300 border border-gray-700 hover:border-gray-500 transition-colors"
        >
          <ExternalLink size={13} /> Ouvrir Pennylane
        </button>
      </div>

      {flowMsg && (
        <p
          role="status"
          className={`text-sm px-4 py-2.5 border flex items-center gap-2 mb-4 max-w-xl ${
            flowMsg.type === "ok" ? "text-green-400 border-green-500/25 bg-green-500/5" : "text-red-400 border-red-500/25 bg-red-500/5"
          }`}
        >
          {flowMsg.type === "ok" ? <CheckCircle size={15} className="flex-shrink-0" /> : <AlertCircle size={15} className="flex-shrink-0" />}
          {flowMsg.text}
        </p>
      )}

      {showFallback && (
        <div className="mb-5 max-w-xl">
          <label htmlFor="pm-fallback" className={label}>Texte à copier manuellement</label>
          <textarea
            id="pm-fallback"
            ref={fallbackRef}
            readOnly
            value={clipboardText}
            rows={10}
            onFocus={(e) => e.currentTarget.select()}
            className={input + " resize-y font-mono text-xs"}
          />
          <button
            type="button"
            onClick={copyInfo}
            disabled={copying}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 text-xs font-bold tracking-widest uppercase text-gray-300 border border-gray-700 hover:border-gray-500 disabled:opacity-50 transition-colors"
          >
            {copying ? <><Loader2 size={13} className="animate-spin" /> Copie...</> : <><Copy size={13} /> Copier à nouveau</>}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="pm-status" className={label}>Statut Pennylane</label>
          <select
            id="pm-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={input}
            style={{ background: "#0d0d0d" }}
          >
            {MANUAL_STATUSES.map((s) => (
              <option key={s.value} value={s.value} style={{ background: "#0d0d0d" }}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="pm-number" className={label}>Numéro de devis <span className="text-gray-600 normal-case">(optionnel)</span></label>
          <input
            id="pm-number"
            value={quoteNumber}
            onChange={(e) => setQuoteNumber(e.target.value)}
            className={input}
            placeholder="Ex : DEV-2026-014"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="pm-url" className={label}>Lien Pennylane <span className="text-gray-600 normal-case">(optionnel)</span></label>
          <input
            id="pm-url"
            value={quoteUrl}
            onChange={(e) => setQuoteUrl(e.target.value)}
            className={input}
            placeholder="https://app.pennylane.com/..."
          />
        </div>
      </div>

      {saveMsg && (
        <p
          role="status"
          className={`text-sm px-4 py-2.5 border flex items-center gap-2 mb-4 ${
            saveMsg.type === "ok" ? "text-green-400 border-green-500/25 bg-green-500/5" : "text-red-400 border-red-500/25 bg-red-500/5"
          }`}
        >
          {saveMsg.type === "ok" ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          {saveMsg.text}
        </p>
      )}

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold tracking-widest uppercase text-gray-300 border border-gray-700 hover:border-gray-500 disabled:opacity-50 transition-colors mb-4"
      >
        {saving ? <><Loader2 size={13} className="animate-spin" /> Enregistrement...</> : <><Save size={13} /> Enregistrer le suivi</>}
      </button>

      <p className="text-xs text-gray-500 max-w-xl">
        Plan gratuit Pennylane (sans accès API) : le devis se crée à la main dans Pennylane à partir des
        informations copiées ci-dessus. Les prix, l&apos;envoi au client, l&apos;acceptation et la facturation
        sont gérés directement dans Pennylane — ce bloc n&apos;est qu&apos;un aide-mémoire de suivi.
      </p>
    </section>
  );
}
