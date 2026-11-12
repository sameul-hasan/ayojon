import React from "react";
import Link from "@/components/ui/Link";
import { cn } from "@/lib/ui/cn";

export interface LogoProps {
  className?: string;
  imageClassName?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "full" | "icon";
  showText?: boolean;
  subtitle?: string;
  href?: string;
}

export function Logo({
  className,
  imageClassName,
  size = "md",
  variant = "full",
  showText = false,
  subtitle,
  href = "/",
}: LogoProps) {
  const sizeClasses = {
    xs: { full: "h-6", icon: "size-6" },
    sm: { full: "h-8", icon: "size-8" },
    md: { full: "h-10", icon: "size-10" },
    lg: { full: "h-12 sm:h-14", icon: "size-11 sm:size-12" },
    xl: { full: "h-14 sm:h-16 md:h-18", icon: "size-12 sm:size-14 md:size-16" },
  };

  const imageSrc = variant === "icon" ? "/logo-icon.png" : "/logo.png";
  const sizeCls = sizeClasses[size][variant];

  const content = (
    <span className={cn("inline-flex items-center gap-3 transition-transform duration-200 group-hover:scale-[1.02] select-none", className)}>
      <img
        src={imageSrc}
        alt="Aayojon"
        className={cn(sizeCls, "w-auto object-contain shrink-0 drop-shadow-xs", imageClassName)}
      />
      {(showText || subtitle) && (
        <span className="flex flex-col text-left">
          {showText && (
            <span className={cn(
              "tracking-tight text-ink leading-tight font-black",
              size === "xl" ? "text-2xl sm:text-3xl" : size === "lg" ? "text-xl sm:text-2xl" : "text-base font-bold"
            )}>
              Aayojon
            </span>
          )}
          {subtitle && (
            <span className="text-[10px] font-bold tracking-wider text-brand-700 uppercase">
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
