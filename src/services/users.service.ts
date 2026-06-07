import {
  UsersListResponse,
  usersListResponseSchema,
  UsersListParams,
  User,
  CreateUserPayload,
  UpdateUserPayload,
  createUserSchema,
  updateUserSchema,
} from "@/schemas/users.schema";
import { ApiError } from "@/services/auth.service";
import { z } from "zod";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.divyasadhana.org/api";

const UserResponseSchema = z.object({
  message: z.string(),
  data: z.object({
    id: z.string(),
    email: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    is_active: z.boolean(),
    is_superuser: z.boolean().optional(),
  }),
});

export async function getUsersList(
  params: UsersListParams,
  accessToken: string
): Promise<UsersListResponse> {
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append("page", String(params.page));
  if (params.paginate) queryParams.append("paginate", String(params.paginate));
  if (params.search) queryParams.append("search", params.search);
  if (params.search_fields)
    queryParams.append("search_fields", params.search_fields);
  if (params.fields) queryParams.append("fields", params.fields);
  if (params.sort) queryParams.append("sort", params.sort);
  if (params.is_active !== undefined) queryParams.append("is_active", String(params.is_active));
  if (params.is_superuser !== undefined) queryParams.append("is_superuser", String(params.is_superuser));

  const url = `${API_BASE_URL}/users/?${queryParams.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const json = await response.json();

  if (!response.ok) {
    throw new ApiError(
      json?.message || "Failed to fetch users list",
      response.status
    );
  }

  return usersListResponseSchema.parse(json);
}

export async function getUser(
  id: string,
  accessToken: string
): Promise<User> {
  const url = `${API_BASE_URL}/users/${id}/`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const json = await response.json();

  if (!response.ok) {
    throw new ApiError(
      json?.message || "Failed to fetch user",
      response.status
    );
  }

  return UserResponseSchema.parse(json).data;
}

export async function createUser(
  payload: CreateUserPayload,
  accessToken: string
): Promise<User> {
  const parsedPayload = createUserSchema.parse(payload);

  const response = await fetch(`${API_BASE_URL}/users/`, {
    method: "POST",
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
      json?.message || "Failed to create user",
      response.status
    );
  }

  return UserResponseSchema.parse(json).data;
}

export async function updateUser(
  id: string,
  payload: UpdateUserPayload,
  accessToken: string
): Promise<User> {
  const parsedPayload = updateUserSchema.parse(payload);

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
      json?.message || "Failed to update user",
      response.status
    );
  }

  return UserResponseSchema.parse(json).data;
}

export async function deleteUser(
  id: string,
  accessToken: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/users/${id}/`, {
    method: "DELETE",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const json = await response.json();
    throw new ApiError(
      json?.message || "Failed to delete user",
      response.status
    );
  }
}
