import { cn } from "@/lib/utils";

interface SectionTitleProps {
  label?: string;
  title: string;
  subtitle?: string;
  centered?: boolean;
  className?: string;
}

export default function SectionTitle({ label, title, subtitle, centered, className }: SectionTitleProps) {
  return (
    <div className={cn(centered && "text-center", className)}>
      {label && (
        <div className={cn("flex items-center gap-3 mb-3", centered && "justify-center")}>
          <div className="w-8 h-0.5 bg-brand-500" />
          <span className="text-brand-500 text-xs font-bold tracking-widest uppercase">{label}</span>
        </div>
      )}
      <h2
        className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4 leading-tight"
        style={{ fontFamily: "Oswald, sans-serif", letterSpacing: "-0.01em" }}
        dangerouslySetInnerHTML={{ __html: title }}
      />
      {subtitle && (
        <p className="text-gray-400 text-base md:text-lg leading-relaxed max-w-2xl">
          {subtitle}
        </p>
      )}
    </div>
  );
}
