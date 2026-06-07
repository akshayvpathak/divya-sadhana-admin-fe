import { z } from "zod";

const ProductCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  is_active: z.boolean(),
  is_deleted: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const categoriesListResponseSchema = z.object({
  message: z.string(),
  data: z.object({
    count: z.number(),
    next: z.string().nullable(),
    previous: z.string().nullable(),
    results: z.array(ProductCategorySchema),
  }),
});

export const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().min(1, "Description is required"),
  is_active: z.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();

export type ProductCategory = z.infer<typeof ProductCategorySchema>;
export type CategoriesListResponse = z.infer<typeof categoriesListResponseSchema>;
export type CreateCategoryPayload = z.infer<typeof createCategorySchema>;
export type UpdateCategoryPayload = z.infer<typeof updateCategorySchema>;

export interface CategoriesListParams {
  page?: number;
  paginate?: number;
  search?: string;
  search_fields?: string;
  fields?: string;
  sort?: string;
}
