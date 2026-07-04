"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { vehicleCatalog } from "@/data/vehicles";

export interface VehicleValue {
  marque: string;
  modele: string;
  annee: string;
  motorisation: string;
}

interface VehicleSelectorProps {
  onChange: (value: VehicleValue) => void;
  errors?: Partial<Record<keyof VehicleValue, string | undefined>>;
  /** Valeurs sauvegardées (reprise de brouillon) — ré-hydrate la cascade au montage. */
  initial?: VehicleValue;
}

const OTHER = "__autre__";

const labelStyle = "block text-xs font-bold tracking-widest uppercase text-gray-400 mb-2";
const selectStyle =
  "w-full bg-gray-950 border border-gray-800 text-white text-sm px-4 py-3 pr-10 focus:outline-none focus:border-brand-500 transition-colors appearance-none disabled:opacity-40 disabled:cursor-not-allowed";
const inputStyle =
  "w-full bg-transparent border border-gray-800 text-white text-sm px-4 py-3 focus:outline-none focus:border-brand-500 transition-colors placeholder-gray-700";
const errorStyle = "text-red-400 text-xs mt-1";

function Chevron() {
  return (
    <ChevronDown
      size={16}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
      aria-hidden="true"
    />
  );
}

/**
 * Sélection progressive du véhicule : marque → modèle → année → motorisation.
 * Chaque étape se débloque quand la précédente est renseignée ; changer une
 * étape réinitialise les suivantes. Les options « Autre » basculent sur une
 * saisie manuelle libre pour les véhicules absents du catalogue
 * (src/data/vehicles.ts).
 */
/** Reconstruit l'état de la cascade depuis des valeurs sauvegardées (best-effort). */
function deriveState(initial?: VehicleValue) {
  const empty = { brand: "", model: "", year: "", engine: "", manualBrand: "", manualModel: "", manualYear: "", manualEngine: "" };
  if (!initial?.marque) return empty;
  if (initial.marque.startsWith("Autre — ")) {
    return { ...empty, brand: OTHER, manualBrand: initial.marque.slice(8), manualModel: initial.modele, manualYear: initial.annee, manualEngine: initial.motorisation };
  }
  const brandData = vehicleCatalog.find((b) => b.brand === initial.marque);
  if (!brandData) return empty;
  const modelData = brandData.models.find((m) => m.name === initial.modele);
  if (!modelData) {
    return { ...empty, brand: initial.marque, model: OTHER, manualModel: initial.modele, manualYear: initial.annee, manualEngine: initial.motorisation };
  }
  const year = modelData.years.includes(initial.annee) ? initial.annee : "";
  const engineInList = modelData.engines.includes(initial.motorisation);
  return {
    ...empty,
    brand: initial.marque,
    model: initial.modele,
    year,
    engine: !year ? "" : engineInList ? initial.motorisation : initial.motorisation ? "Autre" : "",
    manualEngine: year && !engineInList ? initial.motorisation : "",
  };
}

