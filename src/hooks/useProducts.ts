import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { getProductsList, createProduct, updateProduct, deleteProduct, getProduct } from '../services/products.service';
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

export const useProducts = (page = 1, limit = 10, search = '', categoryId = '', sort = '') => {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: ['products', { page, limit, search, categoryId, sort }],
    queryFn: async () => {
      if (!accessToken) throw new Error('No access token');
      const response = await getProductsList(accessToken, { page, page_size: limit, search, sort });
      
      // If categoryId is present we would ideally pass it to the API, but `getProductsList` doesn't support it directly in params here yet, or we'd filter locally if needed. Assuming the API handles the basic search/page at least.
      let results = response.data.results;
      if (categoryId && categoryId !== 'all') {
        results = results.filter(p => p.category === categoryId);
      }

      return {
        data: results.map(p => ({
          id: p.id,
          name: p.name,
          price: p.price,
          description: p.description,
          categoryId: p.category,
          stock: p.stock_quantity,
          is_active: p.is_active,
          is_published: p.is_published,
          image: resolveProductImageUrl(p.primary_image_url || p.primary_image_key) || `https://picsum.photos/seed/${p.id}/400/400`,
        })),
        meta: {
          total: response.data.count,
          totalPages: Math.ceil(response.data.count / limit),
        }
      };
    },
    enabled: !!accessToken,
    staleTime: 5000,
    placeholderData: keepPreviousData,
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
        gallery_image_keys: (data.gallery_image_keys || []).map((k: string) => extractImageKey(k))
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
