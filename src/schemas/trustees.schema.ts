import { z } from "zod";

const moneyLoose = z.union([z.number(), z.string()]).nullish();

/* ------------------------ Trustee (list row) ----------------------- */
// Defensive shape: the backend list payload is not fully specced in the
// guides, so most fields are optional/nullish and unknown keys pass through.
export const trusteeSchema = z
  .object({
    id: z.string(),
    user: z.union([z.string(), z.record(z.string(), z.any())]).nullish(),
    // Backend list payload uses `user_email` / `user_full_name`; older shapes
    // used `email` / `name`. Accept both so display logic can fall back.
    user_email: z.string().nullish(),
    user_full_name: z.string().nullish(),
    email: z.string().nullish(),
    name: z.string().nullish(),
    first_name: z.string().nullish(),
    last_name: z.string().nullish(),
    referral_code: z.string().nullish(),
    commission_percent: moneyLoose,
    state: z.string().nullish(),
    district: z.string().nullish(),
    notes: z.string().nullish(),
    is_active: z.boolean().optional().default(true),
    // some APIs inline the assigned states; accept any shape
    states: z.array(z.any()).optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
  })
  .passthrough();

export const trusteesListSchema = z
  .object({
    message: z.string().optional(),
    data: z
      .object({
        count: z.number().optional(),
        next: z.string().nullish(),
        previous: z.string().nullish(),
        results: z.array(trusteeSchema),
      })
      .passthrough(),
  })
  .passthrough();

export const promoteTrusteeSchema = z.object({
  email: z.string().trim().email("Select a valid user"),
  commission_percent: z.string().min(1, "Commission % is required"),
  state: z.string().optional(),
  district: z.string().optional(),
  notes: z.string().optional(),
});

/* ------------ Atomic promote-with-territory (multi-state) ---------- */
// POST /api/trustee/promote-with-territory/ — all-or-nothing: creates the
// trustee AND every territory assignment in one transaction.

const stateAssignmentSchema = z.object({
  state_id: z.string().min(1, "State is required"),
  // number input yields a string; a bare number is also accepted per contract.
  area_commission_percent: z.union([
    z.string().min(1, "Area commission % is required"),
    z.number(),
  ]),
});

export const promoteTrusteeWithTerritorySchema = z.object({
  email: z.string().trim().email("Select a valid user"),
  commission_percent: z.string().min(1, "Commission % is required"),
  district: z.string().min(1, "District is required"),
  notes: z.string().optional(),
  state_assignments: z
    .array(stateAssignmentSchema)
    .min(1, "Add at least one state"),
});

// response.data shape wrapped in the `{ message, data }` envelope.
export const promoteTrusteeWithTerritoryResponseSchema = z
  .object({
    message: z.string().optional(),
    data: z
      .object({
        trustee: z
          .object({
            id: z.string(),
            referral_code: z.string().nullish(),
            commission_percent: moneyLoose,
            is_active: z.boolean().optional().default(true),
          })
          .passthrough(),
        assignments: z.array(
          z
            .object({
              id: z.string(),
              state: z.string().nullish(),
              state_name: z.string().nullish(),
              is_active: z.boolean().optional().default(true),
            })
            .passthrough()
        ),
      })
      .passthrough(),
  })
  .passthrough();

/* --------------------------- Dashboard ----------------------------- */

const walletSchema = z
  .object({
    balance: moneyLoose,
    available_balance: moneyLoose,
    pending_balance: moneyLoose,
    held_amount: moneyLoose,
  })
  .partial()
  .passthrough();

const byKindSchema = z
  .object({
    area: moneyLoose,
    referral: moneyLoose,
  })
  .partial()
  .passthrough();

const commissionsBlockSchema = z
  .object({
    pending: moneyLoose,
    available_lifetime: moneyLoose,
    reversed_lifetime: moneyLoose,
    by_kind: byKindSchema.optional(),
  })
  .partial()
  .passthrough();

export const trusteeDashboardSchema = z
  .object({
    message: z.string().optional(),
    data: z
      .object({
        wallet: walletSchema.optional(),
        commissions: commissionsBlockSchema.optional(),
        // trustee meta may be nested or top-level — accept both
        trustee: z.any().optional(),
        referral_code: z.string().nullish(),
        email: z.string().nullish(),
        name: z.string().nullish(),
        commission_percent: moneyLoose,
        is_active: z.boolean().optional(),
      })
      .passthrough(),
  })
  .passthrough();

/* ----------------------- Commission ledger ------------------------- */

export const commissionEntrySchema = z
  .object({
    id: z.string(),
    order: z.any().optional(),
    order_number: z.string().nullish(),
    kind: z.string().nullish(),
    amount: moneyLoose,
    base_amount: moneyLoose,
    percent_snapshot: moneyLoose,
    status: z.string().nullish(),
    matures_at: z.string().nullish(),
    delivered_at: z.string().nullish(),
    reversed_reason: z.string().nullish(),
    created_at: z.string().nullish(),
  })
  .passthrough();

export const commissionsListSchema = z
  .object({
    message: z.string().optional(),
    data: z
      .object({
        count: z.number().optional(),
        next: z.string().nullish(),
        previous: z.string().nullish(),
        results: z.array(commissionEntrySchema),
      })
      .passthrough(),
  })
  .passthrough();

export type Trustee = z.infer<typeof trusteeSchema>;
export type TrusteesList = z.infer<typeof trusteesListSchema>;
export type PromoteTrusteePayload = z.infer<typeof promoteTrusteeSchema>;
export type PromoteTrusteeWithTerritoryPayload = z.infer<
  typeof promoteTrusteeWithTerritorySchema
>;
export type PromoteTrusteeWithTerritoryResult = z.infer<
  typeof promoteTrusteeWithTerritoryResponseSchema
>["data"];
export type TrusteeDashboard = z.infer<typeof trusteeDashboardSchema>["data"];
export type CommissionEntry = z.infer<typeof commissionEntrySchema>;
export type CommissionsList = z.infer<typeof commissionsListSchema>;
