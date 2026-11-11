import React from "react";
import Link from "next/link";
import { cn } from "@/lib/ui/cn";

export interface LogoProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "full" | "icon";
  showText?: boolean;
  subtitle?: string;
  href?: string;
}

export function Logo({
  className,
  size = "md",
  variant = "full",
  showText = false,
  subtitle,
  href = "/",
}: LogoProps) {
  const sizeClasses = {
    xs: { full: "h-6", icon: "size-6" },
    sm: { full: "h-7", icon: "size-7" },
    md: { full: "h-9", icon: "size-9" },
    lg: { full: "h-11", icon: "size-11" },
    xl: { full: "h-14", icon: "size-14" },
  };

  const imageSrc = variant === "icon" ? "/logo-icon.png" : "/logo.png";
  const sizeCls = sizeClasses[size][variant];

  const content = (
    <span className={cn("inline-flex items-center gap-2.5 transition-opacity hover:opacity-90 select-none", className)}>
      <img
        src={imageSrc}
        alt="Aayojon"
        className={cn(sizeCls, "w-auto object-contain shrink-0")}
      />
      {(showText || subtitle) && (
        <span className="flex flex-col text-left">
          {showText && (
            <span className="text-base font-bold tracking-tight text-ink leading-tight">
              Aayojon <span className="text-xs font-normal text-brand-600 font-sans">(আয়োজন)</span>
            </span>
          )}
          {subtitle && (
            <span className="text-[10px] font-semibold tracking-wider text-ink-muted uppercase">
              {subtitle}
            </span>
          )}
        </span>
      )}
    </span>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} aria-label="Aayojon home" className="inline-flex items-center focus-visible:outline-2 focus-visible:outline-brand-600 rounded-btn">
      {content}
    </Link>
  );
}
