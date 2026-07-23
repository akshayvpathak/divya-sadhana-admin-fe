'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Plus } from 'lucide-react';
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

export default function ServiceBatchesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [sort, setSort] = useState('');

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
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Service Batches</h1>
          <p className="mt-1 text-slate-500">Schedule batches for class-type services</p>
        </div>
        <Link href="/service-batches/create">
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4" /> Add Batch
          </Button>
        </Link>
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-4 border-b border-slate-200 bg-slate-50 p-4">
          <div className="relative w-full max-w-sm flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search batches..."
              className="bg-white pl-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

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
      </div>

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
