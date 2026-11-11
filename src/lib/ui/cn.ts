/** Join class names, skipping falsy values. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/**
 * Format a backend price as BDT. Backend prices are stored in minor units (paisa),
 * matching `formatBDT` in src/lib/seed.ts, e.g. 79900 -> ৳799.
 */
export function formatBDT(minorUnits: number): string {
  if (minorUnits === 0) return "Free";
  const taka = minorUnits / 100;
  return `৳${taka.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}
