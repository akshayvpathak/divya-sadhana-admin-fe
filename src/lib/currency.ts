/**
 * Money/number formatting helpers.
 *
 * Backend Decimal fields arrive as strings (e.g. "1000.00"). These helpers
 * coerce string | number | null | undefined safely before formatting.
 */

export function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/** Format a value as Indian Rupees, e.g. 1000 -> "₹1,000.00". */
export function formatINR(value: string | number | null | undefined): string {
  return `₹${toNumber(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Format a commission percent value, e.g. "15.00" -> "15%", "12.50" -> "12.5%". */
export function formatPercent(value: string | number | null | undefined): string {
  return `${toNumber(value)}%`;
}
