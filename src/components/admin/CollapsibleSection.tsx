"use client";

import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Section repliable native (<details>/<summary>) — jamais de JS pour l'état
 * ouvert/fermé (accessible au clavier et aux lecteurs d'écran par défaut),
 * et les enfants ne sont jamais démontés quand la section est fermée (juste
 * masqués), donc aucune perte d'état pour les sous-composants interactifs
 * (Pennylane, agenda...). `defaultOpen` ne définit que l'état initial.
 */
const CollapsibleSection = forwardRef<HTMLDetailsElement, { title: string; defaultOpen?: boolean; id?: string; children: React.ReactNode }>(
  function CollapsibleSection({ title, defaultOpen = false, id, children }, ref) {
    return (
      <details ref={ref} id={id} open={defaultOpen} className="group">
        <summary className="flex items-center justify-between cursor-pointer list-none mb-4 pb-2 border-b border-[#1e1e1e] min-h-[44px]">
          <span className="text-white font-bold text-sm tracking-widest uppercase">{title}</span>
          <ChevronDown size={18} className="text-gray-500 transition-transform group-open:rotate-180 flex-shrink-0" aria-hidden="true" />
        </summary>
        <div className="pb-2">{children}</div>
      </details>
    );
  }
);

export default CollapsibleSection;
