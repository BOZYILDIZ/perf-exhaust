import Image from "next/image";
import { ExternalLink } from "lucide-react";

/**
 * Signal de confiance compact pour le partenariat officiel SHIFTECH Strasbourg,
 * utilisé dans la navbar desktop et le menu mobile (Header.tsx). La carte
 * détaillée existante sur /a-propos (src/app/a-propos/page.tsx) reste
 * inchangée — ce badge est volontairement plus discret.
 */
export default function ShiftechPartnerBadge({
  url,
  variant,
  onClick,
}: {
  url: string;
  variant: "navbar" | "menu";
  onClick?: () => void;
}) {
  const ariaLabel = "Partenaire officiel SHIFTECH Strasbourg — ouvrir le site";

  if (variant === "navbar") {
    // Même point de bascule que la nav desktop / le burger (lg:) pour ne
    // jamais laisser de zone morte où le badge ne serait visible ni dans la
    // barre ni dans le menu mobile. Entre lg et xl, la barre est déjà dense
    // (5 liens + téléphone + CTA) : le badge reste présent mais se réduit à
    // l'icône seule plutôt que de disparaître — le texte complet ne revient
    // qu'à partir de xl quand la place ne manque plus.
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={ariaLabel}
        className="hidden lg:flex items-center gap-2 pl-3 xl:pl-4 ml-1 border-l border-white/10 group flex-shrink-0"
      >
        <Image
          src="/partners/shiftech/shiftech-icon.png"
          alt="Logo SHIFTECH"
          width={20}
          height={20}
          className="w-5 h-5 flex-shrink-0 rounded-[2px]"
        />
        <span className="hidden xl:inline leading-tight">
          <span className="block text-white/60 text-[9px] font-bold tracking-widest uppercase">
            Partenaire officiel
          </span>
          <span className="flex items-center gap-1 text-white/70 group-hover:text-brand-400 text-xs font-bold tracking-wide uppercase transition-colors whitespace-nowrap">
            SHIFTECH Strasbourg
            <ExternalLink size={10} className="flex-shrink-0" />
          </span>
        </span>
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      onClick={onClick}
      className="mt-4 p-3 min-h-[44px] border border-gray-800 rounded-sm flex items-center gap-3 hover:border-brand-500/40 transition-colors"
    >
      <Image
        src="/partners/shiftech/shiftech-icon.png"
        alt="Logo SHIFTECH"
        width={28}
        height={28}
        className="w-7 h-7 flex-shrink-0 rounded-[2px]"
      />
      <span>
        <span className="block text-gray-400 text-[10px] font-bold tracking-widest uppercase mb-0.5">
          Partenaire officiel
        </span>
        <span
          className="flex items-center gap-1.5 text-white text-sm font-bold"
          style={{ fontFamily: "var(--font-oswald), sans-serif" }}
        >
          SHIFTECH Strasbourg
          <ExternalLink size={12} className="text-gray-500 flex-shrink-0" />
        </span>
      </span>
    </a>
  );
}