export default function VehicleSelector({ onChange, errors, initial }: VehicleSelectorProps) {
  const [init] = useState(() => deriveState(initial));
  const [brand, setBrand] = useState(init.brand);
  const [model, setModel] = useState(init.model);
  const [year, setYear] = useState(init.year);
  const [engine, setEngine] = useState(init.engine);
  const [manualBrand, setManualBrand] = useState(init.manualBrand);
  const [manualModel, setManualModel] = useState(init.manualModel);
  const [manualYear, setManualYear] = useState(init.manualYear);
  const [manualEngine, setManualEngine] = useState(init.manualEngine);

  const brandData = useMemo(
    () => vehicleCatalog.find((b) => b.brand === brand),
    [brand]
  );
  const modelData = useMemo(
    () => brandData?.models.find((m) => m.name === model),
    [brandData, model]
  );

  const isManualBrand = brand === OTHER;
  const isManualModel = !isManualBrand && model === OTHER;
  // Modèle inconnu du catalogue → années et motorisations inconnues → saisie libre
  const isManualVehicle = isManualBrand || isManualModel;
  const isManualEngine = engine === "Autre";

  useEffect(() => {
    const value: VehicleValue = isManualBrand
      ? {
          marque: manualBrand.trim() ? `Autre — ${manualBrand.trim()}` : "",
          modele: manualModel.trim(),
          annee: manualYear.trim(),
          motorisation: manualEngine.trim(),
        }
      : isManualModel
        ? {
            marque: brand,
            modele: manualModel.trim(),
            annee: manualYear.trim(),
            motorisation: manualEngine.trim(),
          }
        : {
            marque: brand,
            modele: model,
            annee: year,
            motorisation: isManualEngine ? manualEngine.trim() : engine,
          };
    onChange(value);
    // onChange volontairement hors dépendances : référence stable côté parent non garantie
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brand, model, year, engine, manualBrand, manualModel, manualYear, manualEngine]);

  const handleBrand = (v: string) => {
    setBrand(v);
    setModel("");
    setYear("");
    setEngine("");
    setManualBrand("");
    setManualModel("");
    setManualYear("");
    setManualEngine("");
  };

  const handleModel = (v: string) => {
    setModel(v);
    setYear("");
    setEngine("");
    setManualModel("");
    setManualYear("");
    setManualEngine("");
  };

  const handleYear = (v: string) => {
    setYear(v);
    setEngine("");
    setManualEngine("");
  };

  return (
    <div>
      <p className="text-gray-500 text-xs leading-relaxed mb-4">
        Sélectionnez votre véhicule pour aider l&apos;atelier à préparer une estimation plus précise.
        Véhicule absent de la liste ? Choisissez «&nbsp;Autre&nbsp;».
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Marque */}
        <div>
          <label htmlFor="rv-marque" className={labelStyle}>Marque *</label>
          <div className="relative">
            <select
              id="rv-marque"
              value={brand}
              onChange={(e) => handleBrand(e.target.value)}
              className={selectStyle}
            >
              <option value="">Choisir une marque...</option>
              {vehicleCatalog.map((b) => (
                <option key={b.brand} value={b.brand}>{b.brand}</option>
              ))}
              <option value={OTHER}>Autre / je ne trouve pas mon véhicule</option>
            </select>
            <Chevron />
          </div>
          {errors?.marque && <p className={errorStyle} role="alert">{errors.marque}</p>}
        </div>

        {/* Modèle */}
        <div>
          <label htmlFor="rv-modele" className={labelStyle}>Modèle *</label>
          {isManualBrand ? (
            <input
              id="rv-modele"
              value={manualModel}
              onChange={(e) => setManualModel(e.target.value)}
              className={inputStyle}
              placeholder="ex : Giulia"
            />
          ) : (
            <div className="relative">
              <select
                id="rv-modele"
                value={model}
                onChange={(e) => handleModel(e.target.value)}
                disabled={!brand}
                aria-disabled={!brand}
                className={selectStyle}
              >
                <option value="">{brand ? "Choisir un modèle..." : "Choisissez d'abord une marque"}</option>
                {brandData?.models.map((m) => (
                  <option key={m.name} value={m.name}>{m.name}</option>
                ))}
                {brand && <option value={OTHER}>Autre modèle</option>}
              </select>
              <Chevron />
            </div>
          )}
          {errors?.modele && <p className={errorStyle} role="alert">{errors.modele}</p>}
        </div>

        {/* Marque manuelle (pleine largeur sous la ligne marque/modèle) */}
        {isManualBrand && (
          <div className="sm:col-span-2 -mt-1">
            <label htmlFor="rv-marque-manuelle" className={labelStyle}>Précisez la marque *</label>
            <input
              id="rv-marque-manuelle"
              value={manualBrand}
              onChange={(e) => setManualBrand(e.target.value)}
              className={inputStyle}
              placeholder="ex : Alfa Romeo"
            />
          </div>
        )}

        {/* Modèle manuel (si « Autre modèle » choisi dans une marque du catalogue) */}
        {isManualModel && (
          <div className="sm:col-span-2 -mt-1">
            <label htmlFor="rv-modele-manuel" className={labelStyle}>Précisez le modèle *</label>
            <input
              id="rv-modele-manuel"
              value={manualModel}
              onChange={(e) => setManualModel(e.target.value)}
              className={inputStyle}
              placeholder="ex : 718 Spyder"
            />
          </div>
        )}

        {/* Année */}
        <div>
          <label htmlFor="rv-annee" className={labelStyle}>Année *</label>
          {isManualVehicle ? (
            <input
              id="rv-annee"
              value={manualYear}
              onChange={(e) => setManualYear(e.target.value)}
              className={inputStyle}
              placeholder="ex : 2020"
              maxLength={4}
              inputMode="numeric"
            />
          ) : (
            <div className="relative">
              <select
                id="rv-annee"
                value={year}
                onChange={(e) => handleYear(e.target.value)}
                disabled={!model}
                aria-disabled={!model}
                className={selectStyle}
              >
                <option value="">{model ? "Choisir une année..." : "Choisissez d'abord un modèle"}</option>
                {modelData?.years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <Chevron />
            </div>
          )}
          {errors?.annee && <p className={errorStyle} role="alert">{errors.annee}</p>}
        </div>

        {/* Motorisation */}
        <div>
          <label htmlFor="rv-motorisation" className={labelStyle}>Motorisation (optionnel)</label>
          {isManualVehicle ? (
            <input
              id="rv-motorisation"
              value={manualEngine}
              onChange={(e) => setManualEngine(e.target.value)}
              className={inputStyle}
              placeholder="ex : 2.0 Turbo 280ch"
            />
          ) : (
            <div className="relative">
              <select
                id="rv-motorisation"
                value={engine}
                onChange={(e) => setEngine(e.target.value)}
                disabled={!year}
                aria-disabled={!year}
                className={selectStyle}
              >
                <option value="">{year ? "Choisir une motorisation..." : "Choisissez d'abord une année"}</option>
                {modelData?.engines.map((eng) => (
                  <option key={eng} value={eng}>{eng}</option>
                ))}
              </select>
              <Chevron />
            </div>
          )}
          {errors?.motorisation && <p className={errorStyle} role="alert">{errors.motorisation}</p>}
        </div>

        {/* Motorisation manuelle (si « Autre » choisi dans la liste) */}
        {!isManualVehicle && isManualEngine && (
          <div className="sm:col-span-2 -mt-1">
            <label htmlFor="rv-motorisation-manuelle" className={labelStyle}>Précisez la motorisation</label>
            <input
              id="rv-motorisation-manuelle"
              value={manualEngine}
              onChange={(e) => setManualEngine(e.target.value)}
              className={inputStyle}
              placeholder="ex : 2.0 TSI 245ch"
            />
          </div>
        )}
      </div>
    </div>
  );
}
