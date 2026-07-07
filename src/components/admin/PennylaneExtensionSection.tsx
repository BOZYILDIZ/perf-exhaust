"use client";

import { useEffect, useRef, useState } from "react";
import { Puzzle, CheckCircle, Send, AlertTriangle, Copy, Loader2 } from "lucide-react";

/**
 * Assistant optionnel : l'extension Chrome "PERF'EXHAUST — Assistant
 * Pennylane" (chrome-extension/perfexhaust-pennylane-assistant/) lit les
 * données exposées par le script #perfexhaust-quote-data (voir la page
 * serveur) et les prérempile manuellement dans Pennylane — jamais d'envoi
 * ni de validation automatique, l'admin garde toujours le contrôle final.
 *
 * Le clic déclenche `perfexhaust:quote-ready` que le content script de
 * l'extension écoute, puis attend `perfexhaust:extension-ack` en retour —
 * une preuve concrète que l'extension a bien reçu les données. Sans ack
 * dans un délai raisonnable (extension absente, désactivée, ou service
 * worker pas encore réveillé), l'échec est affiché explicitement : ce
 * bouton ne doit jamais donner l'impression de n'avoir rien fait.
 */

type Status = "idle" | "waiting" | "ack" | "timeout" | "unavailable";

const ACK_TIMEOUT_MS = 2500;
const README_PATH = "chrome-extension/perfexhaust-pennylane-assistant/README.md";
const LOG_PREFIX = "[React] Assistant Pennylane";

interface QuoteData {
  clientName: string;
  email: string;
  phone: string;
  vehicle: string;
  engine: string | null;
  projectType: string;
  soundPreference: string;
  message: string;
  suggestedLine: string;
  vatRate: number;
}

function readQuoteData(): QuoteData | null {
  const el = document.getElementById("perfexhaust-quote-data");
  if (!el?.textContent) return null;
  try {
    return JSON.parse(el.textContent) as QuoteData;
  } catch {
    return null;
  }
}

function formatForClipboard(data: QuoteData): string {
  return [
    `Client : ${data.clientName}`,
    `Email : ${data.email}`,
    `Téléphone : ${data.phone}`,
    `Véhicule : ${data.vehicle}`,
    `Motorisation : ${data.engine || "Non précisée"}`,
    `Type de projet : ${data.projectType}`,
    `Sonorité souhaitée : ${data.soundPreference}`,
    `Message client : ${data.message}`,
    `Ligne suggérée : ${data.suggestedLine}`,
    `TVA : ${data.vatRate}%`,
  ].join("\n");
}

