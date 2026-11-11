"use client";

import React from "react";
import { AlertTriangle, AlertCircle, Info, ShieldAlert } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { cn } from "@/lib/ui/cn";

export interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "brand";
  loading?: boolean;
}

export function ConfirmationDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  loading = false,
}: ConfirmationDialogProps) {
  const iconConfig = {
    danger: {
      icon: AlertCircle,
      bg: "bg-red-50 text-danger border-red-200",
      btnVariant: "danger" as const,
    },
    warning: {
      icon: AlertTriangle,
      bg: "bg-amber-50 text-warning border-amber-200",
      btnVariant: "primary" as const,
    },
    brand: {
      icon: Info,
      bg: "bg-brand-50 text-brand-700 border-brand-200",
      btnVariant: "primary" as const,
    },
  };

  const current = iconConfig[variant];
  const Icon = current.icon;

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div className="flex items-start gap-3.5">
          <div className={cn("size-10 shrink-0 rounded-full flex items-center justify-center border", current.bg)}>
            <Icon className="size-5" />
          </div>
          <div className="text-sm text-ink-muted leading-relaxed pt-0.5">
            {description}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-line">
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button variant={current.btnVariant} size="sm" onClick={onConfirm} loading={loading}>
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

