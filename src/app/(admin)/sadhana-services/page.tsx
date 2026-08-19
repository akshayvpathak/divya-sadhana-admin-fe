'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import {
  useSadhanaServicesListQuery,
  useSadhanaServicesInfiniteQuery,
  useDeleteSadhanaServiceMutation,
} from '@/hooks/queries/useSadhanaServicesQuery';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Button } from '@/components/ui/button';
import { ResponsiveDataView } from '@/components/common/ResponsiveDataView';
import { ListToolbar, ToolbarFilter } from '@/components/common/ListToolbar';
import { useSadhanaServiceTableColumns } from '@/hooks/tables/useSadhanaServiceTableColumns';
import { useDebounce } from '@/hooks/useDebounce';
import { useIsCompact } from '@/hooks/useMediaQuery';
import { DataTablePagination } from '@/components/common/DataTablePagination';
import { useFilterManager } from '@/components/common/FilterManager';
import { serviceCategoryOptions } from '@/components/ui/badges/badge-status';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/card';

export default function SadhanaServicesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [sort, setSort] = useState('');

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);

  const {
    filters,
    handleFilterChange,
    getApiParams,
    resetFilters,
    hasActiveFilters: filterManagerActive,
  } = useFilterManager({ category: 'all' }, () => setPage(1));

  const apiParams = getApiParams();
  const hasActiveFilters = search !== '' || filterManagerActive;

  const queryFilters = useMemo(
    () => ({ search: debouncedSearch, category: apiParams.category, ordering: sort }),
    [debouncedSearch, apiParams.category, sort]
  );

  const isCompact = useIsCompact();
  const { data, isLoading } = useSadhanaServicesListQuery(
    { ...queryFilters, page },
    { enabled: isCompact === false }
  );
  const mobile = useSadhanaServicesInfiniteQuery(queryFilters, {
    enabled: isCompact === true,
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

  const toolbarFilters: ToolbarFilter[] = [
    {
      key: 'category',
      label: 'Category',
      value: filters.category,
      options: serviceCategoryOptions,
      placeholder: 'All Categories',
      widthClass: 'w-[160px]',
      onChange: (val) => handleFilterChange('category', val),
    },
  ];

  return (
    <div className="space-y-5 pb-8 sm:space-y-6">
      <PageHeader
        title="Sadhana Services"
        actions={
          <Link href="/sadhana-services/create">
            <Button>
              <Plus className="h-4 w-4" /> Add Service
            </Button>
          </Link>
        }
      />

      <Card>
        <ListToolbar
          search={{
            value: search,
            placeholder: 'Search services...',
            onChange: (val) => {
              setSearch(val);
              setPage(1);
            },
          }}
          filters={toolbarFilters}
          onClear={() => {
            resetFilters();
            setSearch('');
            setPage(1);
          }}
          hasActiveFilters={hasActiveFilters}
          sortColumns={columns}
          sort={sort}
          onSort={handleSort}
        />

        <ResponsiveDataView
          columns={columns}
          data={data?.data?.results || []}
          isLoading={isLoading}
          sort={sort}
          onSort={handleSort}
          mobile={mobile}
          emptyMessage="No sadhana services found"
          pagination={
            data?.data ? (
              <DataTablePagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={data.data.count}
                onPageChange={setPage}
              />
            ) : null
          }
        />
      </Card>

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
