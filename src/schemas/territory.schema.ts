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
    trustee: z.string().nullish(),
    state: z.string().nullish(),
    area_commission_percent: moneyLoose,
    is_active: z.boolean().optional().default(true),
    // read-only display fields the API returns alongside
    trustee_referral_code: z.string().nullish(),
    trustee_email: z.string().nullish(),
    state_name: z.string().nullish(),
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
