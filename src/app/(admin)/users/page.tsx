'use client';

import { Button } from '@/components/ui/button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDeleteUser, useUsers } from '@/hooks/useUsers';
import { Filter, Plus, Search } from 'lucide-react';
import { ClearFiltersButton } from '@/components/common/ClearFiltersButton';
import Link from 'next/link';
import { useState } from 'react';
import { DataTable } from '@/components/common/DataTable/DataTable';
import { useUserTableColumns } from '@/hooks/tables/useUserTableColumns';
import { useDebounce } from '@/hooks/useDebounce';
import { DataTablePagination } from '@/components/common/DataTablePagination';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardBand } from '@/components/ui/card';

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sort, setSort] = useState('');

  // Function to clear all filters
  const clearAllFilters = () => {
    setSearch('');
    setSelectedRole('all');
    setSelectedStatus('all');
    setPage(1);
  };

  // Button visible only when any filter is active
  const hasActiveFilters =
    search !== '' ||
    selectedRole !== 'all' ||
    selectedStatus !== 'all';
  
  // Deletion state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const { data, isLoading } = useUsers(page, 10, debouncedSearch, selectedRole, selectedStatus, sort);
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
        }
      });
    }
  };

  const columns = useUserTableColumns({
    openDeleteModal,
  });

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Users"
        description="Manage platform users and their roles"
        actions={
          <Link href="/users/create">
            <Button>
              <Plus className="h-4 w-4" /> Add User
            </Button>
          </Link>
        }
      />

      <Card>
        <CardBand className="flex flex-col items-center justify-between gap-4 border-b border-line md:flex-row">
          <div className="relative max-w-sm flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-moon" />
            <Input
              placeholder="Search Users..."
              className="pl-9 bg-surface w-full"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center w-full md:w-auto">
            <Filter className="h-4 w-4 text-moon shrink-0" />
            <Select 
              value={selectedRole} 
              onValueChange={(val) => {
                setSelectedRole(val || 'all');
                setPage(1);
              }}
            >
              <SelectTrigger className="bg-surface w-[140px]">
                <SelectValue placeholder="All Roles">
                  {selectedRole === 'admin' ? 'Admin' : selectedRole === 'user' ? 'User' : 'All Roles'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={selectedStatus} 
              onValueChange={(val) => {
                setSelectedStatus(val || 'all');
                setPage(1);
              }}
            >
              <SelectTrigger className="bg-surface w-[140px]">
                <SelectValue placeholder="All Statuses">
                  {selectedStatus === 'active' ? 'Active' : selectedStatus === 'inactive' ? 'Inactive' : 'All Statuses'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <ClearFiltersButton onClear={clearAllFilters} />
            )}
          </div>
        </CardBand>

        <DataTable
          columns={columns}
          data={data?.data || []}
          isLoading={isLoading}
          sort={sort}
          onSort={handleSort}
          emptyMessage="No users found"
        />

        {data && (
          <DataTablePagination
            currentPage={page}
            totalPages={data.meta.totalPages}
            totalItems={data.meta.total}
            onPageChange={setPage}
          />
        )}
      </Card>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        title="Delete User"
        description="Are you sure you want to delete this user? This action cannot be undone."
        onConfirm={confirmDelete}
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        variant="destructive"
        disabled={isDeleting}
      />
    </div>
  );
}
