import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "orange" | "metal" | "green";
  className?: string;
}

const variants = {
  default: "bg-gray-800 border-gray-700 text-gray-300",
  orange: "bg-orange-500/15 border-orange-500/30 text-orange-400",
  metal: "bg-gray-700/30 border-gray-600/40 text-gray-300",
  green: "bg-green-500/15 border-green-500/30 text-green-400",
};

export default function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold tracking-widest uppercase border",
        variants[variant],
        className,
      )}
      style={{ borderRadius: "2px" }}
    >
      {children}
    </span>
  );
}
