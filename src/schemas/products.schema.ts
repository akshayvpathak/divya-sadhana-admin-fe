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
});

export const updateProductSchema = createProductSchema.partial();

export const productSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  sku: z.string(),
  price: z.union([z.number(), z.string()]).transform((val) => parseFloat(String(val))),
  stock_quantity: z.number(),
  is_active: z.boolean(),
  is_published: z.boolean(),
  primary_image_key: z.string(),
  primary_image_url: z.string().nullable().optional(),
  gallery_image_keys: z.array(z.string()),
  gallery_image_urls: z.array(z.string()).optional(),
  category: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
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
