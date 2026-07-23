import { z } from "zod";

const moneyLoose = z.union([z.number(), z.string()]).nullish();

/**
 * Withdrawal lifecycle statuses and payout methods.
 *
 * These mirror the backend enum described in the API guide. They are exported
 * so the list page can build a status filter without hard-coding strings.
 */
export const WITHDRAWAL_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "paid",
  "failed",
  "cancelled",
] as const;

export const WITHDRAWAL_METHODS = ["upi", "bank_transfer"] as const;

/* --------------------------- Withdrawal ---------------------------- */
// Defensive shape: the withdrawal object is hand-written in the backend doc
// (not captured from a live response), so nearly everything is optional/nullish
// and unknown keys pass through. `id` accepts string|number and is normalized
// to a string so it is safe to use in URLs, query keys, and table row keys.
export const withdrawalSchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform(String),
    amount: moneyLoose,
    // Kept as loose strings (not z.enum) so an unexpected backend value never
    // fails parsing; display/badge logic normalizes case defensively.
    status: z.string().nullish(),
    method: z.string().nullish(),
    created_at: z.string().nullish(),
    processed_at: z.string().nullish(),
    reason: z.string().nullish(),
    // Payout details (only the relevant set is present per method).
    upi_id: z.string().nullish(),
    bank_account_number: z.string().nullish(),
    bank_account_name: z.string().nullish(),
    bank_ifsc: z.string().nullish(),
    // Trustee identity — may be an id, a nested object, or flattened fields.
    trustee: z.union([z.string(), z.record(z.string(), z.any())]).nullish(),
    trustee_name: z.string().nullish(),
    trustee_email: z.string().nullish(),
  })
  .passthrough();

export const withdrawalsListSchema = z
  .object({
    message: z.string().optional(),
    data: z
      .object({
        count: z.number().optional(),
        next: z.string().nullish(),
        previous: z.string().nullish(),
        results: z.array(withdrawalSchema),
      })
      .passthrough(),
  })
  .passthrough();

/* ----------------------- Action reason input ----------------------- */
// Used by the reject / mark-failed dialogs. The backend accepts `reason`
// (tolerant of `note`); we always send `reason`.
export const withdrawalActionReasonSchema = z.object({
  reason: z.string().trim().min(1, "Please provide a reason"),
});

export type Withdrawal = z.infer<typeof withdrawalSchema>;
export type WithdrawalsList = z.infer<typeof withdrawalsListSchema>;
export type WithdrawalStatus = (typeof WITHDRAWAL_STATUSES)[number];
export type WithdrawalMethod = (typeof WITHDRAWAL_METHODS)[number];
export type WithdrawalActionReasonInput = z.infer<
  typeof withdrawalActionReasonSchema
>;
