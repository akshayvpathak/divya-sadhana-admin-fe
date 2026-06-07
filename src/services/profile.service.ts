import { UpdateProfilePayload, updateProfileSchema } from "@/schemas/profile.schema";
import { ApiError, formatApiError } from "@/services/auth.service";
import { z } from "zod";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.divyasadhana.org/api";

const ProfileResponseSchema = z.object({
  message: z.string(),
  data: z.object({
    id: z.string(),
    email: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    is_active: z.boolean(),
    is_superuser: z.boolean().optional(),
    phone_number: z.string().nullable().optional(),
  }),
});

export type ProfileUser = z.infer<typeof ProfileResponseSchema>["data"];

export async function updateProfile(
  id: string,
  payload: UpdateProfilePayload,
  accessToken: string
): Promise<ProfileUser> {
  const parsedPayload = updateProfileSchema.parse(payload);

  const response = await fetch(`${API_BASE_URL}/users/${id}/`, {
    method: "PATCH",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(parsedPayload),
  });

  const json = await response.json();

  if (!response.ok) {
    throw new ApiError(
      formatApiError(json, "Failed to update profile"),
      response.status
    );
  }

  return ProfileResponseSchema.parse(json).data;
}
