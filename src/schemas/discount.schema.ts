import { z } from "zod";

/**
 * Item and cart discount configuration — shared by products, books, sadhana services and the
 * general cart setting so the rules can never drift between screens.
 *
 * Mirrors the server-side rules in DISCOUNT_BACKEND_HANDOFF.md §13. The backend enforces these
 * independently; this exists so the admin sees the error on the field rather than in a toast.
 */

export const discountTypeEnum = z.enum(["percentage", "fixed"]);
export type DiscountType = z.infer<typeof discountTypeEnum>;

export const DISCOUNT_TYPE_LABEL: Record<DiscountType, string> = {
  percentage: "Percentage (%)",
  fixed: "Fixed amount (₹)",
};

const discountValue = z
  .union([z.number(), z.string()])
  .transform((value) => {
    if (value === "" || value === null || value === undefined) return 0;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : NaN;
  })
  .refine((value) => !Number.isNaN(value), { message: "Enter a number" })
  .refine((value) => value >= 0, { message: "Discount cannot be negative" });

/**
 * Spread into a form schema, e.g. `productSchema.extend({ ...discountFields })`.
 *
 * The percentage ceiling is checked in `refineDiscount` rather than here, because the rule
 * depends on `discount_type` — a cross-field check zod can only do on the whole object.
 */
export const discountFields = {
  discount_enabled: z.boolean().default(false),
  discount_type: discountTypeEnum.default("percentage"),
  discount_value: discountValue.default(0),
};

export const discountFieldsSchema = z.object(discountFields);
export type DiscountFieldValues = z.infer<typeof discountFieldsSchema>;

export const emptyDiscount: DiscountFieldValues = {
  discount_enabled: false,
  discount_type: "percentage",
  discount_value: 0,
};

/**
 * Cross-field rule: a percentage above 100 is nonsense. Chain onto any schema carrying the
 * discount fields — `productSchema.extend({...discountFields}).superRefine(refineDiscount)`.
 *
 * Deliberately NOT checked here: a fixed value larger than the price. A price can change after
 * the discount is set, so blocking the save would strand the admin; the backend clamps it at
 * calculation time (handoff §8) and `DiscountFields` warns inline instead.
 */
export function refineDiscount(
  values: { discount_enabled?: boolean; discount_type?: DiscountType; discount_value?: number },
  ctx: z.RefinementCtx,
): void {
  if (!values.discount_enabled) return;
  if (values.discount_type === "percentage" && Number(values.discount_value) > 100) {
    ctx.addIssue({
      code: "custom",
      path: ["discount_value"],
      message: "A percentage cannot exceed 100",
    });
  }
}

/** Rupees off one unit, clamped to the base price. Matches the backend formula in §8. */
export function discountAmount(
  basePrice: number,
  values: Partial<DiscountFieldValues> | null | undefined,
): number {
  if (!values?.discount_enabled) return 0;
  if (!Number.isFinite(basePrice) || basePrice <= 0) return 0;

  const value = Number(values.discount_value);
  if (!Number.isFinite(value) || value <= 0) return 0;

  if (values.discount_type === "fixed") return Math.min(value, basePrice);
  return Math.min(basePrice, Math.round(((basePrice * value) / 100) * 100) / 100);
}

/** Base price minus the discount; never negative. */
export function applyDiscount(
  basePrice: number,
  values: Partial<DiscountFieldValues> | null | undefined,
): number {
  return Math.max(0, basePrice - discountAmount(basePrice, values));
}
