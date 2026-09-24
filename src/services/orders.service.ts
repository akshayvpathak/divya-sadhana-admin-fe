import { OrdersList, ordersListSchema, Order, UpdateOrderShippingPayload } from "@/schemas/orders.schema";
import { ApiError, formatApiError } from "@/services/auth.service";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.divyasadhana.org/api";

interface FetchOptions {
  page?: number;
  page_size?: number;
  search?: string;
  search_fields?: string;
  sort?: string;
  payment_status?: string;
  status?: string;
  shipping_status?: string;
  /**
   * Inclusive calendar-day bounds, `YYYY-MM-DD`. Both endpoints below mean the
   * same thing by them but spell them differently on the wire — see the notes
   * in `getOrdersList` and `exportOrdersCsv`.
   */
  start_date?: string;
  end_date?: string;
}

/** Filters the list and the CSV export both understand, spelled identically. */
function appendSharedFilters(params: URLSearchParams, options: FetchOptions) {
  if (options.search) params.append("search", options.search);
  if (options.search_fields) params.append("search_fields", options.search_fields);
  if (options.payment_status) params.append("payment_status", options.payment_status);
  if (options.status) params.append("status", options.status);
  if (options.shipping_status) params.append("shipping_status", options.shipping_status);
}

function getCsrfToken(): string {
  return (
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("csrftoken="))
      ?.split("=")[1] || ""
  );
}

export const getOrdersList = async (
  accessToken: string,
  options: FetchOptions = {}
): Promise<OrdersList> => {
  const params = new URLSearchParams();
  if (options.page) params.append("page", String(options.page));
  // Wire name is `paginate`. `page_size` is DRF's default, which this API does
  // not use — it was silently ignored until it became a 422 on 2026-09-11.
  if (options.page_size) params.append("paginate", String(options.page_size));
  appendSharedFilters(params, options);
  if (options.sort) params.append("sort", options.sort);
  // This endpoint takes Django lookups for the date range, and rejects anything
  // it does not recognise with a 422 — `start_date`/`end_date` (what the export
  // wants) are a hard error here. `__date__` compares calendar days, so both
  // bounds stay inclusive; a bare `created_at__lte` would read as midnight and
  // silently drop the end day's orders.
  if (options.start_date) params.append("created_at__date__gte", options.start_date);
  if (options.end_date) params.append("created_at__date__lte", options.end_date);

  const response = await fetch(`${API_BASE_URL}/orders/?${params.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "" }));
    throw new Error(error.message || "Failed to fetch orders");
  }

  const json = await response.json();
  return ordersListSchema.parse(json);
};

export const getOrder = async (id: string, accessToken: string): Promise<Order> => {
  const url = `${API_BASE_URL}/orders/${id}/`;
  if (process.env.NEXT_PUBLIC_DEBUG_API === "true") {
    // Print URL and a redacted auth indicator for local debugging only
    // DO NOT enable in production or print actual tokens
    // eslint-disable-next-line no-console
    console.log("[API DEBUG] GET", url, {
      Authorization: accessToken ? "Bearer [REDACTED]" : "(no token)",
    });
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "" }));
    throw new Error(error.message || "Failed to fetch order");
  }

  const json = await response.json();
  return (json.data || json) as Order;
};


export const updateOrderShipping = async (
  id: string,
  payload: UpdateOrderShippingPayload,
  accessToken: string
): Promise<Order> => {
  const response = await fetch(`${API_BASE_URL}/orders/${id}/`, {
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
    throw new ApiError(formatApiError(json, "Failed to update order shipping"), response.status);
  }

  const json = await response.json();
  return (json.data || json) as Order;
};


export type AdminOrderTracking = {
  order_number?: string | null;
  shipping_status: string;
  shipping_status_label: string;
  is_dispatched: boolean;
  is_delivered: boolean;
  courier: {
    code: string | null;
    name: string;
    tracking_page_url: string | null;
    tracking_mode: string;
    instructions: string;
    sms_tracking_hint: string;
  } | null;
  tracking_number: string | null;
  tracking_url: string | null;
  dispatched_at: string | null;
  delivered_at: string | null;
  estimated_delivery: { min_date: string | null; max_date: string | null; text: string } | null;
  timeline: { key: string; label: string; at: string | null; done: boolean }[];
  message?: string | null;
};

export const getOrderTracking = async (
  id: string,
  accessToken: string
): Promise<AdminOrderTracking> => {
  const response = await fetch(`${API_BASE_URL}/orders/${id}/tracking/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    throw new ApiError(formatApiError(json, "Failed to fetch tracking"), response.status);
  }

  const json = await response.json();
  return (json.data || json) as AdminOrderTracking;
};

export type ShippingInfo = {
  delivery_days_min: number | null;
  delivery_days_max: number | null;
  delivery_estimate_text: string;
  delivery_estimate_short: string;
  measured_from: string | null;
  carriers: { code: string; name: string }[];
};

export const getShippingInfo = async (accessToken?: string): Promise<ShippingInfo> => {
  const headers: Record<string, string> = { accept: "application/json" };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const response = await fetch(`${API_BASE_URL}/shipping/info`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    throw new Error(json.message || "Failed to fetch shipping info");
  }

  const json = await response.json();
  return (json.data || json) as ShippingInfo;
};

/**
 * Download orders CSV from GET /api/admin/exports/orders.csv, narrowed to the
 * filters the user is looking at.
 *
 * Two things about this endpoint differ from the list endpoint above:
 *   - The date range is `start_date`/`end_date` here. The `created_at__date__*`
 *     lookups the list takes are accepted and then silently ignored, so getting
 *     this wrong exports every order instead of erroring.
 *   - `sort` is ignored; rows always come back newest first. Not sent, rather
 *     than sent and quietly dropped.
 * Unknown params are ignored here rather than rejected, so a wrong name shows up
 * as a too-large export, never as an error.
 */
export const exportOrdersCsv = async (
  accessToken: string,
  options: FetchOptions = {}
): Promise<Blob> => {
  const params = new URLSearchParams();
  appendSharedFilters(params, options);
  if (options.start_date) params.append("start_date", options.start_date);
  if (options.end_date) params.append("end_date", options.end_date);

  const query = params.toString();
  const response = await fetch(
    `${API_BASE_URL}/admin/exports/orders.csv${query ? `?${query}` : ""}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        // No `Accept: text/csv`. The format comes from the `.csv` suffix, and
        // the endpoint's renderers only negotiate JSON — asking for text/csv
        // explicitly gets a 406 and no export at all.
        accept: "*/*",
      },
    }
  );

  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    throw new ApiError(
      formatApiError(json, "Failed to export orders"),
      response.status
    );
  }

  return response.blob();
};
