import type { PaymentSource } from "@/schemas/payments.schema";

export const PAYMENT_SOURCE_LABELS: Record<string, string> = {
  ecommerce: "Shop",
  ai_report: "AI Reading",
  donation: "Donation",
  consultation: "Consultation",
  sadhana: "Sadhana",
  wallet_topup: "Wallet Top-up",
};

export const PAYMENT_SOURCE_BADGE: Record<string, string> = {
  ecommerce: "bg-tint text-gold-press border-gold/25",
  ai_report: "bg-plum-tint text-plum-ink border-plum/25",
  donation: "bg-success-tint text-success-ink border-success/25",
  consultation: "bg-info-tint text-info-ink border-info/20",
  sadhana: "bg-warning-tint text-warning-ink border-warning/25",
  wallet_topup: "bg-royal-tint text-royal border-royal/25",
};

/**
 * Deep link for the record a unified payment paid for.
 * Returns null when there is no admin screen (e.g. consultation).
 */
export function paymentRelatedHref(
  source: string | null | undefined,
  referenceId: string | null | undefined
): string | null {
  if (!source) return null;
  if (source === "wallet_topup") return "/withdrawals";
  if (!referenceId) return null;

  switch (source as PaymentSource) {
    case "ecommerce":
      return `/orders/${referenceId}`;
    case "ai_report":
      return `/ai-readings/${referenceId}`;
    case "donation":
      return `/donations/${referenceId}`;
    case "sadhana":
      return `/service-bookings/${referenceId}`;
    case "consultation":
      return null;
    default:
      return null;
  }
}

export function paymentRelatedLabel(source: string | null | undefined): string {
  if (!source) return "Related";
  return PAYMENT_SOURCE_LABELS[source] ?? source.replace(/_/g, " ");
}
