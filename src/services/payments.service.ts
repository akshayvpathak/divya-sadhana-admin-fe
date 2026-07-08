import {
  Payment,
  PaymentsList,
  paymentSchema,
  paymentsListSchema,
} from "@/schemas/payments.schema";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.divyasadhana.org/api";

interface FetchOptions {
  page?: number;
  page_size?: number;
  search?: string;
  search_fields?: string;
  sort?: string;
  status?: string;
}

export const getPaymentsList = async (
  accessToken: string,
  options: FetchOptions = {}
): Promise<PaymentsList> => {
  const params = new URLSearchParams();
  if (options.page) params.append("page", String(options.page));
  if (options.page_size) params.append("page_size", String(options.page_size));
  if (options.search) params.append("search", options.search);
  if (options.search_fields) params.append("search_fields", options.search_fields);
  if (options.sort) params.append("sort", options.sort);
  if (options.status) params.append("status", options.status);

  const response = await fetch(`${API_BASE_URL}/payments/?${params.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "" }));
    throw new Error(error.message || "Failed to fetch payments");
  }

  const json = await response.json();
  
  // Debug logging
  if (process.env.NEXT_PUBLIC_DEBUG_API === "true") {
    // eslint-disable-next-line no-console
    console.log("[API] Payments raw response:", json);
  }
  
  try {
    const parsed = paymentsListSchema.parse(json);
    if (process.env.NEXT_PUBLIC_DEBUG_API === "true") {
      // eslint-disable-next-line no-console
      console.log("[API] Payments parsed successfully:", parsed);
    }
    return parsed;
  } catch (parseError) {
    // Log the parse error, but only dump the raw response (which may contain
    // payment PII) when debug logging is explicitly enabled.
    if (process.env.NEXT_PUBLIC_DEBUG_API === "true") {
      // eslint-disable-next-line no-console
      console.error("[API] Payments schema parsing error:", parseError, "Raw response:", json);
    } else {
      // eslint-disable-next-line no-console
      console.error("[API] Payments schema parsing error:", parseError);
    }
    throw new Error(
      `Failed to parse payments response: ${parseError instanceof Error ? parseError.message : String(parseError)}`
    );
  }
};

export const getPayment = async (
  id: string,
  accessToken: string
): Promise<Payment> => {
  const response = await fetch(`${API_BASE_URL}/payments/${id}/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "" }));
    throw new Error(error.message || "Failed to fetch payment");
  }

  const json = await response.json();
  return paymentSchema.parse(json.data || json);
};