export default function PennylaneExtensionSection() {
  const [status, setStatus] = useState<Status>("idle");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "manual">("idle");
  const [manualText, setManualText] = useState("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    console.log(`${LOG_PREFIX} : composant monté, écoute de "perfexhaust:extension-ack"`);
    const onAck = () => {
      console.log(`${LOG_PREFIX} : ACK reçu ("perfexhaust:extension-ack") → succès`);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setStatus("ack");
    };
    window.addEventListener("perfexhaust:extension-ack", onAck);
    return () => {
      window.removeEventListener("perfexhaust:extension-ack", onAck);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const prepare = () => {
    console.log(`${LOG_PREFIX} : clic sur "Préparer Pennylane"`);
    const data = readQuoteData();
    if (!data) {
      console.error(`${LOG_PREFIX} : #perfexhaust-quote-data absent ou JSON invalide — impossible de continuer`);
      setStatus("unavailable");
      return;
    }
    console.log(`${LOG_PREFIX} : données JSON lues avec succès pour`, data.clientName);
    setCopyState("idle");
    setStatus("waiting");
    window.dispatchEvent(new CustomEvent("perfexhaust:quote-ready"));
    console.log(`${LOG_PREFIX} : événement "perfexhaust:quote-ready" envoyé, attente de l'ACK (timeout ${ACK_TIMEOUT_MS}ms)`);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      // Ne retombe en "timeout" que si aucun ack n'est arrivé pendant l'attente.
      setStatus((current) => {
        if (current === "waiting") {
          console.warn(`${LOG_PREFIX} : aucun ACK reçu après ${ACK_TIMEOUT_MS}ms → extension non détectée (content script absent, désactivé, ou storage bloqué — voir la console de la page pour un log "[PERF'EXHAUST Assistant] content script loaded")`);
          return "timeout";
        }
        return current;
      });
    }, ACK_TIMEOUT_MS);
  };

  const copyManually = async () => {
    const data = readQuoteData();
    if (!data) {
      setStatus("unavailable");
      return;
    }
    const text = formatForClipboard(data);
    try {
      if (!navigator.clipboard) throw new Error("Clipboard API indisponible");
      await navigator.clipboard.writeText(text);
      setCopyState("copied");
    } catch {
      setManualText(text);
      setCopyState("manual");
    }
  };

  return (
    <section>
      <h2 className="text-white font-bold text-sm tracking-widest uppercase mb-4 pb-2 border-b border-[#1e1e1e] flex items-center gap-2">
        <Puzzle size={15} className="text-gray-500" /> Assistant Chrome <span className="text-gray-600 normal-case font-normal">(optionnel)</span>
      </h2>

      <div className="flex flex-wrap gap-3 mb-3">
        <button
          type="button"
          onClick={prepare}
          disabled={status === "waiting"}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold tracking-widest uppercase text-gray-300 border border-gray-700 hover:border-gray-500 disabled:opacity-60 transition-colors"
        >
          {status === "waiting" ? (
            <>
              <Loader2 size={13} className="animate-spin" /> Vérification de l&apos;extension...
            </>
          ) : (
            <>
              <Send size={13} /> Préparer Pennylane
            </>
          )}
        </button>
        <button
          type="button"
          onClick={copyManually}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold tracking-widest uppercase text-gray-400 border border-gray-800 hover:border-gray-600 transition-colors"
        >
          <Copy size={13} /> Copier les informations manuellement
        </button>
      </div>

      {status === "ack" && (
        <p className="text-sm text-green-400 px-4 py-2.5 border border-green-500/25 bg-green-500/5 mb-3 max-w-xl flex items-start gap-2">
          <CheckCircle size={15} className="flex-shrink-0 mt-0.5" />
          Données préparées pour Pennylane. Ouvrez Pennylane dans un nouvel onglet — le bandeau proposera de préremplir le devis.
        </p>
      )}

      {status === "timeout" && (
        <div className="text-sm text-amber-400 px-4 py-3 border border-amber-500/25 bg-amber-500/5 mb-3 max-w-xl flex items-start gap-2">
          <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-1">Extension Chrome non détectée.</p>
            <p className="text-amber-400/80 mb-1">
              Chargez-la via <code className="text-amber-300">chrome://extensions</code> (mode développeur) — voir{" "}
              <code className="text-amber-300">{README_PATH}</code>. Si elle est déjà installée, rechargez-la après un
              rebuild puis rechargez cette page.
            </p>
            <p className="text-amber-400/80">
              En attendant, utilisez le bouton « Copier les informations manuellement » ci-dessus.
            </p>
          </div>
        </div>
      )}

      {status === "unavailable" && (
        <p className="text-sm text-red-400 px-4 py-2.5 border border-red-500/25 bg-red-500/5 mb-3 max-w-xl flex items-start gap-2">
          <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
          Impossible de préparer Pennylane : ouvrez l&apos;extension ou rechargez la page.
        </p>
      )}

      {copyState === "copied" && (
        <p className="text-sm text-green-400 px-4 py-2.5 border border-green-500/25 bg-green-500/5 mb-3 max-w-xl flex items-center gap-2">
          <CheckCircle size={15} className="flex-shrink-0" /> Copié dans le presse-papiers.
        </p>
      )}

      {copyState === "manual" && (
        <div className="mb-3 max-w-xl">
          <p className="text-sm text-amber-400 px-4 py-2 border border-amber-500/25 bg-amber-500/5 flex items-start gap-2">
            <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
            Presse-papiers indisponible ici — sélectionnez et copiez le texte ci-dessous (Cmd/Ctrl+A puis Cmd/Ctrl+C).
          </p>
          <textarea
            readOnly
            value={manualText}
            rows={8}
            onFocus={(e) => e.currentTarget.select()}
            className="w-full mt-2 bg-transparent border border-gray-800 text-gray-300 text-xs p-3 focus:outline-none focus:border-brand-500"
            style={{ background: "#0d0d0d" }}
          />
        </div>
      )}

      <p className="text-xs text-gray-600 max-w-xl">
        Nécessite l&apos;extension Chrome interne « PERF&apos;EXHAUST — Assistant Pennylane », installée en mode
        développeur. Elle ne fait que préremplir les champs visibles dans Pennylane — l&apos;admin vérifie le
        prix et valide toujours lui-même. Voir <code className="text-brand-400">{README_PATH}</code>.
      </p>
    </section>
  );
}
