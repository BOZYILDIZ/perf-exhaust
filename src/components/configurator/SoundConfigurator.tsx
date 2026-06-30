"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SOUND_PROFILES = [
  {
    id: "discret",
    label: "Discret",
    icon: "🔇",
    description: "Silencieux au quotidien, légèrement plus présent à haut régime.",
    intensity: 1,
    color: "#6b7280",
    details: ["Absence de drone à 130 km/h", "Conforme CT", "Idéal usage mixte"],
  },
  {
    id: "sportif",
    label: "Sportif",
    icon: "🔊",
    description: "Caractère marqué, crépitements en décélération.",
    intensity: 3,
    color: "#3b82f6",
    details: ["Pops & crackles à décélération", "Rumble bas régime", "Sportif mais vivable"],
  },
  {
    id: "grave",
    label: "Grave",
    icon: "〰️",
    description: "Tonalité grave et profonde, signature sonore haut de gamme.",
    intensity: 2,
    color: "#8b5cf6",
    details: ["Fréquences graves dominantes", "Grondement V8-like", "Très élégant"],
  },
  {
    id: "agressif",
    label: "Agressif",
    icon: "🔥",
    description: "Son franc et direct, présence notable en accélération.",
    intensity: 4,
    color: "#ef4444",
    details: ["Explosion en lift-off", "Très sportif", "Racing sound"],
  },
  {
    id: "fort",
    label: "Fort",
    icon: "⚡",
    description: "Signature sonore puissante pour circuit et événements.",
    intensity: 5,
    color: "#f97316",
    details: ["Volume maximum", "Pour circuit", "Valve optionnelle"],
  },
  {
    id: "sur-mesure",
    label: "Sur mesure",
    icon: "🎛️",
    description: "Nous créons exactement la sonorité que vous avez en tête.",
    intensity: 0,
    color: "#f97316",
    details: ["Consultation approfondie", "Prototypage", "Validation ensemble"],
  },
];

interface SoundConfiguratorProps {
  onSelect?: (profileId: string) => void;
  selected?: string;
}

export default function SoundConfigurator({ onSelect, selected }: SoundConfiguratorProps) {
  const [activeProfile, setActiveProfile] = useState<string>(selected || "");

  const handleSelect = (id: string) => {
    setActiveProfile(id);
    onSelect?.(id);
  };

  const active = SOUND_PROFILES.find((p) => p.id === activeProfile);

  return (
    <div className="bg-[#111] border border-white/10 p-6 md:p-8">
      <div className="mb-6">
        <div className="text-xs font-bold tracking-widest uppercase text-orange-400 mb-2">
          Configurateur Sonore
        </div>
        <h3 className="font-oswald text-2xl font-bold text-white uppercase tracking-wider mb-1">
          Choisissez votre signature sonore
        </h3>
        <p className="text-sm text-white/50">
          Chaque profil est fabriqué sur mesure dans notre atelier alsacien.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {SOUND_PROFILES.map((profile) => (
          <motion.button
            key={profile.id}
            onClick={() => handleSelect(profile.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={[
              "relative p-4 border text-left transition-all duration-200",
              activeProfile === profile.id
                ? "border-orange-500 bg-orange-500/10"
                : "border-white/10 bg-white/5 hover:border-white/30",
            ].join(" ")}
            aria-pressed={activeProfile === profile.id}
          >
            {activeProfile === profile.id && (
              <motion.div
                layoutId="sound-glow"
                className="absolute inset-0 pointer-events-none"
                style={{ boxShadow: "inset 0 0 20px rgba(249,115,22,0.15)" }}
              />
            )}
            <div className="text-2xl mb-2">{profile.icon}</div>
            <div className="font-oswald text-sm font-bold uppercase tracking-wider text-white mb-1">
              {profile.label}
            </div>
            {profile.id !== "sur-mesure" && (
              <div className="flex gap-0.5 mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-1 flex-1 rounded-full transition-colors duration-300"
                    style={{
                      backgroundColor: i < profile.intensity
                        ? profile.color
                        : "rgba(255,255,255,0.1)",
                    }}
                  />
                ))}
              </div>
            )}
            {profile.id === "sur-mesure" && (
              <div className="text-xs text-orange-400 font-bold tracking-wider uppercase mt-1">
                Personnalisé
              </div>
            )}
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {active && (
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="border border-white/10 p-4 bg-white/5"
          >
            <div className="flex items-start gap-3">
              <div className="text-3xl">{active.icon}</div>
              <div className="flex-1">
                <div className="font-oswald text-lg font-bold uppercase tracking-wider text-white mb-1">
                  {active.label}
                </div>
                <p className="text-sm text-white/60 mb-3">{active.description}</p>
                <ul className="flex flex-wrap gap-2">
                  {active.details.map((d) => (
                    <li
                      key={d}
                      className="text-xs px-2 py-1 border border-white/10 text-white/50 font-medium"
                    >
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!active && (
        <div className="border border-dashed border-white/10 p-4 text-center text-sm text-white/30">
          Sélectionnez un profil sonore pour voir les détails
        </div>
      )}
    </div>
  );
}
