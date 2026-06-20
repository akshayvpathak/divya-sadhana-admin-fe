import {
  AssignmentsList,
  assignmentsListSchema,
  StatesList,
  statesListSchema,
  assignmentSchema,
  Assignment,
  CreateAssignmentPayload,
  UpdateAssignmentPayload,
} from "@/schemas/territory.schema";
import { ApiError, formatApiError } from "@/services/auth.service";

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

/* ----------------------------- States ----------------------------- */

interface StatesListOptions {
  page?: number;
  page_size?: number;
  search?: string;
  is_active?: string;
  sort?: string;
}

export const getStatesList = async (
  accessToken: string,
  options: StatesListOptions = {}
): Promise<StatesList> => {
  const params = new URLSearchParams();
  if (options.page) params.append("page", String(options.page));
  if (options.page_size) params.append("page_size", String(options.page_size));
  if (options.search) params.append("search", options.search);
  if (options.is_active) params.append("is_active", options.is_active);
  if (options.sort) params.append("sort", options.sort);

  const response = await fetch(
    `${API_BASE_URL}/territory/states/?${params.toString()}`,
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
    throw new Error(error.message || "Failed to fetch states");
  }

  const json = await response.json();
  return statesListSchema.parse(json);
};

/* -------------------------- Assignments --------------------------- */

interface AssignmentsListOptions {
  page?: number;
  page_size?: number;
  search?: string;
  state?: string;
  trustee?: string;
  is_active?: string;
  sort?: string;
}

export const getAssignmentsList = async (
  accessToken: string,
  options: AssignmentsListOptions = {}
): Promise<AssignmentsList> => {
  const params = new URLSearchParams();
  if (options.page) params.append("page", String(options.page));
  if (options.page_size) params.append("page_size", String(options.page_size));
  if (options.search) params.append("search", options.search);
  if (options.state) params.append("state", options.state);
  if (options.trustee) params.append("trustee", options.trustee);
  if (options.is_active) params.append("is_active", options.is_active);
  if (options.sort) params.append("sort", options.sort);

  const response = await fetch(
    `${API_BASE_URL}/territory/assignments/?${params.toString()}`,
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
    throw new Error(error.message || "Failed to fetch assignments");
  }

  const json = await response.json();
  return assignmentsListSchema.parse(json);
};

export const createAssignment = async (
  payload: CreateAssignmentPayload,
  accessToken: string
): Promise<Assignment> => {
  const response = await fetch(`${API_BASE_URL}/territory/assignments/`, {
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
    throw new ApiError(
      formatApiError(json, "Failed to create assignment"),
      response.status
    );
  }

  const json = await response.json();
  return assignmentSchema.parse(json.data || json);
};

export const updateAssignment = async (
  id: string,
  payload: UpdateAssignmentPayload,
  accessToken: string
): Promise<Assignment> => {
  const response = await fetch(`${API_BASE_URL}/territory/assignments/${id}/`, {
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
    throw new ApiError(
      formatApiError(json, "Failed to update assignment"),
      response.status
    );
  }

  const json = await response.json();
  return assignmentSchema.parse(json.data || json);
};

export const deleteAssignment = async (id: string, accessToken: string) => {
  const response = await fetch(`${API_BASE_URL}/territory/assignments/${id}/`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "X-CSRFTOKEN": getCsrfToken(),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "" }));
    throw new Error(error.message || "Failed to delete assignment");
  }
};
