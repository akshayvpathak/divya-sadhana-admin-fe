import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

export const useProducts = (page = 1, limit = 10, search = '', categoryId = '') => {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: ['products', { page, limit, search, categoryId }],
    queryFn: async () => {
      if (!accessToken) throw new Error('No access token');
      const response = await getProductsList(accessToken, { page, page_size: limit, search });
      
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
          isActive: p.is_active,
          isPublished: p.is_published,
          image: cleanImageUrl(p.primary_image_url) || `https://picsum.photos/seed/${p.id}/400/400`,
        })),
        meta: {
          total: response.data.count,
          totalPages: Math.ceil(response.data.count / limit),
        }
      };
    },
    enabled: !!accessToken,
  });
};

export const useProduct = (id: string) => {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      if (!accessToken) throw new Error('No access token');
      const p = await getProduct(id, accessToken);
      return {
        id: p.id,
        name: p.name,
        price: p.price,
        description: p.description,
        categoryId: p.category,
        stock: p.stock_quantity,
        sku: p.sku,
        isActive: p.is_active,
        isPublished: p.is_published,
        image: cleanImageUrl(p.primary_image_url) || `https://picsum.photos/seed/${p.id}/400/400`,
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
      return createProduct({
        name: data.name,
        description: data.description,
        sku: data.sku,
        price: data.price,
        stock_quantity: data.stock_quantity,
        is_active: data.is_active,
        is_published: data.is_published,
        primary_image_key: data.image || '',
        category: data.categoryId,
        gallery_image_keys: []
      }, accessToken);
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
      if (data.categoryId !== undefined) updateData.category = data.categoryId;
      if (data.image !== undefined) updateData.primary_image_key = data.image;
      if (data.sku !== undefined) updateData.sku = data.sku;
      if (data.stock_quantity !== undefined) updateData.stock_quantity = data.stock_quantity;
      if (data.is_active !== undefined) updateData.is_active = data.is_active;
      if (data.is_published !== undefined) updateData.is_published = data.is_published;

      return updateProduct(id, updateData, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
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
