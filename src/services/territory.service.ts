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
import { apiErrorFrom } from "@/services/auth.service";

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

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };

  const response = await fetch(
    `${API_BASE_URL}/territory/states/?${params.toString()}`,
    { method: "GET", headers }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "" }));
    throw new Error(error.message || "Failed to fetch states");
  }

  const json = await response.json();
  const parsed = statesListSchema.parse(json);

  // The backend caps the page size at 10 and ignores `page_size`, so a single
  // request never returns every state (e.g. 36 states arrive 10 at a time).
  // When the caller wants the full list (no explicit page requested) — as the
  // state dropdowns do — follow `next` and aggregate so all states show.
  if (!options.page && parsed.data.next) {
    const all = [...parsed.data.results];
    let nextUrl: string | null | undefined = parsed.data.next;
    let guard = 0;
    while (nextUrl && guard < 50) {
      guard += 1;
      const res = await fetch(nextUrl, { method: "GET", headers });
      if (!res.ok) break;
      const pageParsed = statesListSchema.parse(await res.json());
      all.push(...pageParsed.data.results);
      nextUrl = pageParsed.data.next;
    }
    return { ...parsed, data: { ...parsed.data, results: all, next: null } };
  }

  return parsed;
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
    throw apiErrorFrom(json, "Failed to create assignment", response.status);
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
    throw apiErrorFrom(json, "Failed to update assignment", response.status);
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
