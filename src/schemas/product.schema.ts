import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  price: z.coerce.number().nonnegative('Price cannot be negative').optional(),
  description: z.string().min(1, 'Product description is required'),
  categoryId: z.string().optional(),
  // S3/R2 object key (maps to API primary_image_key); not a display URL
  image: z.string().min(1, 'Product image is required'),
  sku: z.string().min(1, 'SKU is required'),
  stock_quantity: z.coerce.number().nonnegative('Stock quantity cannot be negative').optional(),
  is_active: z.boolean().default(true).optional(),
  is_published: z.boolean().default(false).optional(),
  gallery_image_keys: z.array(z.string()).min(1, 'At least one gallery image is required'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug can only contain lowercase letters, numbers, and single hyphens'),
  meta_title: z.string().max(70, 'Meta title must be 70 characters or less').optional().or(z.literal('')),
  meta_description: z.string().max(160, 'Meta description must be 160 characters or less').optional().or(z.literal('')),
  meta_keywords: z.string().max(255, 'Meta keywords must be 255 characters or less').optional().or(z.literal('')),
  og_image_key: z.string().optional().or(z.literal('')),
  is_indexable: z.boolean().default(true).optional(),
});

export type ProductFormData = z.infer<typeof productSchema>;
