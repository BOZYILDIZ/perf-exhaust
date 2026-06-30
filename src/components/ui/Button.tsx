"use client";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  external?: boolean;
}

const variants = {
  primary: "bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold hover:from-orange-400 hover:to-orange-500 hover:-translate-y-0.5 shadow-lg hover:shadow-orange-500/30",
  outline: "bg-transparent text-white font-bold border border-white/20 hover:border-orange-500 hover:text-orange-400 hover:-translate-y-0.5",
  ghost: "bg-transparent text-gray-400 font-medium hover:text-orange-400",
};

const sizes = {
  sm: "px-4 py-2 text-xs tracking-widest",
  md: "px-6 py-3 text-sm tracking-widest",
  lg: "px-8 py-4 text-sm tracking-widest",
};

const clipStyle = "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))";

export default function Button({
  children, href, onClick, variant = "primary", size = "md",
  className, type = "button", disabled, external,
}: ButtonProps) {
  const classes = cn(
    "inline-flex items-center gap-2 uppercase transition-all duration-200 cursor-pointer",
    variants[variant],
    sizes[size],
    disabled && "opacity-50 cursor-not-allowed pointer-events-none",
    className,
  );
  const style = variant === "primary" ? { clipPath: clipStyle } : undefined;

  if (href) {
    if (external) {
      return <a href={href} target="_blank" rel="noopener noreferrer" className={classes} style={style}>{children}</a>;
    }
    return <Link href={href} className={classes} style={style}>{children}</Link>;
  }
  return <button type={type} onClick={onClick} className={classes} style={style} disabled={disabled}>{children}</button>;
}
