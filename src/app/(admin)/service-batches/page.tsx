'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import {
  useServiceBatchesListQuery,
  useServiceBatchesInfiniteQuery,
  useDeleteServiceBatchMutation,
} from '@/hooks/queries/useServiceBatchesQuery';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Button } from '@/components/ui/button';
import { ResponsiveDataView } from '@/components/common/ResponsiveDataView';
import { ListToolbar } from '@/components/common/ListToolbar';
import { useServiceBatchTableColumns } from '@/hooks/tables/useServiceBatchTableColumns';
import { useDebounce } from '@/hooks/useDebounce';
import { useListQueryState } from '@/hooks/useListQueryState';
import { useIsCompact } from '@/hooks/useMediaQuery';
import { DataTablePagination } from '@/components/common/DataTablePagination';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/card';

/** Defaults double as the URL contract: anything at its default stays out of the query. */
const DEFAULTS = { page: 1, search: "", sort: "" };

export default function ServiceBatchesPage() {
  // In the URL, so opening a record and coming back keeps the filters, the
  // page and the scroll position.
  const [query, patch] = useListQueryState(DEFAULTS);
  const { page, search, sort } = query;
  const setPage = (next: number) => patch({ page: next });
  const debouncedSearch = useDebounce(search, 300);

  const hasActiveFilters = search !== '';

  const clearAllFilters = () => patch({ search: '', page: 1 });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<string | null>(null);

  const queryFilters = useMemo(
    () => ({ search: debouncedSearch, ordering: sort }),
    [debouncedSearch, sort]
  );

  const isCompact = useIsCompact();
  const { data, isLoading } = useServiceBatchesListQuery(
    { ...queryFilters, page },
    { enabled: isCompact === false }
  );
  const mobile = useServiceBatchesInfiniteQuery(queryFilters, { enabled: isCompact === true });
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

  const handleSort = (field: string) => patch({ sort: field, page: 1 });

  const totalPages = data?.data?.count ? Math.ceil(data.data.count / 10) : 1;
  const columns = useServiceBatchTableColumns({ openDeleteModal });

  return (
    <div className="space-y-5 pb-8 sm:space-y-6">
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
        <ListToolbar
          search={{
            value: search,
            placeholder: 'Search batches...',
            onChange: (val) => patch({ search: val, page: 1 }),
          }}
          onClear={clearAllFilters}
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
          emptyMessage="No service batches found"
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
        title="Delete Service Batch"
        description="Are you sure you want to delete this batch? This action cannot be undone."
        onConfirm={confirmDelete}
        confirmText={isDeleting ? 'Deleting...' : 'Delete'}
        variant="destructive"
      />
    </div>
  );
}
