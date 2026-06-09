import { z } from "zod";

export const loginPayloadSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const loginResponseSchema = z.object({
  message: z.string(),
  data: z.object({
    user: z.object({
      id: z.string(),
      first_name: z.string(),
      last_name: z.string(),
      email: z.string().email(),
      phone_number: z.string().nullable(),
      is_active: z.boolean(),
      is_superuser: z.boolean().optional(),
    }),
    tokens: z.object({
      access: z.object({
        token: z.string(),
        expires: z.number(),
      }),
      refresh: z.object({
        token: z.string(),
        expires: z.number(),
      }),
    }),
  }),
});

export const refreshTokenResponseSchema = z.object({
  message: z.string(),
  data: z.object({
    tokens: z.object({
      access: z.object({
        token: z.string(),
        expires: z.number(),
      }),
      refresh: z.object({
        token: z.string(),
        expires: z.number(),
      }),
    }),
  }),
});

export type LoginPayload = z.infer<typeof loginPayloadSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
export type RefreshTokenResponse = z.infer<typeof refreshTokenResponseSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
});

export const changePasswordSchema = z.object({
  old_password: z.string().min(1, "Old password is required"),
  new_password: z.string().min(8, "New password must be at least 8 characters long"),
  confirm_password: z.string().min(1, "Confirm password is required"),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

export type ForgotPasswordPayload = z.infer<typeof forgotPasswordSchema>;
export type ChangePasswordPayload = z.infer<typeof changePasswordSchema>;
