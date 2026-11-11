import React, { useId } from "react";
import { cn } from "@/lib/ui/cn";

const fieldBase =
  "w-full h-12 rounded-btn border bg-surface px-3.5 text-sm text-ink placeholder:text-ink-muted " +
  "transition-colors focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 " +
  "disabled:bg-canvas-alt disabled:cursor-not-allowed";

interface FieldShellProps {
  label?: string;
  hint?: string;
  error?: string;
  id: string;
  children: React.ReactNode;
}

export function FieldShell({ label, hint, error, id, children }: FieldShellProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-ink">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-err`} role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, leftIcon, className, id, ...rest },
  ref
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldShell label={label} hint={hint} error={error} id={fieldId}>
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-ink-muted">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={fieldId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fieldId}-err` : hint ? `${fieldId}-hint` : undefined}
          className={cn(fieldBase, error ? "border-danger" : "border-line", leftIcon ? "pl-10" : "", className)}
          {...rest}
        />
      </div>
    </FieldShell>
  );
});

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, className, id, children, ...rest },
  ref
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldShell label={label} hint={hint} error={error} id={fieldId}>
      <select
        ref={ref}
        id={fieldId}
        aria-invalid={error ? true : undefined}
        className={cn(fieldBase, "cursor-pointer", error ? "border-danger" : "border-line", className)}
        {...rest}
      >
        {children}
      </select>
    </FieldShell>
  );
});

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className, id, ...rest },
  ref
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldShell label={label} hint={hint} error={error} id={fieldId}>
      <textarea
        ref={ref}
        id={fieldId}
        aria-invalid={error ? true : undefined}
        className={cn(fieldBase, "h-auto min-h-28 py-3", error ? "border-danger" : "border-line", className)}
        {...rest}
      />
    </FieldShell>
  );
});

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode;
  description?: string;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, description, error, className, id, ...rest },
  ref
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-5 items-center">
        <input
          ref={ref}
          type="checkbox"
          id={fieldId}
          aria-invalid={error ? true : undefined}
          className={cn(
            "size-4.5 rounded text-brand-600 border-line bg-surface cursor-pointer",
            "focus:ring-2 focus:ring-brand-600/20 focus:ring-offset-0 transition",
            error && "border-danger",
            className
          )}
          {...rest}
        />
      </div>
      {(label || description) && (
        <div className="text-sm select-none">
          {label && (
            <label htmlFor={fieldId} className="font-medium text-ink cursor-pointer">
              {label}
            </label>
          )}
          {description && <p className="text-xs text-ink-muted">{description}</p>}
          {error && <p className="text-xs text-danger mt-0.5">{error}</p>}
        </div>
      )}
    </div>
  );
});

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode;
  description?: string;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { label, description, className, id, ...rest },
  ref
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-5 items-center">
        <input
          ref={ref}
          type="radio"
          id={fieldId}
          className={cn(
            "size-4.5 rounded-full text-brand-600 border-line bg-surface cursor-pointer",
            "focus:ring-2 focus:ring-brand-600/20 focus:ring-offset-0 transition",
            className
          )}
          {...rest}
        />
      </div>
      {(label || description) && (
        <div className="text-sm select-none">
          {label && (
            <label htmlFor={fieldId} className="font-medium text-ink cursor-pointer">
              {label}
            </label>
          )}
          {description && <p className="text-xs text-ink-muted">{description}</p>}
        </div>
      )}
    </div>
  );
});

export interface SearchInputProps extends InputProps {
  onClear?: () => void;
  showHotkey?: boolean;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { value, onChange, onClear, showHotkey = false, className, ...rest },
  ref
) {
  const hasValue = Boolean(value);
  return (
    <div className="relative w-full">
      <Input
        ref={ref}
        value={value}
        onChange={onChange}
        leftIcon={
          <svg className="size-4.5 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        }
        className={cn("pr-10", className)}
        {...rest}
      />
      {hasValue && onClear && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear search"
          className="absolute inset-y-0 right-3 flex items-center text-ink-muted hover:text-ink transition"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      {!hasValue && showHotkey && (
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[10px] font-mono text-ink-muted border border-line px-1.5 py-0.5 rounded my-auto h-5 bg-canvas-alt">
          /
        </span>
      )}
    </div>
  );
});

