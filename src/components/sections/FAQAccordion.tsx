"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import type { PublicFAQ } from "@/lib/faq-repo";

export default function FAQAccordion({ items }: { items: PublicFAQ[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="space-y-2" role="list">
      {items.map((faq, i) => (
        <div key={i} className="border border-white/10 overflow-hidden" role="listitem">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between p-5 text-left gap-4 hover:bg-white/5 transition-colors"
            aria-expanded={open === i}
            aria-controls={"faq-answer-" + i}
          >
            <span className="font-medium text-white leading-snug pr-4">{faq.question}</span>
            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center border border-white/20 text-brand-400">
              {open === i ? <Minus size={12} /> : <Plus size={12} />}
            </span>
          </button>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div
                id={"faq-answer-" + i}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden"
                role="region"
              >
                <div className="px-5 pb-5 border-t border-white/5">
                  <p className="text-white/60 leading-relaxed pt-4">{faq.answer}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
