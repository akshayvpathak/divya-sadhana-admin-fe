import {
  CreateServiceBatchPayload,
  ServiceBatch,
  ServiceBatchesList,
  UpdateServiceBatchPayload,
  serviceBatchSchema,
  serviceBatchesListSchema,
} from "@/schemas/service-batches.schema";
import { ApiError, formatApiError } from "@/services/auth.service";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.divyasadhana.org/api";

interface FetchOptions {
  page?: number;
  paginate?: number;
  service?: string;
  search?: string;
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

export const getServiceBatchesList = async (
  accessToken: string,
  options: FetchOptions = {}
): Promise<ServiceBatchesList> => {
  const params = new URLSearchParams();
  if (options.page) params.append("page", String(options.page));
  if (options.paginate) params.append("paginate", String(options.paginate));
  if (options.service) params.append("service", options.service);
  if (options.search) params.append("search", options.search);
  if (options.ordering) params.append("ordering", options.ordering);

  const response = await fetch(`${API_BASE_URL}/service-batches/?${params.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "" }));
    throw new Error(error.message || "Failed to fetch service batches");
  }

  const json = await response.json();
  return serviceBatchesListSchema.parse(json);
};

export const getServiceBatch = async (id: string, accessToken: string): Promise<ServiceBatch> => {
  const response = await fetch(`${API_BASE_URL}/service-batches/${id}/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "" }));
    throw new Error(error.message || "Failed to fetch service batch");
  }

  const json = await response.json();
  return serviceBatchSchema.parse(json.data || json);
};

export const createServiceBatch = async (
  payload: CreateServiceBatchPayload,
  accessToken: string
): Promise<ServiceBatch> => {
  const response = await fetch(`${API_BASE_URL}/service-batches/`, {
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
    throw new ApiError(formatApiError(json, "Failed to create batch"), response.status);
  }

  const json = await response.json();
  return serviceBatchSchema.parse(json.data || json);
};

export const updateServiceBatch = async (
  id: string,
  payload: UpdateServiceBatchPayload,
  accessToken: string
): Promise<ServiceBatch> => {
  const response = await fetch(`${API_BASE_URL}/service-batches/${id}/`, {
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
    throw new ApiError(formatApiError(json, "Failed to update batch"), response.status);
  }

  const json = await response.json();
  return serviceBatchSchema.parse(json.data || json);
};

export const deleteServiceBatch = async (id: string, accessToken: string) => {
  const response = await fetch(`${API_BASE_URL}/service-batches/${id}/`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "X-CSRFTOKEN": getCsrfToken(),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "" }));
    throw new Error(error.message || "Failed to delete batch");
  }
};
