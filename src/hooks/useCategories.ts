import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { getCategoriesList, createCategory, updateCategory, deleteCategory, getCategory } from '../services/product-categories.service';
import { useAuth } from '../context/AuthContext';
import { useInfiniteListQuery } from './queries/useInfiniteListQuery';

type ApiCategory = Awaited<ReturnType<typeof getCategoriesList>>['data']['results'][number];

/** The row shape both the desktop table and the mobile cards render. */
const toCategoryRow = (c: ApiCategory) => ({
  id: c.id,
  name: c.name,
  description: c.description,
  isActive: c.is_active,
  image: `https://picsum.photos/seed/${c.id}/400/400`,
});

const isActiveParamFor = (status: string) =>
  status === 'all' ? undefined : status === 'active' ? 'true' : 'false';

export const useCategories = (
  page = 1,
  limit = 10,
  search = '',
  sort = '',
  status = 'all',
  options: { enabled?: boolean } = {}
) => {
  const { accessToken } = useAuth();
  const { enabled = true } = options;
  const isActiveParam = isActiveParamFor(status);
  return useQuery({
    queryKey: ['categories', { page, limit, search, sort, status }],
    queryFn: async () => {
      if (!accessToken) throw new Error('No access token');
      const response = await getCategoriesList({ page, paginate: limit, search, sort, is_active: isActiveParam }, accessToken);
      
      return {
        data: response.data.results.map(toCategoryRow),
        meta: {
          total: response.data.count,
          totalPages: Math.ceil(response.data.count / limit),
        }
      };
    },
    enabled: !!accessToken && enabled,
  });
};

/** Mobile card list: same endpoint and filters, appended page by page. */
export const useCategoriesInfinite = (
  limit = 10,
  search = '',
  sort = '',
  status = 'all',
  options: { enabled?: boolean } = {}
) => {
  const { accessToken } = useAuth();
  const { enabled = true } = options;
  const isActiveParam = isActiveParamFor(status);

  return useInfiniteListQuery({
    queryKey: ['categories', 'infinite', { limit, search, sort, status }],
    pageSize: limit,
    enabled: !!accessToken && enabled,
    fetchPage: async (page) => {
      if (!accessToken) throw new Error('No access token');
      const response = await getCategoriesList(
        { page, paginate: limit, search, sort, is_active: isActiveParam },
        accessToken
      );
      return {
        count: response.data.count,
        results: response.data.results.map(toCategoryRow),
      };
    },
  });
};

export const useAllCategories = () => {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: ['categories', 'all'],
    queryFn: async () => {
      if (!accessToken) throw new Error('No access token');
      // Hack: fetch page 1 with large limit to simulate getAll
      const response = await getCategoriesList({ page: 1, paginate: 100 }, accessToken);
      return response.data.results.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
        isActive: c.is_active,
        image: `https://picsum.photos/seed/${c.id}/400/400`,
      }));
    },
    enabled: !!accessToken,
    staleTime: 30000,
  });
};

export const useCategory = (id: string) => {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: ['category', id],
    queryFn: async () => {
      if (!accessToken) throw new Error('No access token');
      const c = await getCategory(id, accessToken);
      return {
        id: c.id,
        name: c.name,
        description: c.description,
        isActive: c.is_active,
        image: `https://picsum.photos/seed/${c.id}/400/400`,
      };
    },
    enabled: !!id && !!accessToken,
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();

  return useMutation({
    mutationFn: async (data: any) => {
      if (!accessToken) throw new Error('No access token');
      return createCategory({
        name: data.name,
        description: data.description,
        is_active: data.isActive !== undefined ? data.isActive : true,
      }, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      // Also refresh the queries-layer namespace so lists rendered by either
      // hook layer stay in sync (see useCategoriesQuery.ts).
      queryClient.invalidateQueries({ queryKey: ['product-categories'] });
      toast.success('Category created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      if (!accessToken) throw new Error('No access token');
      const updateData: any = {};
      if (data.name !== undefined) {
        updateData.name = data.name;
      }
      if (data.description !== undefined) updateData.description = data.description;
      if (data.isActive !== undefined) updateData.is_active = data.isActive;

      return updateCategory(id, updateData, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      // Also refresh the queries-layer namespace so lists rendered by either
      // hook layer stay in sync (see useCategoriesQuery.ts).
      queryClient.invalidateQueries({ queryKey: ['product-categories'] });
      toast.success('Category updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!accessToken) throw new Error('No access token');
      return deleteCategory(id, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      // Also refresh the queries-layer namespace so lists rendered by either
      // hook layer stay in sync (see useCategoriesQuery.ts).
      queryClient.invalidateQueries({ queryKey: ['product-categories'] });
      toast.success('Category deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
