"use client";

import { useEffect, useState } from "react";
import { Puzzle, CheckCircle, Send } from "lucide-react";

/**
 * Assistant optionnel : l'extension Chrome "PERF'EXHAUST — Assistant
 * Pennylane" (chrome-extension/perfexhaust-pennylane-assistant/) lit les
 * données exposées par le script #perfexhaust-quote-data (voir la page
 * serveur) et les prérempile manuellement dans Pennylane — jamais d'envoi
 * ni de validation automatique, l'admin garde toujours le contrôle final.
 *
 * Ce composant ne lit ni ne transmet aucune donnée lui-même : il se
 * contente de déclencher l'événement `perfexhaust:quote-ready` que le
 * content script de l'extension écoute, puis d'afficher la confirmation
 * (`perfexhaust:extension-ack`) que ce même content script renvoie une
 * fois les données récupérées — une preuve concrète de fonctionnement
 * plutôt qu'un message optimiste "ça devrait marcher".
 */
export default function PennylaneExtensionSection() {
  const [status, setStatus] = useState<"idle" | "prepared" | "ack">("idle");

  useEffect(() => {
    const onAck = () => setStatus("ack");
    window.addEventListener("perfexhaust:extension-ack", onAck);
    return () => window.removeEventListener("perfexhaust:extension-ack", onAck);
  }, []);

  const prepare = () => {
    window.dispatchEvent(new CustomEvent("perfexhaust:quote-ready"));
    setStatus("prepared");
  };

  return (
    <section>
      <h2 className="text-white font-bold text-sm tracking-widest uppercase mb-4 pb-2 border-b border-[#1e1e1e] flex items-center gap-2">
        <Puzzle size={15} className="text-gray-500" /> Assistant Chrome <span className="text-gray-600 normal-case font-normal">(optionnel)</span>
      </h2>

      <button
        type="button"
        onClick={prepare}
        className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold tracking-widest uppercase text-gray-300 border border-gray-700 hover:border-gray-500 transition-colors mb-3"
      >
        <Send size={13} /> Préparer Pennylane
      </button>

      {status === "prepared" && (
        <p className="text-sm text-gray-400 px-4 py-2.5 border border-gray-800 bg-white/[0.02] mb-3 max-w-xl flex items-start gap-2">
          <CheckCircle size={15} className="text-gray-500 flex-shrink-0 mt-0.5" />
          Données prêtes. Ouvrez Pennylane dans un nouvel onglet — si l&apos;extension est installée, elle les
          détectera automatiquement et proposera de préremplir le devis.
        </p>
      )}
      {status === "ack" && (
        <p className="text-sm text-green-400 px-4 py-2.5 border border-green-500/25 bg-green-500/5 mb-3 max-w-xl flex items-start gap-2">
          <CheckCircle size={15} className="flex-shrink-0 mt-0.5" />
          Extension détectée — les données ont bien été transmises.
        </p>
      )}

      <p className="text-xs text-gray-600 max-w-xl">
        Nécessite l&apos;extension Chrome interne « PERF&apos;EXHAUST — Assistant Pennylane », installée en mode
        développeur. Elle ne fait que préremplir les champs visibles dans Pennylane — l&apos;admin vérifie le
        prix et valide toujours lui-même. Voir{" "}
        <code className="text-brand-400">chrome-extension/perfexhaust-pennylane-assistant/README.md</code>.
      </p>
    </section>
  );
}
