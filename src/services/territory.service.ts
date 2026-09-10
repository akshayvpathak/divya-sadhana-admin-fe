import {
  AssignmentsList,
  assignmentsListSchema,
  StatesList,
  statesListSchema,
  assignmentSchema,
  Assignment,
  CreateAssignmentPayload,
  UpdateAssignmentPayload,
  District,
  districtSchema,
  districtsListSchema,
  CoverageList,
  coverageListSchema,
  CoverageDetail,
  coverageDetailSchema,
  RetentionSummary,
  retentionSummarySchema,
  RetentionEntries,
  retentionEntriesSchema,
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
  // Wire name is `paginate`. `page_size` is DRF's default, which this API does
  // not use — it was silently ignored until it became a 422 on 2026-09-11.
  if (options.page_size) params.append("paginate", String(options.page_size));
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

  // Callers that want every state (the dropdowns) do not pass a page, and the
  // default page is 10, so 36 states would arrive 10 at a time. Follow `next`
  // and aggregate so the whole list shows.
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
  /** @deprecated v2 uses `member` — trustee filter is ignored/unreliable on current API */
  trustee?: string;
  /** Network member / trustee id (v2). */
  member?: string;
  is_active?: string;
  sort?: string;
}

export const getAssignmentsList = async (
  accessToken: string,
  options: AssignmentsListOptions = {}
): Promise<AssignmentsList> => {
  const params = new URLSearchParams();
  if (options.page) params.append("page", String(options.page));
  if (options.page_size) params.append("paginate", String(options.page_size));
  if (options.search) params.append("search", options.search);
  if (options.state) params.append("state", options.state);
  // Prefer `member` — `trustee=` currently returns unfiltered rows on the live API.
  if (options.member) params.append("member", options.member);
  else if (options.trustee) params.append("member", options.trustee);
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


/* ---------------------------- Districts --------------------------- */

export type DistrictsPage = {
  results: District[];
  next: string | null;
  count: number;
  page: number;
};

function normalizeDistrictRows(rows: District[]): District[] {
  return rows.filter((d) => d.is_active !== false);
}

/** One page of districts for a state. */
export const getDistrictsPage = async (
  accessToken: string,
  stateId: string,
  page = 1,
  pageSize = 50
): Promise<DistrictsPage> => {
  if (!stateId) return { results: [], next: null, count: 0, page };
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };
  const params = new URLSearchParams({
    state_id: stateId,
    page: String(page),
    paginate: String(pageSize),
  });
  const response = await fetch(
    `${API_BASE_URL}/territory/districts/?${params.toString()}`,
    { method: "GET", headers }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "" }));
    throw new Error(error.message || "Failed to fetch districts");
  }

  const json = await response.json();
  const parsed = districtsListSchema.parse(json);
  const data = parsed.data;

  if (Array.isArray(data)) {
    return {
      results: normalizeDistrictRows(data),
      next: null,
      count: data.length,
      page,
    };
  }
  if (data && typeof data === "object" && "results" in data) {
    return {
      results: normalizeDistrictRows(data.results ?? []),
      next: data.next ?? null,
      count: data.count ?? (data.results?.length ?? 0),
      page,
    };
  }
  const top = json as {
    results?: unknown;
    next?: string | null;
    count?: number;
  };
  if (Array.isArray(top.results)) {
    const results = normalizeDistrictRows(
      top.results.map((r) => districtSchema.parse(r))
    );
    return {
      results,
      next: top.next ?? null,
      count: top.count ?? results.length,
      page,
    };
  }
  return { results: [], next: null, count: 0, page };
};

/** District list for a state — one request, up to 50 rows (`paginate=50`). */
export const getDistrictsList = async (
  accessToken: string,
  stateId: string
): Promise<District[]> => {
  if (!stateId) return [];
  const chunk = await getDistrictsPage(accessToken, stateId, 1, 50);
  return chunk.results;
};

/* ----------------------------- Coverage --------------------------- */

