'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Plus } from 'lucide-react';
import {
  useSadhanaServicesListQuery,
  useDeleteSadhanaServiceMutation,
} from '@/hooks/queries/useSadhanaServicesQuery';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/common/DataTable/DataTable';
import { useSadhanaServiceTableColumns } from '@/hooks/tables/useSadhanaServiceTableColumns';
import { useDebounce } from '@/hooks/useDebounce';
import { DataTablePagination } from '@/components/common/DataTablePagination';
import { FilterManager, useFilterManager } from '@/components/common/FilterManager';
import { serviceCategoryOptions } from '@/components/ui/badges/badge-status';

export default function SadhanaServicesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [sort, setSort] = useState('');

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);

  const { filters, handleFilterChange, getApiParams } = useFilterManager({ category: 'all' }, () => setPage(1));
  const apiParams = getApiParams();

  const { data, isLoading } = useSadhanaServicesListQuery({
    page,
    search: debouncedSearch,
    category: apiParams.category,
    ordering: sort,
  });
  const { mutate: deleteService, isPending: isDeleting } = useDeleteSadhanaServiceMutation();

  const openDeleteModal = (id: string) => {
    setServiceToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (serviceToDelete) {
      deleteService(serviceToDelete, {
        onSuccess: () => {
          setIsDeleteModalOpen(false);
          setServiceToDelete(null);
        },
      });
    }
  };

  const handleSort = (field: string) => {
    setSort(field);
    setPage(1);
  };

  const totalPages = data?.data?.count ? Math.ceil(data.data.count / 10) : 1;
  const columns = useSadhanaServiceTableColumns({ openDeleteModal });

  const filterConfigs = [
    { key: 'category', placeholder: 'All Categories', options: serviceCategoryOptions, widthClass: 'w-[160px]' },
  ];

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Sadhana Services</h1>
          <p className="mt-1 text-slate-500">Manage seva / anushthan service catalog</p>
        </div>
        <Link href="/sadhana-services/create">
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4" /> Add Service
          </Button>
        </Link>
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 p-4 sm:flex-row">
          <div className="relative w-full max-w-sm flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search services..."
              className="bg-white pl-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <FilterManager configs={filterConfigs} values={filters} onFilterChange={handleFilterChange} />
        </div>

        <DataTable
          columns={columns}
          data={data?.data?.results || []}
          isLoading={isLoading}
          sort={sort}
          onSort={handleSort}
          emptyMessage="No sadhana services found"
        />

        {data?.data && (
          <DataTablePagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={data.data.count}
            onPageChange={setPage}
          />
        )}
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        title="Delete Sadhana Service"
        description="Are you sure you want to delete this service? This action cannot be undone."
        onConfirm={confirmDelete}
        confirmText={isDeleting ? 'Deleting...' : 'Delete'}
        variant="destructive"
      />
    </div>
  );
}
