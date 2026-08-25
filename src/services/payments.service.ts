import {
  AllPayment,
  Payment,
  PaymentsList,
  paymentSchema,
  paymentsListSchema,
} from "@/schemas/payments.schema";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.divyasadhana.org/api";

interface AllPaymentsFetchOptions {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  /** Comma-separated sources, e.g. "ecommerce,donation". Omit for all. */
  source?: string;
}

/** Unified payments across verticals — GET /api/payments/all/. */
export const getAllPaymentsList = async (
  accessToken: string,
  options: AllPaymentsFetchOptions = {}
): Promise<PaymentsList> => {
  const params = new URLSearchParams();
  if (options.page) params.append("page", String(options.page));
  if (options.page_size) params.append("page_size", String(options.page_size));
  if (options.search) params.append("search", options.search);
  if (options.status) params.append("status", options.status);
  if (options.source) params.append("source", options.source);

  const response = await fetch(
    `${API_BASE_URL}/payments/all/?${params.toString()}`,
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
    throw new Error(error.message || "Failed to fetch payments");
  }

  const json = await response.json();

  if (process.env.NEXT_PUBLIC_DEBUG_API === "true") {
    // eslint-disable-next-line no-console
    console.log("[API] All payments raw response:", json);
  }

  try {
    return paymentsListSchema.parse(json);
  } catch (parseError) {
    if (process.env.NEXT_PUBLIC_DEBUG_API === "true") {
      // eslint-disable-next-line no-console
      console.error(
        "[API] All payments schema parsing error:",
        parseError,
        "Raw response:",
        json
      );
    } else {
      // eslint-disable-next-line no-console
      console.error("[API] All payments schema parsing error:", parseError);
    }
    throw new Error(
      `Failed to parse payments response: ${
        parseError instanceof Error ? parseError.message : String(parseError)
      }`
    );
  }
};

/** Ecommerce-only payment detail — GET /api/payments/{id}/. */
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

export type { AllPayment };
