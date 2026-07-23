import { z } from "zod";

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
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug can only contain lowercase letters, numbers, and single hyphens")
    .optional(),
  meta_title: z.string().max(70).optional().or(z.literal("")),
  meta_description: z.string().max(160).optional().or(z.literal("")),
  meta_keywords: z.string().max(255).optional().or(z.literal("")),
  og_image_key: z.string().optional().or(z.literal("")),
  is_indexable: z.boolean().default(true),
});

export const updateProductSchema = createProductSchema.partial();

export const productSchema = z.object({
  id: z.string(),
  name: z.string().nullable().optional().default(""),
  description: z.string().nullable().optional().default(""),
  sku: z.string().nullable().optional().default(""),
  price: z.union([z.number(), z.string()]).nullable().optional().transform((val) => val ? parseFloat(String(val)) : 0),
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
