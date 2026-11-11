import React from "react";
import { cn } from "@/lib/ui/cn";

export interface PageContainerProps {
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "4xl" | "5xl" | "6xl" | "7xl" | "full";
  className?: string;
  header?: React.ReactNode;
}

export function PageContainer({
  children,
  maxWidth = "7xl",
  className,
  header,
}: PageContainerProps) {
  const maxWidthClasses = {
    sm: "max-w-screen-sm",
    md: "max-w-screen-md",
    lg: "max-w-screen-lg",
    xl: "max-w-screen-xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    "6xl": "max-w-6xl",
    "7xl": "max-w-7xl",
    full: "max-w-full",
  };

  return (
    <div className={cn("mx-auto w-full px-4 py-8 sm:px-6 lg:px-8", maxWidthClasses[maxWidth], className)}>
      {header && <div className="mb-6">{header}</div>}
      {children}
    </div>
  );
}

