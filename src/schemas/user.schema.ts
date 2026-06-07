import { z } from 'zod';

export const userSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  is_active: z.boolean(),
});

export type UserFormData = z.infer<typeof userSchema>;
