import { OrdersList, ordersListSchema, Order } from "@/schemas/orders.schema";

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
  if (options.page_size) params.append("page_size", String(options.page_size));
  if (options.search) params.append("search", options.search);
  if (options.search_fields) params.append("search_fields", options.search_fields);
  if (options.sort) params.append("sort", options.sort);
  if (options.payment_status) params.append("payment_status", options.payment_status);
  if (options.status) params.append("status", options.status);
  if (options.shipping_status) params.append("shipping_status", options.shipping_status);

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
