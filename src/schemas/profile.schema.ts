import { z } from "zod";

export const updateProfileSchema = z.object({
  first_name: z.string().min(1, "First name is required").optional(),
  last_name: z.string().min(1, "Last name is required").optional(),
  email: z.string().email("Please enter a valid email address").optional(),
});

export type UpdateProfilePayload = z.infer<typeof updateProfileSchema>;
