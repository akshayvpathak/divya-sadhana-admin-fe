'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Plus } from 'lucide-react';
import { ClearFiltersButton } from '@/components/common/ClearFiltersButton';
import {
  useServiceBatchesListQuery,
  useDeleteServiceBatchMutation,
} from '@/hooks/queries/useServiceBatchesQuery';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/common/DataTable/DataTable';
import { useServiceBatchTableColumns } from '@/hooks/tables/useServiceBatchTableColumns';
import { useDebounce } from '@/hooks/useDebounce';
import { DataTablePagination } from '@/components/common/DataTablePagination';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardBand } from '@/components/ui/card';

export default function ServiceBatchesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [sort, setSort] = useState('');

  // Button visible when search is active
  const hasActiveFilters = search !== '';

  const clearAllFilters = () => {
    setSearch('');
    setPage(1);
  };

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<string | null>(null);

  const { data, isLoading } = useServiceBatchesListQuery({ page, search: debouncedSearch, ordering: sort });
  const { mutate: deleteBatch, isPending: isDeleting } = useDeleteServiceBatchMutation();

  const openDeleteModal = (id: string) => {
    setBatchToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (batchToDelete) {
      deleteBatch(batchToDelete, {
        onSuccess: () => {
          setIsDeleteModalOpen(false);
          setBatchToDelete(null);
        },
      });
    }
  };

  const handleSort = (field: string) => {
    setSort(field);
    setPage(1);
  };

  const totalPages = data?.data?.count ? Math.ceil(data.data.count / 10) : 1;
  const columns = useServiceBatchTableColumns({ openDeleteModal });

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Service Batches"
        actions={
          <Link href="/service-batches/create">
            <Button>
              <Plus className="h-4 w-4" /> Add Batch
            </Button>
          </Link>
        }
      />

      <Card>
        <CardBand className="flex flex-col items-center justify-between gap-4 border-b border-line md:flex-row">
          <div className="relative w-full max-w-sm flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-moon" />
            <Input
              placeholder="Search batches..."
              className="bg-surface pl-9 w-full"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          {hasActiveFilters && (
            <ClearFiltersButton onClear={clearAllFilters} />
          )}
        </CardBand>

        <DataTable
          columns={columns}
          data={data?.data?.results || []}
          isLoading={isLoading}
          sort={sort}
          onSort={handleSort}
          emptyMessage="No service batches found"
        />

        {data?.data && (
          <DataTablePagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={data.data.count}
            onPageChange={setPage}
          />
        )}
      </Card>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        title="Delete Service Batch"
        description="Are you sure you want to delete this batch? This action cannot be undone."
        onConfirm={confirmDelete}
        confirmText={isDeleting ? 'Deleting...' : 'Delete'}
        variant="destructive"
      />
    </div>
  );
}
