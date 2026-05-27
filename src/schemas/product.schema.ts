import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  price: z.coerce.number().min(0, 'Price must be a positive number'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  categoryId: z.string().min(1, 'Category is required'),
  image: z.string().optional().or(z.literal('')),
  sku: z.string().min(1, 'SKU is required'),
  stock_quantity: z.coerce.number().min(0, 'Stock must be 0 or more'),
  is_active: z.boolean().default(true),
  is_published: z.boolean().default(false),
});

export type ProductFormData = z.infer<typeof productSchema>;
