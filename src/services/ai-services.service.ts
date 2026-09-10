import { ApiError, formatApiError } from "@/services/auth.service";
import {
  aiServiceResponseSchema,
  aiServicesListSchema,
  type AiService,
  type AiServicesList,
} from "@/schemas/ai-services.schema";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.divyasadhana.org/api";

/**
 * GET is public; POST/PATCH/DELETE are superuser-only. The detail route accepts a UUID or a
 * slug. There is no PUT anywhere in this API — always PATCH.
 */
const BASE = `${API_BASE_URL}/ai-services/`;

/** A failing endpoint may answer with an HTML error page, which is not parseable JSON. */
async function readJson(response: Response): Promise<unknown> {
  return response.json().catch(() => null);
}

function authHeaders(accessToken?: string): HeadersInit {
  return {
    accept: "application/json",
    "Content-Type": "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
}

export async function getAiServicesList(
  accessToken: string,
  options: { page?: number; page_size?: number; search?: string } = {}
): Promise<AiServicesList> {
  const params = new URLSearchParams();
  if (options.page) params.set("page", String(options.page));
  // Wire name is `paginate`. `page_size` is DRF's default, which this API does
  // not use — it was silently ignored until it became a 422 on 2026-09-11.
  if (options.page_size) params.set("paginate", String(options.page_size));
  if (options.search?.trim()) params.set("search", options.search.trim());

  const url = params.toString() ? `${BASE}?${params.toString()}` : BASE;
  const response = await fetch(url, { headers: authHeaders(accessToken), cache: "no-store" });

  const json = await readJson(response);
  if (!response.ok) {
    throw new ApiError(
      formatApiError(json, "Failed to load AI services"),
      response.status
    );
  }
  return aiServicesListSchema.parse(json);
}

export async function getAiService(id: string, accessToken: string): Promise<AiService> {
  const response = await fetch(`${BASE}${id}/`, {
    headers: authHeaders(accessToken),
    cache: "no-store",
  });

  const json = await readJson(response);
  if (!response.ok) {
    throw new ApiError(formatApiError(json, "Failed to load AI service"), response.status);
  }
  return aiServiceResponseSchema.parse(json).data;
}

export async function updateAiService(
  id: string,
  payload: Record<string, unknown>,
  accessToken: string
): Promise<AiService> {
  const response = await fetch(`${BASE}${id}/`, {
    method: "PATCH",
    headers: authHeaders(accessToken),
    body: JSON.stringify(payload),
  });

  const json = await readJson(response);
  if (!response.ok) {
    throw new ApiError(formatApiError(json, "Failed to update AI service"), response.status);
  }
  return aiServiceResponseSchema.parse(json).data;
}
