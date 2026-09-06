import { ApiError, formatApiError } from "@/services/auth.service";
import {
  siteConfigResponseSchema,
  type SiteConfig,
} from "@/schemas/site-config.schema";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.divyasadhana.org/api";

/** GET is AllowAny; PATCH is superuser-only. Singleton — no id in the URL. */
const SITE_CONFIG_URL = `${API_BASE_URL}/site-config/`;

/**
 * A failing endpoint does not necessarily answer in JSON — a 404 or a gateway error returns
 * an HTML page, and `response.json()` on that throws "Unexpected token '<'", which is what
 * the admin would then see instead of a usable message.
 */
async function readJson(response: Response): Promise<unknown> {
  return response.json().catch(() => null);
}

export async function getSiteConfig(accessToken?: string): Promise<SiteConfig> {
  const response = await fetch(SITE_CONFIG_URL, {
    headers: {
      accept: "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    cache: "no-store",
  });

  const json = await readJson(response);
  if (!response.ok) {
    throw new ApiError(
      formatApiError(json, "Failed to load site configuration"),
      response.status
    );
  }
  return siteConfigResponseSchema.parse(json).data;
}

export async function updateSiteConfig(
  payload: Record<string, unknown>,
  accessToken: string
): Promise<SiteConfig> {
  const response = await fetch(SITE_CONFIG_URL, {
    method: "PATCH",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const json = await readJson(response);
  if (!response.ok) {
    throw new ApiError(
      formatApiError(json, "Failed to save site configuration"),
      response.status
    );
  }
  return siteConfigResponseSchema.parse(json).data;
}
