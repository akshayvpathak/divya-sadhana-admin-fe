import { z } from "zod";
import { discountTypeEnum, refineDiscount } from "@/schemas/discount.schema";

/**
 * Global site configuration singleton.
 *
 * GET /api/site-config/    AllowAny   — public-safe keys only
 * PATCH /api/site-config/  superuser  — full record
 *
 * No id in the URL: it is a singleton, get-or-create on first read.
 */

const moneyToNumber = (val: unknown) => {
  if (val === null || val === undefined || val === "") return 0;
  const n = parseFloat(String(val));
  return Number.isFinite(n) ? n : 0;
};

export const siteConfigSchema = z
  .object({
    cart_discount_enabled: z.boolean().nullable().optional().transform((v) => v ?? false),
    cart_discount_type: discountTypeEnum.nullable().optional().transform((v) => v ?? "percentage"),
    cart_discount_value: z
      .union([z.number(), z.string()])
      .nullable()
      .optional()
      .transform(moneyToNumber),
    /** FE guide §11.1. 0 means no threshold, which is how every existing row migrated. */
    cart_discount_min_value: z
      .union([z.number(), z.string()])
      .nullable()
      .optional()
      .transform(moneyToNumber),
  })
  .passthrough();

export const siteConfigResponseSchema = z.object({
  message: z.string().optional(),
  data: siteConfigSchema,
});

/**
 * The form reuses the item-level field NAMES so `DiscountFields` can be dropped in unchanged;
 * `toSiteConfigPayload` renames them to the cart_* wire keys on the way out.
 */
export const cartDiscountFormSchema = z
  .object({
    discount_enabled: z.boolean().default(false),
    discount_type: discountTypeEnum.default("percentage"),
    discount_value: z
      .union([z.number(), z.string()])
      .transform((v) => {
        if (v === "" || v === null || v === undefined) return 0;
        const n = Number(v);
        return Number.isNaN(n) ? NaN : n;
      })
      .refine((v) => !Number.isNaN(v), { message: "Enter a number" })
      .refine((v) => v >= 0, { message: "Discount cannot be negative" })
      .default(0),
    /**
     * Minimum cart value before the discount applies — measured against the NET subtotal,
     * after item discounts (FE guide §11.4). 0 disables the threshold.
     *
     * Deliberately NOT cross-checked against `discount_value`: a ₹2,500 discount on a ₹1,000
     * minimum is unusual but legal, and it clamps to the subtotal when applied (§11.1).
     */
    discount_min_value: z
      .union([z.number(), z.string()])
      .transform((v) => {
        if (v === "" || v === null || v === undefined) return 0;
        const n = Number(v);
        return Number.isNaN(n) ? NaN : n;
      })
      .refine((v) => !Number.isNaN(v), { message: "Enter a number" })
      .refine((v) => v >= 0, { message: "Minimum cart value cannot be negative" })
      .default(0),
  })
  .superRefine(refineDiscount);

export type CartDiscountFormValues = z.input<typeof cartDiscountFormSchema>;
export type SiteConfig = z.infer<typeof siteConfigSchema>;

export function toSiteConfigPayload(values: {
  discount_enabled: boolean;
  discount_type: "percentage" | "fixed";
  discount_value: number | string;
  discount_min_value?: number | string;
}) {
  return {
    cart_discount_enabled: values.discount_enabled,
    cart_discount_type: values.discount_type,
    // Decimal string, matching every other money field on the wire.
    cart_discount_value: String(Number(values.discount_value) || 0),
    cart_discount_min_value: String(Number(values.discount_min_value) || 0),
  };
}
