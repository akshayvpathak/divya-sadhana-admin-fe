import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useInfiniteListQuery } from './queries/useInfiniteListQuery';
import { toast } from 'react-toastify';
import {
  getProductsList,
  createProduct,
  updateProduct,
  deleteProduct,
  getProduct,
  createOptionGroup,
  createVariant,
  updateVariant,
  deleteVariant,
} from '../services/products.service';
import type {
  CreateOptionGroupPayload,
  CreateVariantPayload,
  UpdateVariantPayload,
} from '../schemas/products.schema';
import { useAuth } from '../context/AuthContext';

export const cleanImageUrl = (url: string | null | undefined) => {
  if (!url) return null;
  
  if (url.includes('https%3A//') || url.includes('http%3A//')) {
    const protocolKey = url.includes('https%3A//') ? 'https%3A//' : 'http%3A//';
    const startIndex = url.indexOf(protocolKey);
    const nestedPart = url.substring(startIndex);
    
    // Split the nested part into [nestedPathWithOldCreds, newOuterCreds]
    const parts = nestedPart.split('?');
    const pathWithOldCreds = decodeURIComponent(parts[0]);
    
    // Remove the old query params from the decoded path
    const cleanPath = pathWithOldCreds.split('?')[0];
    
    // Append the new outer query params if present
    if (parts[1]) {
      return `${cleanPath}?${parts[1]}`;
    }
    return cleanPath;
  }
  
  const lastHttps = url.lastIndexOf('https://');
  if (lastHttps > 0) {
    return url.substring(lastHttps);
  }
  return url;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.divyasadhana.org/api";

export const resolveProductImageUrl = (urlOrKey: string | null | undefined): string => {
  if (!urlOrKey) return '';
  
  const cleaned = cleanImageUrl(urlOrKey);
  if (!cleaned) return '';

  if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
    return cleaned;
  }

  const base = API_BASE_URL.replace(/\/api\/?$/, '');
  let path = cleaned;
  if (path.startsWith('/')) {
    path = path.substring(1);
  }
  
  if (path.startsWith('media/')) {
    return `${base}/${path}`;
  }
  
  return `${base}/media/${path}`;
};

const R2_BUCKET_PREFIXES = ['divyasadhana-dev/', 'divyasadhana-prod/'];

const stripR2BucketPrefix = (key: string): string => {
  for (const prefix of R2_BUCKET_PREFIXES) {
    if (key.startsWith(prefix)) {
      return key.substring(prefix.length);
    }
  }
  return key;
};

export const extractImageKey = (urlOrKey: string | null | undefined): string => {
  if (!urlOrKey) return '';
  if (!urlOrKey.startsWith('http://') && !urlOrKey.startsWith('https://')) {
    return urlOrKey;
  }
  try {
    const url = new URL(urlOrKey);
    let key = url.pathname;
    if (key.startsWith('/media/')) {
      key = key.substring('/media/'.length);
    } else if (key.startsWith('/')) {
      key = key.substring(1);
    }
    return stripR2BucketPrefix(decodeURIComponent(key));
  } catch (e) {
    return urlOrKey;
  }
};

type ApiProduct = Awaited<ReturnType<typeof getProductsList>>['data']['results'][number];

/** The row shape both the desktop table and the mobile cards render. */
const toProductRow = (p: ApiProduct) => ({
  id: p.id,
  name: p.name,
  price: p.price,
  description: p.description,
  categoryId: p.category,
  stock: p.stock_quantity,
  is_active: p.is_active,
  is_published: p.is_published,
  image: resolveProductImageUrl(p.primary_image_url || p.primary_image_key) || `https://picsum.photos/seed/${p.id}/400/400`,
});

/**
 * Server-side `category` is the primary filter (see products.service.ts).
 * This client-side pass is only a fallback for the page already in hand, in case
 * the backend ignores the param — it must never be the sole filter, since it
 * would otherwise miss matches beyond page 1.
 */
