import { z } from "zod";
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
  // Wire name is `paginate`. `page_size` is DRF's default, which this API does
  // not use — it was silently ignored until it became a 422 on 2026-09-11.
  if (options.page_size) params.append("paginate", String(options.page_size));
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
  return parseBookResponse(json, accessToken);
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
  return parseBookResponse(json, accessToken);
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
  return parseBookResponse(json, accessToken);
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

const digitalAssetsListSchema = z.object({
  message: z.string().optional(),
  data: z
    .object({
      count: z.number().optional(),
      next: z.string().nullable().optional(),
      previous: z.string().nullable().optional(),
      results: z.array(digitalAssetSchema).nullable().optional().default([]),
    })
    .optional(),
});

async function searchDigitalAssets(
  query: string,
  accessToken: string
): Promise<DigitalAsset[]> {
  const params = new URLSearchParams({ search: query, paginate: "50" });
  const response = await fetch(`${API_BASE_URL}/digital-assets/?${params}`, {
    method: "GET",
    headers: headers(accessToken, false),
  });
  if (!response.ok) return [];
  const json = await response.json().catch(() => ({}));
  const parsed = digitalAssetsListSchema.safeParse(json);
  return parsed.success ? parsed.data.data?.results ?? [] : [];
}

async function getDigitalAsset(
  id: string,
  accessToken: string
): Promise<DigitalAsset | null> {
  const response = await fetch(`${API_BASE_URL}/digital-assets/${id}/`, {
    method: "GET",
    headers: headers(accessToken, false),
  });
  if (!response.ok) return null;
  const json = await response.json().catch(() => ({}));
  const parsed = digitalAssetSchema.safeParse(json.data ?? json);
  return parsed.success ? parsed.data : null;
}

function isPlaceholderAsset(asset: DigitalAsset): boolean {
  const name = (asset.file_name || "").toLowerCase();
  return name.includes("placeholder") || (asset.page_count === 1 && (asset.size_bytes ?? 0) < 5000);
}

function assetFileName(asset: DigitalAsset): string {
  return (asset.file_name || "").toLowerCase();
}

function matchesBookSlug(asset: DigitalAsset, slug: string): boolean {
  const name = assetFileName(asset);
  return name === `${slug}.pdf` || name === `${slug}-placeholder.pdf` || name === slug;
}

function rankEbookAssets(assets: DigitalAsset[]): DigitalAsset | null {
  if (!assets.length) return null;
  return [...assets].sort((a, b) => {
    const placeholder = Number(isPlaceholderAsset(a)) - Number(isPlaceholderAsset(b));
    if (placeholder) return placeholder;
    const pages = (b.page_count ?? 0) - (a.page_count ?? 0);
    if (pages) return pages;
    const size = (b.size_bytes ?? 0) - (a.size_bytes ?? 0);
    if (size) return size;
    return String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""));
  })[0];
}

/** Prefer `{slug}.pdf` over a 1-page placeholder, then the longest / newest copy. */
function pickEbookAsset(assets: DigitalAsset[], slug: string): DigitalAsset | null {
  const needle = slug.trim().toLowerCase();
  if (!needle || !assets.length) return null;
  const named = assets.filter((asset) => matchesBookSlug(asset, needle));
  if (named.length) return rankEbookAssets(named);
  // Search already scoped the list; a single hit is safe to use even if the filename differs.
  if (assets.length === 1) return assets[0];
  return null;
}

function withEbookAsset(book: AdminBook, asset: DigitalAsset): AdminBook {
  return {
    ...book,
    variants: (book.variants ?? []).map((variant) =>
      variant.variant_type === "EBOOK"
        ? { ...variant, digital_asset: asset, digital_asset_id: asset.id }
        : variant
    ),
  };
}

async function attachMissingEbookAsset(
  book: AdminBook,
  accessToken: string
): Promise<AdminBook> {
  const ebook = (book.variants ?? []).find((v) => v.variant_type === "EBOOK");
  if (!ebook) return book;

  if (ebook.digital_asset?.id) return book;

  const knownId = ebook.digital_asset_id;
  if (knownId) {
    const asset = await getDigitalAsset(knownId, accessToken);
    return asset ? withEbookAsset(book, asset) : book;
  }

  const slug = (book.slug || "").trim();
  if (!slug) return book;
  const matches = await searchDigitalAssets(slug, accessToken);
  const asset = pickEbookAsset(matches, slug);
  return asset ? withEbookAsset(book, asset) : book;
}

async function parseBookResponse(json: unknown, accessToken: string): Promise<AdminBook> {
  const payload = json && typeof json === "object" && "data" in json ? (json as { data: unknown }).data : json;
  const book = adminBookSchema.parse(payload ?? json);
  // GET /admin/books/{id}/ currently omits digital_asset on the eBook variant, so the
  // edit form would render an empty "Upload PDF" even when a file is already registered.
  // Recover it from /digital-assets/ by the title slug until the retrieve serializer
  // starts echoing the nested asset.
  return attachMissingEbookAsset(book, accessToken);
}

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
