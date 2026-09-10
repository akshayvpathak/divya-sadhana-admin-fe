import { z } from "zod";
import { SLUG_PATTERN, SLUG_PATTERN_MESSAGE } from "@/lib/slug";
import { discountTypeEnum } from "@/schemas/discount.schema";

/** `Product.slug` is `maxLength: 160` in the API schema. */
export const PRODUCT_SLUG_MAX_LENGTH = 160;

export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().min(1, "Description is required"),
  sku: z.string().min(1, "SKU is required"),
  price: z
    .number()
    .positive("Price must be greater than 0"),
  stock_quantity: z
    .number()
    .int()
    .min(0, "Stock quantity cannot be negative"),
  is_active: z.boolean().default(true),
  is_published: z.boolean().default(false),
  primary_image_key: z.string().default(""),
  gallery_image_keys: z.array(z.string()).default([]),
  category: z.string().uuid("Valid category ID is required"),
  // Matched to the backend rule (`^[-a-zA-Z0-9_]+$`), not a stricter local one.
  slug: z
    .string()
    .max(PRODUCT_SLUG_MAX_LENGTH, `Slug must be ${PRODUCT_SLUG_MAX_LENGTH} characters or fewer`)
    .regex(SLUG_PATTERN, SLUG_PATTERN_MESSAGE)
    .optional(),
  meta_title: z.string().max(70).optional().or(z.literal("")),
  meta_description: z.string().max(160).optional().or(z.literal("")),
  meta_keywords: z.string().max(255).optional().or(z.literal("")),
  og_image_key: z.string().optional().or(z.literal("")),
  is_indexable: z.boolean().default(true),
});

export const updateProductSchema = createProductSchema.partial();

const moneyToNumber = (val: unknown) => {
  if (val === null || val === undefined || val === "") return 0;
  const n = parseFloat(String(val));
  return Number.isFinite(n) ? n : 0;
};

export const productOptionValueSchema = z.object({
  id: z.string(),
  label: z.string().nullable().optional().default(""),
  value: z.string().nullable().optional().default(""),
  position: z.number().nullable().optional(),
});

export const productOptionGroupSchema = z.object({
  id: z.string(),
  name: z.string().nullable().optional().default(""),
  code: z.string().nullable().optional().default(""),
  position: z.number().nullable().optional(),
  values: z.array(productOptionValueSchema).nullable().optional().default([]),
});

export const productVariantSchema = z.object({
  id: z.string(),
  sku: z.string().nullable().optional().default(""),
  price: z
    .union([z.number(), z.string()])
    .nullable()
    .optional()
    .transform(moneyToNumber),
  stock_quantity: z
    .number()
    .nullable()
    .optional()
    .transform((val) => val ?? 0),
  is_active: z
    .boolean()
    .nullable()
    .optional()
    .transform((val) => val ?? true),
  position: z.number().nullable().optional(),
  /** Write/docs shape */
  option_value_ids: z.array(z.string()).nullable().optional().default([]),
  /** Some responses use this name instead */
  option_values: z.array(z.string()).nullable().optional().default([]),
  options: z.record(z.string(), z.string()).nullable().optional(),
  image_url: z.string().nullable().optional(),
});

export const createOptionGroupSchema = z.object({
  name: z.string().min(1, "Group name is required"),
  code: z
    .string()
    .min(1, "Code is required")
    .regex(/^[a-z0-9_]+$/, "Code must be lowercase letters, numbers, or underscores"),
  position: z.number().int().min(0).optional(),
  values: z
    .array(
      z.object({
        label: z.string().min(1, "Label is required"),
        value: z.string().min(1, "Value is required"),
        position: z.number().int().min(0).optional(),
      })
    )
    .min(1, "Add at least one value"),
});

export const createVariantSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  price: z.union([z.number(), z.string()]),
  stock_quantity: z.number().int().min(0),
  is_active: z.boolean().default(true),
  position: z.number().int().min(0).optional(),
  option_value_ids: z.array(z.string()).min(1, "Select option values"),
});

export const updateVariantSchema = createVariantSchema.partial();

export const productSchema = z.object({
  id: z.string(),
  name: z.string().nullable().optional().default(""),
  description: z.string().nullable().optional().default(""),
  sku: z.string().nullable().optional().default(""),
  price: z
    .union([z.number(), z.string()])
    .nullable()
    .optional()
    .transform(moneyToNumber),
  stock_quantity: z.number().nullable().optional().transform((val) => val ?? 0),
  is_active: z.boolean().nullable().optional().transform((val) => val ?? true),
  is_published: z.boolean().nullable().optional().transform((val) => val ?? false),
  primary_image_key: z.string().nullable().optional().default(""),
  /** Read-only: signed URL from API; never send on create/PATCH */
  primary_image_url: z.string().nullable().optional(),
  gallery_image_keys: z.array(z.string()).nullable().optional().default([]),
  /** Read-only: signed URLs from API; never send on create/PATCH */
  gallery_image_urls: z.array(z.string()).nullable().optional().default([]),
  category: z.string().nullable().optional().default(""),
  slug: z.string().nullable().optional().default(""),
  meta_title: z.string().nullable().optional().default(""),
  meta_description: z.string().nullable().optional().default(""),
  meta_keywords: z.string().nullable().optional().default(""),
  og_image_key: z.string().nullable().optional().default(""),
  /** Read-only: signed URL from API; never send on create/PATCH */
  og_image_url: z.string().nullable().optional(),
  is_indexable: z.boolean().nullable().optional().transform((val) => val ?? true),
  discount_enabled: z.boolean().nullable().optional().transform((v) => v ?? false),
  discount_type: discountTypeEnum.nullable().optional().transform((v) => v ?? "percentage"),
  discount_value: z
    .union([z.number(), z.string()])
    .nullable()
    .optional()
    .transform(moneyToNumber),
  has_variants: z.boolean().nullable().optional().transform((val) => val ?? false),
  min_price: z
    .union([z.number(), z.string()])
    .nullable()
    .optional()
    .transform((val) => (val === null || val === undefined || val === "" ? null : moneyToNumber(val))),
  max_price: z
    .union([z.number(), z.string()])
    .nullable()
    .optional()
    .transform((val) => (val === null || val === undefined || val === "" ? null : moneyToNumber(val))),
  option_groups: z.array(productOptionGroupSchema).nullable().optional().default([]),
  variants: z.array(productVariantSchema).nullable().optional().default([]),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});

export const productsListSchema = z.object({
  message: z.string(),
  data: z.object({
    count: z.number(),
    next: z.string().nullable(),
    previous: z.string().nullable(),
    results: z.array(productSchema),
  }),
});

export type CreateProductPayload = z.infer<typeof createProductSchema>;
export type UpdateProductPayload = z.infer<typeof updateProductSchema>;
export type Product = z.infer<typeof productSchema>;
export type ProductsList = z.infer<typeof productsListSchema>;
export type ProductOptionGroup = z.infer<typeof productOptionGroupSchema>;
export type ProductOptionValue = z.infer<typeof productOptionValueSchema>;
export type ProductVariant = z.infer<typeof productVariantSchema>;
export type CreateOptionGroupPayload = z.infer<typeof createOptionGroupSchema>;
export type CreateVariantPayload = z.infer<typeof createVariantSchema>;
export type UpdateVariantPayload = z.infer<typeof updateVariantSchema>;
