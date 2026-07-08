import {
  CategoriesListResponse,
  categoriesListResponseSchema,
  CategoriesListParams,
  ProductCategory,
  CreateCategoryPayload,
  UpdateCategoryPayload,
  createCategorySchema,
  updateCategorySchema,
  ProductCategorySchema,
} from "@/schemas/product-categories.schema";
import { ApiError, apiErrorFrom } from "@/services/auth.service";
import { z } from "zod";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.divyasadhana.org/api";

const CategoryResponseSchema = z.union([
  z.object({
    message: z.string().optional(),
    data: ProductCategorySchema,
  }),
  ProductCategorySchema,
]).transform((val) => {
  if ('data' in val) {
    return val.data;
  }
  return val;
});

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

export async function getCategoriesList(
  params: CategoriesListParams,
  accessToken: string
): Promise<CategoriesListResponse> {
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append("page", String(params.page));
  if (params.paginate) queryParams.append("paginate", String(params.paginate));
  if (params.search) queryParams.append("search", params.search);
  if (params.search_fields)
    queryParams.append("search_fields", params.search_fields);
  if (params.fields) queryParams.append("fields", params.fields);
  if (params.sort) queryParams.append("sort", params.sort);
  if (params.is_active) queryParams.append("is_active", params.is_active);

  const url = `${API_BASE_URL}/product-categories/?${queryParams.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const json = await response.json();

  if (!response.ok) {
    throw new ApiError(
      json?.message || "Failed to fetch categories list",
      response.status
    );
  }

  return categoriesListResponseSchema.parse(json);
}

export async function createCategory(
  payload: CreateCategoryPayload,
  accessToken: string
): Promise<ProductCategory> {
  const parsedPayload = createCategorySchema.parse(payload);

  const response = await fetch(`${API_BASE_URL}/product-categories/`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "X-CSRFTOKEN": getCsrfToken(),
    },
    body: JSON.stringify(parsedPayload),
  });

  const json = await response.json();

  if (!response.ok) {
    throw apiErrorFrom(json, "Failed to create category", response.status);
  }

  return CategoryResponseSchema.parse(json);
}

export async function updateCategory(
  id: string,
  payload: UpdateCategoryPayload,
  accessToken: string
): Promise<ProductCategory> {
  const parsedPayload = updateCategorySchema.parse(payload);

  const response = await fetch(`${API_BASE_URL}/product-categories/${id}/`, {
    method: "PATCH",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "X-CSRFTOKEN": getCsrfToken(),
    },
    body: JSON.stringify(parsedPayload),
  });

  const json = await response.json();

  if (!response.ok) {
    throw apiErrorFrom(json, "Failed to update category", response.status);
  }

  return CategoryResponseSchema.parse(json);
}

export async function deleteCategory(
  id: string,
  accessToken: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/product-categories/${id}/`, {
    method: "DELETE",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      "X-CSRFTOKEN": getCsrfToken(),
    },
  });

  if (!response.ok) {
    const json = await response.json();
    throw apiErrorFrom(json, "Failed to delete category", response.status);
  }
}

export async function getCategory(
  id: string,
  accessToken: string
): Promise<ProductCategory> {
  const response = await fetch(`${API_BASE_URL}/product-categories/${id}/`, {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const json = await response.json();

  if (!response.ok) {
    throw new ApiError(
      json?.message || "Failed to fetch category",
      response.status
    );
  }

  return CategoryResponseSchema.parse(json);
}
