import { z } from "zod";
import { discountFields, discountTypeEnum, refineDiscount } from "@/schemas/discount.schema";

/**
 * AI services — the paid "unlock the full report" products behind /ai-services.
 *
 * The admin panel manages pricing only. Prompt templates, model ids and input schemas are
 * configured elsewhere and are deliberately not editable here, so this screen cannot break a
 * live reading pipeline by accident.
 */

const moneyToNumber = (val: unknown) => {
  if (val === null || val === undefined || val === "") return 0;
  const n = parseFloat(String(val));
  return Number.isFinite(n) ? n : 0;
};

export const aiServiceSchema = z
  .object({
    id: z.string(),
    slug: z.string().nullable().optional().default(""),
    name: z.string().nullable().optional().default(""),
    kind: z.string().nullable().optional().default(""),
    description: z.string().nullable().optional().default(""),
    report_unlock_price: z
      .union([z.number(), z.string()])
      .nullable()
      .optional()
      .transform(moneyToNumber),
    currency: z.string().nullable().optional().default("INR"),
    is_active: z.boolean().nullable().optional().transform((v) => v ?? true),
    cover_image_url: z.string().nullable().optional(),
    discount_enabled: z.boolean().nullable().optional().transform((v) => v ?? false),
    discount_type: discountTypeEnum.nullable().optional().transform((v) => v ?? "percentage"),
    discount_value: z
      .union([z.number(), z.string()])
      .nullable()
      .optional()
      .transform(moneyToNumber),
  })
  .passthrough();

/** The list endpoint is paginated like every other collection in this API. */
export const aiServicesListSchema = z.object({
  message: z.string().optional(),
  data: z.object({
    count: z.number(),
    next: z.string().nullable(),
    previous: z.string().nullable(),
    results: z.array(aiServiceSchema),
  }),
});

export const aiServiceResponseSchema = z.object({
  message: z.string().optional(),
  data: aiServiceSchema,
});

/** Pricing-only edit form. */
export const aiServicePricingFormSchema = z
  .object({
    report_unlock_price: z
      .union([z.number(), z.string()])
      .transform((v) => {
        if (v === "" || v === null || v === undefined) return NaN;
        const n = Number(v);
        return Number.isNaN(n) ? NaN : n;
      })
      .refine((v) => !Number.isNaN(v), { message: "Enter a price" })
      .refine((v) => v >= 0, { message: "Price cannot be negative" }),
    is_active: z.boolean().default(true),
    ...discountFields,
  })
  .superRefine(refineDiscount);

export type AiService = z.infer<typeof aiServiceSchema>;
export type AiServicesList = z.infer<typeof aiServicesListSchema>;
export type AiServicePricingFormValues = z.input<typeof aiServicePricingFormSchema>;

export function toAiServicePricingPayload(values: {
  report_unlock_price: number | string;
  is_active: boolean;
  discount_enabled: boolean;
  discount_type: "percentage" | "fixed";
  discount_value: number | string;
}) {
  return {
    // Money is a decimal string on the wire, like every other price field.
    report_unlock_price: String(Number(values.report_unlock_price) || 0),
    is_active: values.is_active,
    discount_enabled: values.discount_enabled,
    discount_type: values.discount_type,
    discount_value: String(Number(values.discount_value) || 0),
  };
}
