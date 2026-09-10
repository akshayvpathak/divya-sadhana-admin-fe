import { z } from "zod";
import { discountFields, discountTypeEnum, refineDiscount } from "@/schemas/discount.schema";
import { SLUG_PATTERN, SLUG_PATTERN_MESSAGE } from "@/lib/slug";

/** `SadhanaService.slug` is `maxLength: 160` in the API schema. */
export const SADHANA_SERVICE_SLUG_MAX_LENGTH = 160;

export const serviceCategoryEnum = z.enum([
  "paramarsh",
  "anushthan",
  "diksha",
  "subscription",
  "class",
]);

export const inputFieldTypeEnum = z.enum([
  "text",
  "textarea",
  "number",
  "date",
  "time",
  "datetime",
  "email",
  "phone",
  "select",
  "multiselect",
  "checkbox",
  "radio",
]);

const numberish = z.union([z.number(), z.string()]).transform((value) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
});

const nullableDuration = z
  .union([z.number(), z.string(), z.null()])
  .optional()
  .transform((value) => {
    if (value === "" || value == null) return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  });

// Option rows for select / radio / multiselect fields.
const inputOptionSchema = z.object({
  value: z.string().min(1, "Value required"),
  label: z.string().min(1, "Label required"),
});

// Base object (reused by the entity schema).
export const inputSchemaItemBase = z.object({
  key: z
    .string()
    .min(1, "Key required")
    .regex(/^[a-z0-9_]+$/, "lowercase letters, digits, underscore only"),
  label: z.string().min(1, "Label required"),
  type: inputFieldTypeEnum,
  required: z.boolean().default(false),
  placeholder: z.string().optional().default(""),
  help_text: z.string().optional().default(""),
  options: z.array(inputOptionSchema).optional().default([]),
});

// Create variant adds the cross-field rule (options required for choice types).
const inputSchemaItemCreate = inputSchemaItemBase.superRefine((field, ctx) => {
  if (
    ["select", "radio", "multiselect"].includes(field.type) &&
    (field.options?.length ?? 0) === 0
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["options"],
      message: "Add at least one option",
    });
  }
});

export const pricingOptionBase = z.object({
  key: z
    .string()
    .min(1, "Key required")
    .regex(/^[a-z0-9_]+$/, "lowercase letters, digits, underscore only"),
  label: z.string().min(1, "Label required"),
  amount: numberish,
  currency: z.string().default("INR"),
  note: z.string().optional().default(""),
  travel_extra: z.boolean().optional().default(false),
  duration_days: nullableDuration,
});

/**
 * Kept un-refined so `updateSadhanaServiceSchema` can call `.partial()` on it — zod refuses
 * `.partial()` on any object carrying refinements, and doing so crashed this module at
 * evaluation time, taking the whole Sadhana Services screen down with it.
 */
const sadhanaServiceFields = z.object({
  name: z.string().min(1, "Name is required"),
  // Matched to the backend rule (`^[-a-zA-Z0-9_]+$`) rather than a stricter local
  // one, so an existing slug carrying an underscore or a capital cannot be loaded
  // into this form and then rejected on save.
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(SADHANA_SERVICE_SLUG_MAX_LENGTH, `Slug must be ${SADHANA_SERVICE_SLUG_MAX_LENGTH} characters or fewer`)
    .regex(SLUG_PATTERN, SLUG_PATTERN_MESSAGE),
  category: serviceCategoryEnum,
  description: z.string().min(1, "Description is required"),
  cover_image_key: z.string().optional().default(""),
  is_active: z.boolean().default(true),
  requires_image: z.boolean().default(false),
  requires_application: z.boolean().default(false),
  input_schema: z.array(inputSchemaItemCreate).default([]),
  pricing_options: z.array(pricingOptionBase).min(1, "Add at least one pricing option"),
  display_order: numberish.default(0),
  // Service-level, never per pricing option: one discount applied to whichever option is
  // chosen. The backend canonicalises pricing_options on write and silently drops unknown
  // keys, so a per-option discount would vanish without an error.
  ...discountFields,
});

export const createSadhanaServiceSchema = sadhanaServiceFields.superRefine(refineDiscount);

// Partial of the plain object; the discount rule is re-applied on top.
export const updateSadhanaServiceSchema = sadhanaServiceFields.partial().superRefine(refineDiscount);

export const sadhanaServiceSchema = z
  .object({
    id: z.string(),
    slug: z.string(),
    name: z.string(),
    category: z.string(),
    description: z.string().nullable().optional().default(""),
    cover_image_key: z.string().nullable().optional().default(""),
    cover_image_url: z.string().nullable().optional(),
    is_active: z.boolean(),
    requires_image: z.boolean().optional().default(false),
    requires_application: z.boolean().optional().default(false),
    input_schema: z.array(inputSchemaItemBase.passthrough()).optional().default([]),
    pricing_options: z.array(pricingOptionBase.passthrough()).optional().default([]),
    display_order: z.number().optional().default(0),
    discount_enabled: z.boolean().nullable().optional().transform((v) => v ?? false),
    discount_type: discountTypeEnum.nullable().optional().transform((v) => v ?? "percentage"),
    discount_value: z
      .union([z.number(), z.string()])
      .nullable()
      .optional()
      .transform((v) => {
        if (v === null || v === undefined || v === "") return 0;
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
      }),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
  })
  .passthrough();

export const sadhanaServicesListSchema = z
  .object({
    message: z.string().optional(),
    data: z
      .object({
        count: z.number(),
        next: z.string().nullable(),
        previous: z.string().nullable(),
        results: z.array(sadhanaServiceSchema),
      })
      .passthrough(),
  })
  .passthrough();

export type CreateSadhanaServicePayload = z.infer<typeof createSadhanaServiceSchema>;
export type UpdateSadhanaServicePayload = z.infer<typeof updateSadhanaServiceSchema>;
export type SadhanaService = z.infer<typeof sadhanaServiceSchema>;
export type SadhanaServicesList = z.infer<typeof sadhanaServicesListSchema>;
export type InputSchemaField = z.infer<typeof inputSchemaItemBase>;
export type PricingOption = z.infer<typeof pricingOptionBase>;
export type ServiceCategory = z.infer<typeof serviceCategoryEnum>;
export type InputFieldType = z.infer<typeof inputFieldTypeEnum>;
