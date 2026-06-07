import { z } from 'zod';

export const categorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  isActive: z.boolean(),
});

export type CategoryFormData = z.infer<typeof categorySchema>;
