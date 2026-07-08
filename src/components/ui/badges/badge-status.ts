import { StatusConfig } from "./types";

const STATUS_CLASS = "uppercase tracking-wider text-[10px]";

// ============================================================================
// HELPERS (Makes status mapping clean and removes code duplicacy)
// ============================================================================

// Helper to create a badge config object
const badge = (label: string, variant: string, extraClass = ""): StatusConfig => ({
  label,
  variant: variant as any,
  className: `${STATUS_CLASS} ${extraClass}`.trim(),
});

// Helper to format text to Title Case (e.g. "DRAFT" -> "Draft")
const toTitleCase = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

// Helper to dynamically generate dropdown filter choices from badge maps
export const getOptionsFromMap = (
  map: Record<string, StatusConfig>,
  keys: string[],
  allLabel: string,
  forceTitleCase = false
) => {
  return [
    { value: "all", label: allLabel },
    ...keys.map((key) => {
      let label = map[key]?.label || key;
      if (forceTitleCase) label = toTitleCase(label);
      return { value: key, label };
    }),
  ];
};

// ============================================================================
// 1. STATUS BADGES CONFIGURATIONS (Modify here to change badge colors/labels)
// ============================================================================

// Categories & Products Active Status
export const activeStatusMap: Record<string, StatusConfig> = {
  true: badge("Active", "success"),
  false: badge("Inactive", "slate"),
  active: badge("Active", "success"),
  inactive: badge("Inactive", "slate"),
};

// Products Published Status
export const publishedStatusMap: Record<string, StatusConfig> = {
  true: badge("Published", "indigo"),
  false: badge("Draft", "warning"),
  published: badge("Published", "indigo"),
  draft: badge("Draft", "warning"),
};

// Orders Status
export const orderStatusMap: Record<string, StatusConfig> = {
  paid: badge("Paid", "success"),
  payment_pending: badge("Payment Pending", "warning"),
  pending: badge("Payment Pending", "warning"),
  processing: badge("Processing", "info"),
  completed: badge("Completed", "success"),
  cancelled: badge("Cancelled", "danger"),
  refunded: badge("Refunded", "orange"),
  failed: badge("Failed", "danger"),
  unpaid: badge("Unpaid", "warning"),
};

// Orders Payment Status
export const paymentStatusMap: Record<string, StatusConfig> = {
  paid: badge("Paid", "success"),
  pending: badge("Pending", "orange"), // distinct bg color
  unpaid: badge("Unpaid", "orange"),
  failed: badge("Failed", "danger"),
  refunded: badge("Refunded", "info"),
};

// Orders Shipping Status
export const shippingStatusMap: Record<string, StatusConfig> = {
  order_generated: badge("Order Generated", "indigo"), // distinct bg color
  pending: badge("Pending", "info"), // sky-blue bg
  shipped: badge("Shipped", "indigo"),
  delivered: badge("Delivered", "success"),
};

// Donation Campaigns Status (Uppercase badges in tables)
export const campaignStatusMap: Record<string, StatusConfig> = {
  draft: badge("DRAFT", "warning"),
  active: badge("ACTIVE", "indigo"),
  completed: badge("COMPLETED", "success"),
  inactive: badge("INACTIVE", "slate"),
  paused: badge("PAUSED", "warning"),
  closed: badge("CLOSED", "danger"),
};

// AI Readings Status (Successed status label)
export const aiReadingsStatusMap: Record<string, StatusConfig> = {
  succeeded: badge("Successed", "success"),
  pending: badge("Pending", "warning"),
  processing: badge("Processing", "info", "animate-pulse"),
  failed: badge("Failed", "danger"),
  cancelled: badge("Cancelled", "slate"),
};

// Payments (Transactions) Status
export const transactionStatusMap: Record<string, StatusConfig> = {
  success: badge("Paid", "success"),
  successful: badge("Paid", "success"),
  completed: badge("Paid", "success"),
  captured: badge("Paid", "success"),
  paid: badge("Paid", "success"),
  succeeded: badge("Paid", "success"),
  failed: badge("Failed", "danger"),
  failure: badge("Failed", "danger"),
  declined: badge("Failed", "danger"),
  error: badge("Failed", "danger"),
  rejected: badge("Failed", "danger"),
  pending: badge("Pending", "orange"),
  initiated: badge("Pending", "orange"),
  processing: badge("Pending", "orange"),
  authorized: badge("Pending", "orange"),
  unpaid: badge("Pending", "orange"),
  created: badge("Pending", "orange"),
  refunded: badge("Refunded", "info"),
  refund: badge("Refunded", "info"),
};

// Trustee Commission Status
export const commissionStatusMap: Record<string, StatusConfig> = {
  pending: badge("Pending", "warning"),
  available: badge("Available", "success"),
  paid: badge("Paid", "indigo"),
  reversed: badge("Reversed", "danger"),
  cancelled: badge("Cancelled", "slate"),
};

// User Roles
export const roleStatusMap: Record<string, StatusConfig> = {
  admin: badge("Admin", "indigo"),
  user: badge("User", "slate"),
};

// ============================================================================
// 2. FILTER DROPDOWN OPTIONS (Automatically generated from the configs above)
// ============================================================================

export const categoryStatusOptions = getOptionsFromMap(activeStatusMap, ["active", "inactive"], "All Statuses");
export const productStatusOptions = getOptionsFromMap(activeStatusMap, ["active", "inactive"], "All Statuses");
export const productPublishedOptions = getOptionsFromMap(publishedStatusMap, ["published", "draft"], "All Published");
export const orderStatusOptions = getOptionsFromMap(orderStatusMap, ["paid", "payment_pending"], "All Statuses");
export const orderPaymentOptions = getOptionsFromMap(paymentStatusMap, ["paid", "pending"], "All Payment");
export const orderShippingOptions = getOptionsFromMap(shippingStatusMap, ["order_generated", "pending"], "All Shipping");
export const donationStatusOptions = getOptionsFromMap(paymentStatusMap, ["paid", "pending"], "All Status");
export const campaignStatusOptions = getOptionsFromMap(campaignStatusMap, ["draft", "active"], "All Statuses", true); // forceTitleCase=true -> "Draft", "Active"
export const paymentPageStatusOptions = getOptionsFromMap(paymentStatusMap, ["paid", "pending"], "All Statuses");
export const aiReadingStatusOptions = getOptionsFromMap(aiReadingsStatusMap, ["succeeded"], "All Status");