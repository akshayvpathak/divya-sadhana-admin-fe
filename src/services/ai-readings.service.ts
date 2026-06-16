import {
  AiReading,
  AiReadingsList,
  aiReadingSchema,
  aiReadingsListSchema,
} from "@/schemas/ai-readings.schema";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.divyasadhana.org/api";

interface FetchOptions {
  page?: number;
  paginate?: number;
  search?: string;
  search_fields?: string;
  status?: string;
  service__kind?: string;
  sort?: string;
}

export const getAiReadingsList = async (
  accessToken: string,
  options: FetchOptions = {}
): Promise<AiReadingsList> => {
  const params = new URLSearchParams();
  if (options.page) params.append("page", String(options.page));
  if (options.paginate) params.append("paginate", String(options.paginate));
  if (options.search) params.append("search", options.search);
  if (options.search_fields) params.append("search_fields", options.search_fields);
  if (options.status && options.status !== "all") params.append("status", options.status);
  if (options.service__kind && options.service__kind !== "all") {
    params.append("service__kind", options.service__kind);
  }
  if (options.sort) params.append("sort", options.sort);

  const response = await fetch(`${API_BASE_URL}/admin/ai-readings/?${params.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "" }));
    throw new Error(error.message || "Failed to fetch AI readings");
  }

  const json = await response.json();
  
  try {
    return aiReadingsListSchema.parse(json);
  } catch (parseError) {
    // eslint-disable-next-line no-console
    console.error("[API] AI readings schema parsing error:", parseError, "Raw response:", json);
    throw new Error(
      `Failed to parse AI readings response: ${parseError instanceof Error ? parseError.message : String(parseError)}`
    );
  }
};

export const getAiReading = async (
  id: string,
  accessToken: string
): Promise<AiReading> => {
  const response = await fetch(`${API_BASE_URL}/admin/ai-readings/${id}/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "" }));
    throw new Error(error.message || "Failed to fetch AI reading details");
  }

  const json = await response.json();
  return aiReadingSchema.parse(json.data || json);
};
