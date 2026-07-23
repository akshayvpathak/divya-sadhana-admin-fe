import {
  ServiceBooking,
  ServiceBookingsList,
  UpdateServiceBookingPayload,
  serviceBookingSchema,
  serviceBookingsListSchema,
} from "@/schemas/service-bookings.schema";
import { ApiError, formatApiError } from "@/services/auth.service";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.divyasadhana.org/api";

interface FetchOptions {
  page?: number;
  paginate?: number;
  status?: string;
  service__slug?: string;
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

export const getServiceBookingsList = async (
  accessToken: string,
  options: FetchOptions = {}
): Promise<ServiceBookingsList> => {
  const params = new URLSearchParams();
  if (options.page) params.append("page", String(options.page));
  if (options.paginate) params.append("paginate", String(options.paginate));
  if (options.status) params.append("status", options.status);
  if (options.service__slug) params.append("service__slug", options.service__slug);
  if (options.search) params.append("search", options.search);
  if (options.ordering) params.append("ordering", options.ordering);

  const response = await fetch(`${API_BASE_URL}/service-bookings/?${params.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "" }));
    throw new Error(error.message || "Failed to fetch service bookings");
  }

  const json = await response.json();
  return serviceBookingsListSchema.parse(json);
};

export const getServiceBooking = async (
  id: string,
  accessToken: string
): Promise<ServiceBooking> => {
  const response = await fetch(`${API_BASE_URL}/service-bookings/${id}/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "" }));
    throw new Error(error.message || "Failed to fetch service booking");
  }

  const json = await response.json();
  return serviceBookingSchema.parse(json.data || json);
};

export const updateServiceBooking = async (
  id: string,
  payload: UpdateServiceBookingPayload,
  accessToken: string
): Promise<ServiceBooking> => {
  const response = await fetch(`${API_BASE_URL}/service-bookings/${id}/`, {
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
    throw new ApiError(formatApiError(json, "Failed to update booking"), response.status);
  }

  const json = await response.json();
  return serviceBookingSchema.parse(json.data || json);
};
