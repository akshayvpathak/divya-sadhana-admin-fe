'use client';

import { Button } from '@/components/ui/button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useDeleteUser, useUsers, useUsersInfinite } from '@/hooks/useUsers';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { ResponsiveDataView } from '@/components/common/ResponsiveDataView';
import { ListToolbar, ToolbarFilter } from '@/components/common/ListToolbar';
import { useUserTableColumns } from '@/hooks/tables/useUserTableColumns';
import { useDebounce } from '@/hooks/useDebounce';
import { useIsCompact } from '@/hooks/useMediaQuery';
import { DataTablePagination } from '@/components/common/DataTablePagination';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/card';

const ROLE_OPTIONS = [
  { value: 'all', label: 'All Roles' },
  { value: 'admin', label: 'Admin', group: 'Access' },
  { value: 'customer', label: 'Customer', group: 'Access' },
  { value: 'network_any', label: 'Any network member', group: 'Network' },
  { value: 'trustee', label: 'Trustee', group: 'Network' },
  { value: 'state_executive', label: 'State Executive', group: 'Network' },
  { value: 'district_president', label: 'District President', group: 'Network' },
  { value: 'network_none', label: 'Not a network member', group: 'Network' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sort, setSort] = useState('');

  const clearAllFilters = () => {
    setSearch('');
    setSelectedRole('all');
    setSelectedStatus('all');
    setPage(1);
  };

  const hasActiveFilters =
    search !== '' || selectedRole !== 'all' || selectedStatus !== 'all';

  // Deletion state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const isCompact = useIsCompact();
  const { data, isLoading } = useUsers(
    page,
    10,
    debouncedSearch,
    selectedRole,
    selectedStatus,
    sort,
    { enabled: isCompact === false }
  );
  const mobile = useUsersInfinite(10, debouncedSearch, selectedRole, selectedStatus, sort, {
    enabled: isCompact === true,
  });
  const { mutate: deleteUser, isPending: isDeleting } = useDeleteUser();

  const handleSort = (field: string) => {
    setSort(field);
    setPage(1);
  };

  const openDeleteModal = (id: string) => {
    setUserToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      deleteUser(userToDelete, {
        onSuccess: () => {
          setIsDeleteModalOpen(false);
          setUserToDelete(null);
        },
      });
    }
  };

  const columns = useUserTableColumns({ openDeleteModal });

  const toolbarFilters: ToolbarFilter[] = [
    {
      key: 'role',
      label: 'Role',
      value: selectedRole,
      options: ROLE_OPTIONS,
      placeholder: 'All Roles',
      widthClass: 'w-[200px]',
      onChange: (val) => {
        setSelectedRole(val);
        setPage(1);
      },
    },
    {
      key: 'status',
      label: 'Status',
      value: selectedStatus,
      options: STATUS_OPTIONS,
      placeholder: 'All Statuses',
      widthClass: 'w-[140px]',
      onChange: (val) => {
        setSelectedStatus(val);
        setPage(1);
      },
    },
  ];

  return (
    <div className="space-y-5 pb-8 sm:space-y-6">
      <PageHeader
        title="Users"
        actions={
          <Link href="/users/create">
            <Button>
              <Plus className="h-4 w-4" /> Add User
            </Button>
          </Link>
        }
      />

      <Card>
        <ListToolbar
          search={{
            value: search,
            placeholder: 'Search Users...',
            onChange: (val) => {
              setSearch(val);
              setPage(1);
            },
          }}
          filters={toolbarFilters}
          onClear={clearAllFilters}
          hasActiveFilters={hasActiveFilters}
          sortColumns={columns}
          sort={sort}
          onSort={handleSort}
        />

        <ResponsiveDataView
          columns={columns}
          data={data?.data || []}
          isLoading={isLoading}
          sort={sort}
          onSort={handleSort}
          mobile={mobile}
          emptyMessage="No users found"
          pagination={
            data ? (
              <DataTablePagination
                currentPage={page}
                totalPages={data.meta.totalPages}
                totalItems={data.meta.total}
                onPageChange={setPage}
              />
            ) : null
          }
        />
      </Card>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        title="Delete User"
        description="Are you sure you want to delete this user? This action cannot be undone."
        onConfirm={confirmDelete}
        confirmText={isDeleting ? 'Deleting...' : 'Delete'}
        variant="destructive"
        disabled={isDeleting}
      />
    </div>
  );
}
