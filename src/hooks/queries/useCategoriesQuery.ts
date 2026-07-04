import { getCategoriesList } from "@/services/product-categories.service";
import { CategoriesListParams } from "@/schemas/product-categories.schema";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/services/product-categories.service";
import {
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from "@/schemas/product-categories.schema";

export function useCategoriesListQuery(params: CategoriesListParams) {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: ["product-categories", params],
    queryFn: () => {
      if (!accessToken) {
        throw new Error("Access token not found");
      }
      return getCategoriesList(params, accessToken);
    },
    enabled: !!accessToken,
  });
}

export function useCreateCategoryMutation() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCategoryPayload) => {
      if (!accessToken) throw new Error("Access token not found");
      return createCategory(payload, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-categories"] });
      // Keep the legacy hook layer's namespace in sync (see hooks/useCategories.ts).
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useUpdateCategoryMutation() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateCategoryPayload;
    }) => {
      if (!accessToken) throw new Error("Access token not found");
      return updateCategory(id, payload, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-categories"] });
      // Keep the legacy hook layer's namespace in sync (see hooks/useCategories.ts).
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useDeleteCategoryMutation() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {
      if (!accessToken) throw new Error("Access token not found");
      return deleteCategory(id, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-categories"] });
      // Keep the legacy hook layer's namespace in sync (see hooks/useCategories.ts).
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}