export const getTerritoryCoverageList = async (
  accessToken: string
): Promise<CoverageList> => {
  const response = await fetch(`${API_BASE_URL}/admin/territory/coverage/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "" }));
    throw new Error(error.message || "Failed to fetch territory coverage");
  }

  const json = await response.json();
  // Accept either { data: { results } } or { results } at top level
  if (json?.data?.results) return coverageListSchema.parse(json);
  if (Array.isArray(json?.results)) {
    return coverageListSchema.parse({ data: { results: json.results, count: json.count } });
  }
  if (Array.isArray(json?.data)) {
    return coverageListSchema.parse({ data: { results: json.data, count: json.data.length } });
  }
  return coverageListSchema.parse(json);
};

export const getTerritoryCoverageDetail = async (
  accessToken: string,
  stateId: string
): Promise<CoverageDetail> => {
  const params = new URLSearchParams({ state_id: stateId, detail: "1" });
  const response = await fetch(
    `${API_BASE_URL}/admin/territory/coverage/?${params.toString()}`,
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
    throw new Error(error.message || "Failed to fetch coverage detail");
  }

  const json = await response.json();
  if (json?.data) return coverageDetailSchema.parse(json).data;
  return coverageDetailSchema.parse({ data: json }).data;
};

/* ----------------------------- Retention -------------------------- */

export const RETENTION_ENTRIES_PAGE_SIZE = 25;

export interface RetentionFilters {
  date_from?: string;
  date_to?: string;
  state_id?: string;
  district_id?: string;
  source_kind?: string;
  view?: "summary" | "entries";
  /** Entries only. Never sent on the summary request. */
  page?: number;
  page_size?: number;
  retention_reason?: string;
}

export const getCommissionRetentionSummary = async (
  accessToken: string,
  filters: RetentionFilters = {}
): Promise<RetentionSummary> => {
  const params = new URLSearchParams();
  params.set("view", "summary");
  if (filters.date_from) params.set("date_from", filters.date_from);
  if (filters.date_to) params.set("date_to", filters.date_to);
  if (filters.state_id) params.set("state_id", filters.state_id);
  if (filters.district_id) params.set("district_id", filters.district_id);
  if (filters.source_kind) params.set("source_kind", filters.source_kind);

  const response = await fetch(
    `${API_BASE_URL}/admin/commission/retention/?${params.toString()}`,
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
    throw new Error(error.message || "Failed to fetch retention summary");
  }

  const json = await response.json();
  if (json?.data) return retentionSummarySchema.parse(json).data;
  return retentionSummarySchema.parse({ data: json }).data;
};

export const getCommissionRetentionEntries = async (
  accessToken: string,
  filters: RetentionFilters = {}
): Promise<RetentionEntries> => {
  const params = new URLSearchParams();
  params.set("view", "entries");
  if (filters.date_from) params.set("date_from", filters.date_from);
  if (filters.date_to) params.set("date_to", filters.date_to);
  if (filters.state_id) params.set("state_id", filters.state_id);
  if (filters.district_id) params.set("district_id", filters.district_id);
  if (filters.source_kind) params.set("source_kind", filters.source_kind);
  params.set("page", String(filters.page ?? 1));
  // `page_size` is correct *here* and nowhere else. The retention report paginates
  // itself rather than going through `filter_model`, so it genuinely reads
  // `page_size` (and echoes it back); `paginate` is ignored. Everywhere else the
  // API uses `paginate`, and `page_size` was silently dropped until it started
  // returning 422 on 2026-09-11.
  params.set("page_size", String(filters.page_size ?? RETENTION_ENTRIES_PAGE_SIZE));
  if (filters.retention_reason) params.set("retention_reason", filters.retention_reason);

  const response = await fetch(
    `${API_BASE_URL}/admin/commission/retention/?${params.toString()}`,
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
    throw new Error(error.message || "Failed to fetch retention entries");
  }

  const json = await response.json();
  if (json?.data?.results) return retentionEntriesSchema.parse(json);
  if (Array.isArray(json?.results)) {
    return retentionEntriesSchema.parse({
      data: {
        results: json.results,
        count: json.count,
        page: json.page,
        page_size: json.page_size,
        total_pages: json.total_pages,
        has_next: json.has_next,
        has_previous: json.has_previous,
      },
    });
  }
  return retentionEntriesSchema.parse(json);
};
