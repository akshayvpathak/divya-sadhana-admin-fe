import { z } from "zod";

const moneyLoose = z.union([z.number(), z.string()]).nullish();

/* ----------------------------- States ----------------------------- */

export const stateSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    code: z.string().nullish(),
    is_active: z.boolean().optional().default(true),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
  })
  .passthrough();

export const statesListSchema = z
  .object({
    message: z.string().optional(),
    data: z
      .object({
        count: z.number().optional(),
        next: z.string().nullish(),
        previous: z.string().nullish(),
        results: z.array(stateSchema),
      })
      .passthrough(),
  })
  .passthrough();

/* -------------------------- Assignments --------------------------- */

export const assignmentSchema = z
  .object({
    id: z.string(),
    // v2 seat holder (preferred)
    member: z.string().nullish(),
    member_email: z.string().nullish(),
    member_referral_code: z.string().nullish(),
    role: z.string().nullish(),
    role_display: z.string().nullish(),
    // legacy keys still accepted
    trustee: z.string().nullish(),
    trustee_referral_code: z.string().nullish(),
    trustee_email: z.string().nullish(),
    state: z.string().nullish(),
    state_name: z.string().nullish(),
    district: z.string().nullish(),
    district_name: z.string().nullish(),
    area_commission_percent: moneyLoose,
    commission_percent_override: moneyLoose,
    is_active: z.boolean().optional().default(true),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
  })
  .passthrough();

export const assignmentsListSchema = z
  .object({
    message: z.string().optional(),
    data: z
      .object({
        count: z.number().optional(),
        next: z.string().nullish(),
        previous: z.string().nullish(),
        results: z.array(assignmentSchema),
      })
      .passthrough(),
  })
  .passthrough();

export const createAssignmentSchema = z.object({
  trustee: z.string().min(1, "Trustee is required"),
  state: z.string().min(1, "State is required"),
  /** District President seats bind a district beneath the state. */
  district: z.string().nullish(),
  area_commission_percent: z.string().optional(),
  is_active: z.boolean().default(true),
});

export const updateAssignmentSchema = z.object({
  area_commission_percent: z.string().optional(),
  is_active: z.boolean().optional(),
});

export type State = z.infer<typeof stateSchema>;
export type StatesList = z.infer<typeof statesListSchema>;
export type Assignment = z.infer<typeof assignmentSchema>;
export type AssignmentsList = z.infer<typeof assignmentsListSchema>;
export type CreateAssignmentPayload = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentPayload = z.infer<typeof updateAssignmentSchema>;


/* ---------------------------- Districts --------------------------- */

export const districtSchema = z
  .object({
    id: z.string(),
    state: z.string().nullish(),
    state_name: z.string().nullish(),
    name: z.string(),
    code: z.string().nullish().default(""),
    is_active: z.boolean().optional().default(true),
  })
  .passthrough();

export const districtsListSchema = z
  .object({
    message: z.string().optional(),
    data: z
      .union([
        z.array(districtSchema),
        z
          .object({
            count: z.number().optional(),
            next: z.string().nullish(),
            previous: z.string().nullish(),
            results: z.array(districtSchema),
          })
          .passthrough(),
      ])
      .optional(),
  })
  .passthrough();

/* ----------------------------- Coverage --------------------------- */

const coverageMemberSchema = z
  .object({
    member_id: z.string().nullish(),
    name: z.string().nullish(),
    email: z.string().nullish(),
    referral_code: z.string().nullish(),
    assignment_id: z.string().nullish(),
  })
  .passthrough()
  .nullable();

export const coverageStateRowSchema = z
  .object({
    state_id: z.string(),
    state_name: z.string(),
    trustee: coverageMemberSchema.optional().nullable(),
    state_executive: coverageMemberSchema.optional().nullable(),
    districts_total: z.number().optional().default(0),
    districts_filled: z.number().optional().default(0),
    districts_open: z.number().optional().default(0),
    open_seats: z.number().optional().default(0),
  })
  .passthrough();

export const coverageListSchema = z
  .object({
    message: z.string().optional(),
    data: z
      .object({
        results: z.array(coverageStateRowSchema),
        count: z.number().optional(),
      })
      .passthrough(),
  })
  .passthrough();

export const coverageDistrictRowSchema = z
  .object({
    district_id: z.string(),
    district_name: z.string(),
    president: coverageMemberSchema.optional().nullable(),
    pincode_linked: z.boolean().optional().default(true),
  })
  .passthrough();

export const coverageDetailSchema = z
  .object({
    message: z.string().optional(),
    data: z
      .object({
        state_id: z.string(),
        state_name: z.string(),
        trustee: coverageMemberSchema.optional().nullable(),
        state_executive: coverageMemberSchema.optional().nullable(),
        districts_total: z.number().optional().default(0),
        districts_filled: z.number().optional().default(0),
        districts_open: z.number().optional().default(0),
        districts: z.array(coverageDistrictRowSchema).optional().default([]),
      })
      .passthrough(),
  })
  .passthrough();

/* ----------------------------- Retention -------------------------- */

export const retentionSummarySchema = z
  .object({
    message: z.string().optional(),
    data: z
      .object({
        pool_amount: moneyLoose,
        paid_to_network_amount: moneyLoose,
        retained_by_admin_amount: moneyLoose,
        retained_percent_of_pool: moneyLoose,
        by_kind: z.record(z.string(), moneyLoose).optional(),
        retained_by_reason: z
          .array(
            z
              .object({
                reason: z.string(),
                amount: moneyLoose,
                entries: z.number().optional(),
              })
              .passthrough()
          )
          .optional()
          .default([]),
        top_gaps: z
          .array(
            z
              .object({
                state_id: z.string().nullish(),
                state_name: z.string().nullish(),
                district_id: z.string().nullish(),
                district_name: z.string().nullish(),
                retained_amount: moneyLoose,
                entries: z.number().optional(),
              })
              .passthrough()
          )
          .optional()
          .default([]),
      })
      .passthrough(),
  })
  .passthrough();

export const retentionEntrySchema = z
  .object({
    id: z.string(),
    created_at: z.string().nullish(),
    sale_id: z.string().nullish(),
    source_kind: z.string().nullish(),
    source_reference: z.string().nullish(),
    state_name: z.string().nullish(),
    district_name: z.string().nullish(),
    kind: z.string().nullish(),
    base_amount: moneyLoose,
    percent: moneyLoose,
    amount: moneyLoose,
    beneficiary: z.string().nullish(),
    beneficiary_name: z.string().nullish(),
    retention_reason: z.string().nullish(),
    status: z.string().nullish(),
  })
  .passthrough();

export const retentionEntriesSchema = z
  .object({
    message: z.string().optional(),
    data: z
      .object({
        results: z.array(retentionEntrySchema),
        count: z.number().optional(),
      })
      .passthrough(),
  })
  .passthrough();

export type District = z.infer<typeof districtSchema>;
export type DistrictsList = z.infer<typeof districtsListSchema>;
export type CoverageStateRow = z.infer<typeof coverageStateRowSchema>;
export type CoverageList = z.infer<typeof coverageListSchema>;
export type CoverageDetail = z.infer<typeof coverageDetailSchema>["data"];
export type CoverageDistrictRow = z.infer<typeof coverageDistrictRowSchema>;
export type RetentionSummary = z.infer<typeof retentionSummarySchema>["data"];
export type RetentionEntry = z.infer<typeof retentionEntrySchema>;
export type RetentionEntries = z.infer<typeof retentionEntriesSchema>;
