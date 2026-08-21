import {
  AdminBook,
  AdminBooksList,
  BookPayload,
  DigitalAsset,
  adminBookSchema,
  adminBooksListSchema,
  digitalAssetSchema,
} from "@/schemas/books.schema";
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

function headers(accessToken: string, withBody = true): HeadersInit {
  const base: Record<string, string> = {
    accept: "application/json",
    Authorization: `Bearer ${accessToken}`,
    "X-CSRFTOKEN": getCsrfToken(),
  };
  if (withBody) base["Content-Type"] = "application/json";
  return base;
}

export interface BooksListOptions {
  page?: number;
  page_size?: number;
  search?: string;
  sort?: string;
  is_active?: string;
  is_published?: string;
}

export const getBooksList = async (
  accessToken: string,
  options: BooksListOptions = {}
): Promise<AdminBooksList> => {
  const params = new URLSearchParams();
  if (options.page) params.append("page", String(options.page));
  if (options.page_size) params.append("page_size", String(options.page_size));
  if (options.search) params.append("search", options.search);
  if (options.sort) params.append("sort", options.sort);
  if (options.is_active && options.is_active !== "all") {
    params.append("is_active", options.is_active);
  }
  if (options.is_published && options.is_published !== "all") {
    params.append("is_published", options.is_published);
  }

  const response = await fetch(`${API_BASE_URL}/admin/books/?${params.toString()}`, {
    method: "GET",
    headers: headers(accessToken, false),
  });

  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    throw apiErrorFrom(json, "Failed to fetch books", response.status);
  }

  return adminBooksListSchema.parse(await response.json());
};

export const getBook = async (id: string, accessToken: string): Promise<AdminBook> => {
  const response = await fetch(`${API_BASE_URL}/admin/books/${id}/`, {
    method: "GET",
    headers: headers(accessToken, false),
  });

  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    throw apiErrorFrom(json, "Failed to fetch book", response.status);
  }

  const json = await response.json();
  return adminBookSchema.parse(json.data ?? json);
};

/**
 * One transaction: the Product, the BookDetail, the "Format" option group and one variant
 * per format. It succeeds or fails as a unit, so there is no half-built book to recover from
 * and the form needs no partial-save path.
 */
export const createBook = async (
  payload: BookPayload,
  accessToken: string
): Promise<AdminBook> => {
  const response = await fetch(`${API_BASE_URL}/admin/books/`, {
    method: "POST",
    headers: headers(accessToken),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    throw apiErrorFrom(json, "Failed to create book", response.status);
  }

  const json = await response.json();
  return adminBookSchema.parse(json.data ?? json);
};

export const updateBook = async (
  id: string,
  payload: Partial<BookPayload>,
  accessToken: string
): Promise<AdminBook> => {
  const response = await fetch(`${API_BASE_URL}/admin/books/${id}/`, {
    method: "PATCH",
    headers: headers(accessToken),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    throw apiErrorFrom(json, "Failed to update book", response.status);
  }

  const json = await response.json();
  return adminBookSchema.parse(json.data ?? json);
};

/**
 * Blocked with a 400 once any customer owns the title — ownership is permanent, so
 * delisting is the catalogue action and deletion is not. Surface the message and offer
 * unpublish instead of retrying.
 */
export const deleteBook = async (id: string, accessToken: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/admin/books/${id}/`, {
    method: "DELETE",
    headers: headers(accessToken, false),
  });

  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    throw apiErrorFrom(json, "Failed to delete book", response.status);
  }
};

/**
 * Register an already-uploaded PDF. `page_count` and `size_bytes` come back measured from
 * the object itself — registering a key that was never uploaded, or is not a readable PDF,
 * is a 400.
 */
export const registerDigitalAsset = async (
  objectKey: string,
  accessToken: string
): Promise<DigitalAsset> => {
  const response = await fetch(`${API_BASE_URL}/digital-assets/`, {
    method: "POST",
    headers: headers(accessToken),
    body: JSON.stringify({ object_key: objectKey }),
  });

  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    throw apiErrorFrom(json, "Failed to register the uploaded file", response.status);
  }

  const json = await response.json();
  return digitalAssetSchema.parse(json.data ?? json);
};
