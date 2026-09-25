import {
  HomepageGalleryFormValues,
  HomepageGalleryItem,
  homepageGalleryItemSchema,
  homepageGalleryListSchema,
} from "@/schemas/homepage-gallery.schema";
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

async function readJson(response: Response): Promise<unknown> {
  return response.json().catch(() => null);
}

export async function getHomepageGallery(
  accessToken: string
): Promise<HomepageGalleryItem[]> {
  const response = await fetch(
    `${API_BASE_URL}/admin/homepage/gallery/?page=1&paginate=100`,
    {
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  const json = await readJson(response);
  if (!response.ok) {
    throw new ApiError(
      formatApiError(json, "Failed to load homepage gallery"),
      response.status
    );
  }

  return homepageGalleryListSchema.parse(json).data.results;
}

export async function getHomepageGalleryItem(
  id: string,
  accessToken: string
): Promise<HomepageGalleryItem> {
  const response = await fetch(
    `${API_BASE_URL}/admin/homepage/gallery/${id}/`,
    {
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  const json = await readJson(response);
  if (!response.ok) {
    throw new ApiError(
      formatApiError(json, "Failed to load gallery item"),
      response.status
    );
  }

  const row =
    json && typeof json === "object" && "data" in json
      ? (json as { data: unknown }).data
      : json;
  return homepageGalleryItemSchema.parse(row);
}

export async function createHomepageGalleryItem(
  payload: HomepageGalleryFormValues & { image_key: string },
  accessToken: string
): Promise<HomepageGalleryItem> {
  const response = await fetch(`${API_BASE_URL}/admin/homepage/gallery/`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "X-CSRFTOKEN": getCsrfToken(),
    },
    body: JSON.stringify(payload),
  });

  const json = await readJson(response);
  if (!response.ok) {
    throw new ApiError(
      formatApiError(json, "Failed to create gallery item"),
      response.status
    );
  }

  return homepageGalleryItemSchema.parse(
    (json as { data?: unknown } | null)?.data ?? json
  );
}

export async function updateHomepageGalleryItem(
  id: string,
  payload: Partial<HomepageGalleryFormValues>,
  accessToken: string
): Promise<HomepageGalleryItem> {
  const response = await fetch(
    `${API_BASE_URL}/admin/homepage/gallery/${id}/`,
    {
      method: "PATCH",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-CSRFTOKEN": getCsrfToken(),
      },
      body: JSON.stringify(payload),
    }
  );

  const json = await readJson(response);
  if (!response.ok) {
    throw new ApiError(
      formatApiError(json, "Failed to update gallery item"),
      response.status
    );
  }

  return homepageGalleryItemSchema.parse(
    (json as { data?: unknown } | null)?.data ?? json
  );
}

export async function deleteHomepageGalleryItem(
  id: string,
  accessToken: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/admin/homepage/gallery/${id}/`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-CSRFTOKEN": getCsrfToken(),
      },
    }
  );

  if (!response.ok) {
    const json = await readJson(response);
    throw new ApiError(
      formatApiError(json, "Failed to delete gallery item"),
      response.status
    );
  }
}
