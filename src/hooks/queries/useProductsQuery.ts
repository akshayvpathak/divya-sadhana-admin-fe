import { useAuth } from "@/context/AuthContext";
import {
  CreateProductPayload,
  UpdateProductPayload,
} from "@/schemas/products.schema";
import {
  createProduct,
  deleteProduct,
  getProduct,
  getProductsList,
  updateProduct,
  publishProduct,
  unpublishProduct,
  replaceGallery,
  appendGallery,
  removeGalleryImage,
} from "@/services/products.service";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

export const useProductsListQuery = (
  page: number = 1,
  search: string = ""
) => {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: ["products", page, search],
    queryFn: async () => {
      if (!accessToken) throw new Error("No access token");
      return getProductsList(accessToken, {
        page,
        page_size: 10,
        search,
        search_fields: "name,sku,description",
      });
    },
    enabled: !!accessToken,
  });
};

export const useProductQuery = (productId: string | null) => {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      if (!accessToken || !productId) throw new Error("Missing required data");
      return getProduct(productId, accessToken);
    },
    enabled: !!accessToken && !!productId,
  });
};

export const useCreateProductMutation = () => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateProductPayload) => {
      if (!accessToken) throw new Error("No access token");
      return createProduct(payload, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

export const useUpdateProductMutation = () => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      payload,
    }: {
      productId: string;
      payload: UpdateProductPayload;
    }) => {
      if (!accessToken) throw new Error("No access token");
      return updateProduct(productId, payload, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
    },
  });
};

export const useDeleteProductMutation = () => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      if (!accessToken) throw new Error("No access token");
      return deleteProduct(productId, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

/**
 * Publish a product (make it visible to public)
 */
export const usePublishProductMutation = () => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      if (!accessToken) throw new Error("No access token");
      return publishProduct(productId, accessToken);
    },
    onSuccess: (_, productId) => {
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

/**
 * Unpublish a product (hide it from public)
 */
export const useUnpublishProductMutation = () => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      if (!accessToken) throw new Error("No access token");
      return unpublishProduct(productId, accessToken);
    },
    onSuccess: (_, productId) => {
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

/**
 * Replace entire gallery with new image keys
 */
export const useReplaceGalleryMutation = () => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      imageKeys,
    }: {
      productId: string;
      imageKeys: string[];
    }) => {
      if (!accessToken) throw new Error("No access token");
      return replaceGallery(productId, imageKeys, accessToken);
    },
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

/**
 * Append new images to existing gallery
 */
export const useAppendGalleryMutation = () => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      imageKeys,
    }: {
      productId: string;
      imageKeys: string[];
    }) => {
      if (!accessToken) throw new Error("No access token");
      return appendGallery(productId, imageKeys, accessToken);
    },
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

/**
 * Remove a specific image from gallery
 */
export const useRemoveGalleryImageMutation = () => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      imageKey,
    }: {
      productId: string;
      imageKey: string;
    }) => {
      if (!accessToken) throw new Error("No access token");
      return removeGalleryImage(productId, imageKey, accessToken);
    },
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};
