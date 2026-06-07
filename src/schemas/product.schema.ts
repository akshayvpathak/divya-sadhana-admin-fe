import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  price: z.coerce.number().nonnegative('Price cannot be negative').optional(),
  description: z.string().min(1, 'Product description is required'),
  categoryId: z.string().optional(),
  image: z.string().min(1, 'Product image is required'),
  sku: z.string().min(1, 'SKU is required'),
  stock_quantity: z.coerce.number().nonnegative('Stock quantity cannot be negative').optional(),
  is_active: z.boolean().default(true).optional(),
  is_published: z.boolean().default(false).optional(),
  gallery_image_keys: z.array(z.string()).min(1, 'At least one gallery image is required'),
});

export type ProductFormData = z.infer<typeof productSchema>;