const applyCategoryFallback = (results: ApiProduct[], categoryId: string) =>
  categoryId && categoryId !== 'all'
    ? results.filter(p => p.category === categoryId)
    : results;

export const useProducts = (
  page = 1,
  limit = 10,
  search = '',
  categoryId = '',
  sort = '',
  status = 'all',
  published = 'all',
  options: { enabled?: boolean } = {}
) => {
  const { accessToken } = useAuth();
  const { enabled = true } = options;
  const isActiveParam = status === 'all' ? undefined : status === 'active' ? 'true' : 'false';
  const isPublishedParam = published === 'all' ? undefined : published === 'published' ? 'true' : 'false';

  return useQuery({
    queryKey: ['products', { page, limit, search, categoryId, sort, status, published }],
    queryFn: async () => {
      if (!accessToken) throw new Error('No access token');
      const response = await getProductsList(accessToken, {
        page,
        page_size: limit,
        search,
        sort,
        category: categoryId,
        is_active: isActiveParam,
        is_published: isPublishedParam,
      });

      return {
        data: applyCategoryFallback(response.data.results, categoryId).map(toProductRow),
        meta: {
          total: response.data.count,
          totalPages: Math.ceil(response.data.count / limit),
        }
      };
    },
    enabled: !!accessToken && enabled,
    staleTime: 5000,
    placeholderData: keepPreviousData,
  });
};

/** Mobile card list: same endpoint and filters, appended page by page. */
export const useProductsInfinite = (
  limit = 10,
  search = '',
  categoryId = '',
  sort = '',
  status = 'all',
  published = 'all',
  options: { enabled?: boolean } = {}
) => {
  const { accessToken } = useAuth();
  const { enabled = true } = options;
  const isActiveParam = status === 'all' ? undefined : status === 'active' ? 'true' : 'false';
  const isPublishedParam = published === 'all' ? undefined : published === 'published' ? 'true' : 'false';

  return useInfiniteListQuery({
    queryKey: ['products', 'infinite', { limit, search, categoryId, sort, status, published }],
    pageSize: limit,
    enabled: !!accessToken && enabled,
    fetchPage: async (page) => {
      if (!accessToken) throw new Error('No access token');
      const response = await getProductsList(accessToken, {
        page,
        page_size: limit,
        search,
        sort,
        category: categoryId,
        is_active: isActiveParam,
        is_published: isPublishedParam,
      });
      return {
        count: response.data.count,
        results: applyCategoryFallback(response.data.results, categoryId).map(toProductRow),
        // The fallback above can shorten a page; paginate on what the API served.
        rawLength: response.data.results.length,
      };
    },
  });
};

