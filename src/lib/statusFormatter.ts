/**
 * Formats raw status values (including boolean and null/undefined values)
 * into user-friendly Title Case labels with underscores/hyphens replaced by spaces.
 * 
 * Examples:
 * - "IN_PROGRESS" -> "In Progress"
 * - "PAYMENT_PENDING" -> "Payment Pending"
 * - "active" -> "Active"
 * - true -> "Active"
 * - false -> "Inactive"
 */
export function formatStatusLabel(status: string | boolean | null | undefined): string {
  if (status === null || status === undefined) return "";
  
  if (typeof status === "boolean") {
    return status ? "Active" : "Inactive";
  }

  const statusStr = String(status).trim();
  if (!statusStr) return "";

  // Special boolean string conversions
  if (statusStr.toLowerCase() === "true") return "Active";
  if (statusStr.toLowerCase() === "false") return "Inactive";

  // Replace underscores and hyphens with spaces, then title-case each word
  return statusStr
    .replace(/[_-]+/g, " ")
    .split(/\s+/)
    .map((word) => {
      if (!word) return "";
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}
