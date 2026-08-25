import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { getUsersList, getUser, createUser, updateUser, deleteUser } from '../services/users.service';
import { useAuth } from '../context/AuthContext';
import { useInfiniteListQuery } from './queries/useInfiniteListQuery';

type ApiUser = Awaited<ReturnType<typeof getUsersList>>['data']['results'][number];

const NETWORK_ROLE_BADGE: Record<string, string> = {
  trustee: 'bg-tint text-gold-press border-gold/25',
  state_executive: 'bg-plum-tint text-plum-ink border-plum/25',
  district_president: 'bg-success-tint text-success-ink border-success/25',
};

/** Display label for the ROLE column / detail badge. */
export function userRoleLabel(u: {
  is_superuser?: boolean;
  network_role?: string | null;
  network_role_display?: string | null;
}): string {
  if (u.network_role_display) return u.network_role_display;
  if (u.network_role) return u.network_role.replace(/_/g, ' ');
  if (u.is_superuser) return 'Admin';
  return 'User';
}

export function userRoleBadgeClass(networkRole?: string | null): string | null {
  if (!networkRole) return null;
  return NETWORK_ROLE_BADGE[networkRole] ?? null;
}

/** The row shape both the desktop table and the mobile cards render. */
const toUserRow = (u: ApiUser) => ({
  id: u.id,
  // Trim: a user with no names would otherwise yield a lone space,
  // which renders as a blank cell rather than as missing data.
  name: `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim(),
  email: u.email,
  is_superuser: !!u.is_superuser,
  network_role: u.network_role ?? null,
  network_role_display: u.network_role_display ?? null,
  referral_code: u.referral_code ?? null,
  roleLabel: userRoleLabel(u),
  is_active: u.is_active,
  createdAt: new Date().toISOString(), // Mocking date since it's missing in new API
});

/**
 * Map the role dropdown value to API query params.
 * Access filters use is_superuser; network filters use network_role.
 */
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
const userListParams = (
  page: number,
  limit: number,
  search: string,
  role: string,
  status: string,
  sort: string
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
): any => {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const apiParams: any = { page, paginate: limit, search };

  if (role === 'admin') {
    apiParams.is_superuser = true;
  } else if (role === 'customer') {
    apiParams.is_superuser = false;
  } else if (role === 'network_any') {
    apiParams.network_role = 'any';
  } else if (role === 'trustee') {
    apiParams.network_role = 'trustee';
  } else if (role === 'state_executive') {
    apiParams.network_role = 'state_executive';
  } else if (role === 'district_president') {
    apiParams.network_role = 'district_president';
  } else if (role === 'network_none') {
    apiParams.network_role = 'none';
  }
  // legacy 'user' maps to customer for any stale state
  else if (role === 'user') {
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

  return apiParams;
};

export const useUsers = (
  page = 1,
  limit = 10,
  search = '',
  role = 'all',
  status = 'all',
  sort = '',
  options: { enabled?: boolean } = {}
) => {
  const { accessToken } = useAuth();
  const { enabled = true } = options;
  return useQuery({
    queryKey: ['users', { page, limit, search, role, status, sort }],
    queryFn: async () => {
      if (!accessToken) throw new Error('No access token');

      const response = await getUsersList(
        userListParams(page, limit, search, role, status, sort),
        accessToken
      );

      return {
        data: response.data.results.map(toUserRow),
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
export const useUsersInfinite = (
  limit = 10,
  search = '',
  role = 'all',
  status = 'all',
  sort = '',
  options: { enabled?: boolean } = {}
) => {
  const { accessToken } = useAuth();
  const { enabled = true } = options;

  return useInfiniteListQuery({
    queryKey: ['users', 'infinite', { limit, search, role, status, sort }],
    pageSize: limit,
    enabled: !!accessToken && enabled,
    fetchPage: async (page) => {
      if (!accessToken) throw new Error('No access token');
      const response = await getUsersList(
        userListParams(page, limit, search, role, status, sort),
        accessToken
      );
      return {
        count: response.data.count,
        results: response.data.results.map(toUserRow),
      };
    },
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
        name: `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim(),
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        is_superuser: !!user.is_superuser,
        network_role: user.network_role ?? null,
        network_role_display: user.network_role_display ?? null,
        referral_code: user.referral_code ?? null,
        roleLabel: userRoleLabel(user),
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