export const useProduct = (id: string) => {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      if (!accessToken) throw new Error('No access token');
      const p = await getProduct(id, accessToken);
      const primaryImageKey = p.primary_image_key || '';
      const primaryImageUrl = p.primary_image_url
        ? (cleanImageUrl(p.primary_image_url) || p.primary_image_url)
        : '';

      return {
        id: p.id,
        name: p.name,
        price: p.price,
        description: p.description,
        categoryId: p.category,
        stock: p.stock_quantity,
        sku: p.sku,
        is_active: p.is_active,
        is_published: p.is_published,
        primary_image_key: primaryImageKey,
        primary_image_url: primaryImageUrl,
        image: primaryImageKey,
        gallery_image_keys: p.gallery_image_keys || [],
        gallery_image_urls: (p.gallery_image_urls || [])
          .map((url) => (url ? cleanImageUrl(url) || url : ''))
          .filter(Boolean) as string[],
        slug: p.slug || '',
        meta_title: p.meta_title || '',
        meta_description: p.meta_description || '',
        meta_keywords: p.meta_keywords || '',
        og_image_key: p.og_image_key || '',
        og_image_url: p.og_image_url
          ? (cleanImageUrl(p.og_image_url) || p.og_image_url)
          : '',
        is_indexable: p.is_indexable ?? true,
        has_variants: p.has_variants ?? false,
        min_price: p.min_price ?? null,
        max_price: p.max_price ?? null,
        option_groups: p.option_groups || [],
        variants: p.variants || [],
        // Surfaced for the read-only detail view; the edit form ignores them.
        created_at: p.created_at ?? null,
        updated_at: p.updated_at ?? null,
      };
    },
    enabled: !!id && !!accessToken,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();

  return useMutation({
    mutationFn: async (data: any) => {
      if (!accessToken) throw new Error('No access token');
      const payload: any = {
        name: data.name,
        description: data.description,
        sku: data.sku,
        price: data.price,
        stock_quantity: data.stock_quantity,
        is_active: data.is_active,
        is_published: data.is_published,
        primary_image_key: extractImageKey(data.image),
        gallery_image_keys: (data.gallery_image_keys || []).map((k: string) => extractImageKey(k)),
        slug: data.slug,
        meta_title: data.meta_title || '',
        meta_description: data.meta_description || '',
        meta_keywords: data.meta_keywords || '',
        og_image_key: extractImageKey(data.og_image_key),
        is_indexable: data.is_indexable ?? true,
      };
      if (data.categoryId) {
        payload.category = data.categoryId;
      }
      return createProduct(payload, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      if (!accessToken) throw new Error('No access token');
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.price !== undefined) updateData.price = data.price;
      if (data.categoryId !== undefined) {
        if (data.categoryId) {
          updateData.category = data.categoryId;
        }
      }
      if (data.image !== undefined) updateData.primary_image_key = extractImageKey(data.image);
      if (data.sku !== undefined) updateData.sku = data.sku;
      if (data.stock_quantity !== undefined) updateData.stock_quantity = data.stock_quantity;
      if (data.is_active !== undefined) updateData.is_active = data.is_active;
      if (data.is_published !== undefined) updateData.is_published = data.is_published;
      if (data.gallery_image_keys !== undefined) {
        updateData.gallery_image_keys = (data.gallery_image_keys || []).map((k: string) => extractImageKey(k));
      }
      if (data.slug !== undefined) updateData.slug = data.slug;
      if (data.meta_title !== undefined) updateData.meta_title = data.meta_title || '';
      if (data.meta_description !== undefined) updateData.meta_description = data.meta_description || '';
      if (data.meta_keywords !== undefined) updateData.meta_keywords = data.meta_keywords || '';
      if (data.og_image_key !== undefined) updateData.og_image_key = extractImageKey(data.og_image_key);
      if (data.is_indexable !== undefined) updateData.is_indexable = data.is_indexable;

      return updateProduct(id, updateData, accessToken);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
      toast.success('Product updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!accessToken) throw new Error('No access token');
      return deleteProduct(id, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useCreateOptionGroup = (productId: string) => {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();

  return useMutation({
    mutationFn: async (payload: CreateOptionGroupPayload) => {
      if (!accessToken) throw new Error('No access token');
      return createOptionGroup(productId, payload, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Option group created');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useCreateVariant = (productId: string) => {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();

  return useMutation({
    mutationFn: async (payload: CreateVariantPayload) => {
      if (!accessToken) throw new Error('No access token');
      return createVariant(productId, payload, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Variant created');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useUpdateVariant = (productId: string) => {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();

  return useMutation({
    mutationFn: async ({
      variantId,
      data,
    }: {
      variantId: string;
      data: UpdateVariantPayload;
    }) => {
      if (!accessToken) throw new Error('No access token');
      return updateVariant(variantId, data, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Variant updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useDeleteVariant = (productId: string) => {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();

  return useMutation({
    mutationFn: async (variantId: string) => {
      if (!accessToken) throw new Error('No access token');
      return deleteVariant(variantId, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Variant deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
