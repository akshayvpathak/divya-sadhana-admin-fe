import {
  CreateProductPayload,
  Product,
  ProductsList,
  UpdateProductPayload,
  productsListSchema,
  productSchema,
} from "@/schemas/products.schema";
import { apiErrorFrom } from "@/services/auth.service";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.divyasadhana.org/api";

interface FetchOptions {
  page?: number;
  page_size?: number;
  search?: string;
  search_fields?: string;
  sort?: string;
  category?: string;
  is_active?: string;
  is_published?: string;
}

/**
 * Utility function to get CSRF token from cookies
 */
function getCsrfToken(): string {
  return (
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("csrftoken="))
      ?.split("=")[1] || ""
  );
}

export const getProductsList = async (
  accessToken: string,
  options: FetchOptions = {}
): Promise<ProductsList> => {
  const params = new URLSearchParams();
  if (options.page) params.append("page", String(options.page));
  if (options.page_size) params.append("page_size", String(options.page_size));
  if (options.search) params.append("search", options.search);
  if (options.search_fields)
    params.append("search_fields", options.search_fields);
  if (options.sort) params.append("sort", options.sort);
  if (options.is_active !== undefined) params.append("is_active", options.is_active);
  if (options.is_published !== undefined) params.append("is_published", options.is_published);
  // Server-side category filter (matches the Product.category field). Not in the
  // generated schema's param list, but the storefront relies on the same filter;
  // callers keep a client-side fallback in case the backend ignores it.
  if (options.category && options.category !== "all") params.append("category", options.category);

  const response = await fetch(
    `${API_BASE_URL}/products/?${params.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch products");
  }

  const json = await response.json();
  return productsListSchema.parse(json);
};

export const createProduct = async (
  payload: CreateProductPayload,
  accessToken: string
): Promise<Product> => {
  const response = await fetch(`${API_BASE_URL}/products/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "X-CSRFTOKEN": getCsrfToken(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const json = await response.json();
    throw apiErrorFrom(json, "Failed to create product", response.status);
  }

  const json = await response.json();
  return productSchema.parse(json.data || json);
};

export const getProduct = async (
  id: string,
  accessToken: string
): Promise<Product> => {
  const response = await fetch(`${API_BASE_URL}/products/${id}/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch product");
  }

  const json = await response.json();
  return productSchema.parse(json.data || json);
};

export const updateProduct = async (
  id: string,
  payload: UpdateProductPayload,
  accessToken: string
): Promise<Product> => {
  const response = await fetch(`${API_BASE_URL}/products/${id}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "X-CSRFTOKEN": getCsrfToken(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const json = await response.json();
    throw apiErrorFrom(json, "Failed to update product", response.status);
  }

  const json = await response.json();
  return productSchema.parse(json.data || json);
};

export const deleteProduct = async (id: string, accessToken: string) => {
  const response = await fetch(`${API_BASE_URL}/products/${id}/`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "X-CSRFTOKEN": getCsrfToken(),
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete product");
  }
};

/**
 * Publish a product (makes it visible to public)
 */
export const publishProduct = async (
  id: string,
  accessToken: string
): Promise<Product> => {
  const response = await fetch(`${API_BASE_URL}/products/${id}/publish`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "X-CSRFTOKEN": getCsrfToken(),
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to publish product");
  }

  const json = await response.json();
  return productSchema.parse(json.data || json);
};

/**
 * Unpublish a product (hides it from public)
 */
export const unpublishProduct = async (
  id: string,
  accessToken: string
): Promise<Product> => {
  const response = await fetch(`${API_BASE_URL}/products/${id}/unpublish`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "X-CSRFTOKEN": getCsrfToken(),
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to unpublish product");
  }

  const json = await response.json();
  return productSchema.parse(json.data || json);
};

/**
 * Replace entire gallery with new image keys
 */
export const replaceGallery = async (
  id: string,
  galleryImageKeys: string[],
  accessToken: string
): Promise<Product> => {
  const response = await fetch(`${API_BASE_URL}/products/${id}/gallery/replace/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "X-CSRFTOKEN": getCsrfToken(),
    },
    body: JSON.stringify({ gallery_image_keys: galleryImageKeys }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to replace gallery");
  }

  const json = await response.json();
  return productSchema.parse(json.data || json);
};

/**
 * Append new images to existing gallery
 */
export const appendGallery = async (
  id: string,
  newImageKeys: string[],
  accessToken: string
): Promise<Product> => {
  const response = await fetch(`${API_BASE_URL}/products/${id}/gallery/append/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "X-CSRFTOKEN": getCsrfToken(),
    },
    body: JSON.stringify({ gallery_image_keys: newImageKeys }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to append gallery");
  }

  const json = await response.json();
  return productSchema.parse(json.data || json);
};

/**
 * Remove a specific image from gallery
 */
export const removeGalleryImage = async (
  id: string,
  imageKey: string,
  accessToken: string
): Promise<Product> => {
  const response = await fetch(
    `${API_BASE_URL}/products/${id}/gallery/remove/`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-CSRFTOKEN": getCsrfToken(),
      },
      body: JSON.stringify({ image_key: imageKey }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to remove gallery image");
  }

  const json = await response.json();
  return productSchema.parse(json.data || json);
};
