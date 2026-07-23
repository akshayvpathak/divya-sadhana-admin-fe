import {
  TrusteesList,
  trusteesListSchema,
  Trustee,
  trusteeSchema,
  PromoteTrusteePayload,
  PromoteTrusteeWithTerritoryPayload,
  PromoteTrusteeWithTerritoryResult,
  promoteTrusteeWithTerritoryResponseSchema,
  TrusteeDashboard,
  trusteeDashboardSchema,
  CommissionsList,
  commissionsListSchema,
} from "@/schemas/trustees.schema";
import { ApiError, formatApiError, apiErrorFrom } from "@/services/auth.service";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.divyasadhana.org/api";

function getCsrfToken(): string {
  return (
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("csrftoken="))
      ?.split("=")[1] || ""
  );
}

interface TrusteesListOptions {
  page?: number;
  page_size?: number;
  search?: string;
  is_active?: string;
  sort?: string;
  /** Server-side filter: trustees assigned to this state (UUID). */
  state_id?: string;
}

export const getTrusteesList = async (
  accessToken: string,
  options: TrusteesListOptions = {}
): Promise<TrusteesList> => {
  const params = new URLSearchParams();
  if (options.page) params.append("page", String(options.page));
  if (options.page_size) params.append("page_size", String(options.page_size));
  if (options.search) params.append("search", options.search);
  if (options.is_active) params.append("is_active", options.is_active);
  if (options.sort) params.append("sort", options.sort);
  if (options.state_id) params.append("state_id", options.state_id);

  const response = await fetch(`${API_BASE_URL}/trustee/?${params.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "" }));
    throw new Error(error.message || "Failed to fetch trustees");
  }

  const json = await response.json();
  return trusteesListSchema.parse(json);
};

export const promoteTrustee = async (
  payload: PromoteTrusteePayload,
  accessToken: string
): Promise<Trustee> => {
  const response = await fetch(`${API_BASE_URL}/trustee/`, {
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
    throw apiErrorFrom(json, "Failed to promote trustee", response.status);
  }

  const json = await response.json();
  return trusteeSchema.parse(json.data || json);
};

/**
 * Atomic promote + territory assignment. POST /api/trustee/promote-with-territory/.
 * All-or-nothing: the trustee and every state assignment are created together,
 * so there is no best-effort follow-up call to reconcile.
 */
export const promoteTrusteeWithTerritory = async (
  payload: PromoteTrusteeWithTerritoryPayload,
  accessToken: string
): Promise<PromoteTrusteeWithTerritoryResult> => {
  const response = await fetch(
    `${API_BASE_URL}/trustee/promote-with-territory/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-CSRFTOKEN": getCsrfToken(),
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    throw apiErrorFrom(json, "Failed to promote trustee", response.status);
  }

  const json = await response.json();
  return promoteTrusteeWithTerritoryResponseSchema.parse(json).data;
};

export interface UpdateTrusteePayload {
  commission_percent?: string;
  is_active?: boolean;
  state?: string;
  district?: string;
  notes?: string;
}

export const updateTrustee = async (
  id: string,
  payload: UpdateTrusteePayload,
  accessToken: string
): Promise<Trustee> => {
  const response = await fetch(`${API_BASE_URL}/trustee/${id}/`, {
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
    throw apiErrorFrom(json, "Failed to update trustee", response.status);
  }

  const json = await response.json();
  return trusteeSchema.parse(json.data || json);
};

export const deleteTrustee = async (id: string, accessToken: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/trustee/${id}/`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "X-CSRFTOKEN": getCsrfToken(),
    },
  });

  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    throw new ApiError(formatApiError(json, "Failed to delete trustee"), response.status);
  }
};

export const getTrusteeDashboard = async (
  id: string,
  accessToken: string
): Promise<TrusteeDashboard> => {
  const response = await fetch(`${API_BASE_URL}/trustee/${id}/dashboard/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "" }));
    throw new Error(error.message || "Failed to fetch trustee dashboard");
  }

  const json = await response.json();
  return trusteeDashboardSchema.parse(json).data;
};

interface CommissionsOptions {
  status?: string;
  kind?: string;
  page?: number;
  page_size?: number;
}

export const getTrusteeCommissions = async (
  id: string,
  accessToken: string,
  options: CommissionsOptions = {}
): Promise<CommissionsList> => {
  const params = new URLSearchParams();
  if (options.status) params.append("status", options.status);
  if (options.kind) params.append("kind", options.kind);
  if (options.page) params.append("page", String(options.page));
  if (options.page_size) params.append("page_size", String(options.page_size));

  const response = await fetch(
    `${API_BASE_URL}/trustee/${id}/commissions/?${params.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "" }));
    throw new Error(error.message || "Failed to fetch commissions");
  }

  const json = await response.json();
  return commissionsListSchema.parse(json);
};
