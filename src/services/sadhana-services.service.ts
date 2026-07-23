import {
  CreateSadhanaServicePayload,
  SadhanaService,
  SadhanaServicesList,
  UpdateSadhanaServicePayload,
  sadhanaServiceSchema,
  sadhanaServicesListSchema,
} from "@/schemas/sadhana-services.schema";
import { ApiError, formatApiError } from "@/services/auth.service";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.divyasadhana.org/api";

interface FetchOptions {
  page?: number;
  paginate?: number;
  search?: string;
  category?: string;
  is_active?: string;
  ordering?: string;
}

function getCsrfToken(): string {
  return (
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("csrftoken="))
      ?.split("=")[1] || ""
  );
}

export const getSadhanaServicesList = async (
  accessToken: string,
  options: FetchOptions = {}
): Promise<SadhanaServicesList> => {
  const params = new URLSearchParams();
  if (options.page) params.append("page", String(options.page));
  if (options.paginate) params.append("paginate", String(options.paginate));
  if (options.search) params.append("search", options.search);
  if (options.category) params.append("category", options.category);
  if (options.is_active) params.append("is_active", options.is_active);
  if (options.ordering) params.append("ordering", options.ordering);

  const response = await fetch(`${API_BASE_URL}/sadhana-services/?${params.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "" }));
    throw new Error(error.message || "Failed to fetch sadhana services");
  }

  const json = await response.json();
  return sadhanaServicesListSchema.parse(json);
};

export const getSadhanaService = async (
  id: string,
  accessToken: string
): Promise<SadhanaService> => {
  const response = await fetch(`${API_BASE_URL}/sadhana-services/${id}/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "" }));
    throw new Error(error.message || "Failed to fetch sadhana service");
  }

  const json = await response.json();
  return sadhanaServiceSchema.parse(json.data || json);
};

export const createSadhanaService = async (
  payload: CreateSadhanaServicePayload,
  accessToken: string
): Promise<SadhanaService> => {
  const response = await fetch(`${API_BASE_URL}/sadhana-services/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "X-CSRFTOKEN": getCsrfToken(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    throw new ApiError(formatApiError(json, "Failed to create sadhana service"), response.status);
  }

  const json = await response.json();
  return sadhanaServiceSchema.parse(json.data || json);
};

export const updateSadhanaService = async (
  id: string,
  payload: UpdateSadhanaServicePayload,
  accessToken: string
): Promise<SadhanaService> => {
  const response = await fetch(`${API_BASE_URL}/sadhana-services/${id}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "X-CSRFTOKEN": getCsrfToken(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    throw new ApiError(formatApiError(json, "Failed to update sadhana service"), response.status);
  }

  const json = await response.json();
  return sadhanaServiceSchema.parse(json.data || json);
};

export const deleteSadhanaService = async (id: string, accessToken: string) => {
  const response = await fetch(`${API_BASE_URL}/sadhana-services/${id}/`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "X-CSRFTOKEN": getCsrfToken(),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "" }));
    throw new Error(error.message || "Failed to delete sadhana service");
  }
};
