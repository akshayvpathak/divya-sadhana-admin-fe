import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { getUsersList, getUser, createUser, updateUser, deleteUser } from '../services/users.service';
import { useAuth } from '../context/AuthContext';

export const useUsers = (page = 1, limit = 10, search = '', role = 'all', status = 'all', sort = '') => {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: ['users', { page, limit, search, role, status, sort }],
    queryFn: async () => {
      if (!accessToken) throw new Error('No access token');
      
      const apiParams: any = { page, paginate: limit, search };
      
      if (role === 'admin') {
        apiParams.is_superuser = true;
      } else if (role === 'user') {
        apiParams.is_superuser = false;
      }

      if (status === 'active') {
        apiParams.is_active = true;
      } else if (status === 'inactive') {
        apiParams.is_active = false;
      }

      if (sort) {
        apiParams.sort = sort;
      }

      const response = await getUsersList(apiParams, accessToken);
      
      return {
        data: response.data.results.map(u => ({
          id: u.id,
          name: `${u.first_name} ${u.last_name}`,
          email: u.email,
          role: u.is_superuser ? 'admin' : 'user',
          is_active: u.is_active,
          createdAt: new Date().toISOString(), // Mocking date since it's missing in new API
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

export const useUser = (id: string | null) => {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      if (!accessToken || !id) throw new Error('Missing required data');
      const user = await getUser(id, accessToken);
      return {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.is_superuser ? 'admin' : 'user',
        is_active: user.is_active,
      };
    },
    enabled: !!accessToken && !!id,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();

  return useMutation({
    mutationFn: async (data: any) => {
      if (!accessToken) throw new Error('No access token');
      return createUser({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email,
        is_active: data.is_active !== undefined ? data.is_active : true,
      }, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      if (!accessToken) throw new Error('No access token');
      
      const payload: any = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        is_active: data.is_active,
      };

      return updateUser(id, payload, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!accessToken) throw new Error('No access token');
      return deleteUser(id, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
