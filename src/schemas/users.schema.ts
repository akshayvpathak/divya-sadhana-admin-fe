import { z } from "zod";

const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  is_active: z.boolean(),
  is_superuser: z.boolean().optional(),
});

export const usersListResponseSchema = z.object({
  message: z.string(),
  data: z.object({
    count: z.number(),
    next: z.string().nullable(),
    previous: z.string().nullable(),
    results: z.array(UserSchema),
  }),
});

export const createUserSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  is_active: z.boolean().default(true),
});

export const updateUserSchema = z.object({
  first_name: z.string().min(1, "First name is required").optional(),
  last_name: z.string().min(1, "Last name is required").optional(),
  email: z.string().email("Please enter a valid email address").optional(),
  is_active: z.boolean().optional(),
});

export type User = z.infer<typeof UserSchema>;
export type UsersListResponse = z.infer<typeof usersListResponseSchema>;
export type CreateUserPayload = z.infer<typeof createUserSchema>;
export type UpdateUserPayload = z.infer<typeof updateUserSchema>;

export interface UsersListParams {
  page?: number;
  paginate?: number;
  search?: string;
  search_fields?: string;
  fields?: string;
  sort?: string;
  is_active?: boolean;
  is_superuser?: boolean;
}
