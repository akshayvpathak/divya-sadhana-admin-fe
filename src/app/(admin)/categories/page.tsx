'use client';

import { useState } from 'react';
import { useCategories, useCategoriesInfinite, useDeleteCategory } from '@/hooks/useCategories';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import Link from 'next/link';
import { ResponsiveDataView } from '@/components/common/ResponsiveDataView';
import { ListToolbar, ToolbarFilter } from '@/components/common/ListToolbar';
import { useCategoryTableColumns } from '@/hooks/tables/useCategoryTableColumns';
import { useDebounce } from '@/hooks/useDebounce';
import { useIsCompact } from '@/hooks/useMediaQuery';
import { DataTablePagination } from '@/components/common/DataTablePagination';
import { categoryStatusOptions } from '@/components/ui/badges/badge-status';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/card';

export default function CategoriesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  // Deletion state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [sort, setSort] = useState('');
  const [status, setStatus] = useState('all');

  const clearAllFilters = () => {
    setSearch('');
    setStatus('all');
    setPage(1);
  };

  const hasActiveFilters = search !== '' || status !== 'all';

  const isCompact = useIsCompact();
  const { data, isLoading } = useCategories(page, 10, debouncedSearch, sort, status, {
    enabled: isCompact === false,
  });
  const mobile = useCategoriesInfinite(10, debouncedSearch, sort, status, {
    enabled: isCompact === true,
  });
  const { mutate: deleteCategory, isPending: isDeleting } = useDeleteCategory();

  const handleSort = (field: string) => {
    setSort(field);
    setPage(1);
  };

  const openDeleteModal = (id: string) => {
    setCategoryToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (categoryToDelete) {
      deleteCategory(categoryToDelete, {
        onSuccess: () => {
          setIsDeleteModalOpen(false);
          setCategoryToDelete(null);
        },
      });
    }
  };

  const columns = useCategoryTableColumns({ openDeleteModal });

  const toolbarFilters: ToolbarFilter[] = [
    {
      key: 'status',
      label: 'Status',
      value: status,
      options: categoryStatusOptions,
      placeholder: 'All Statuses',
      widthClass: 'w-[140px]',
      onChange: (val) => {
        setStatus(val);
        setPage(1);
      },
    },
  ];

  return (
    <div className="space-y-5 pb-8 sm:space-y-6">
      <PageHeader
        title="Categories"
        actions={
          <Link href="/categories/create">
            <Button>
              <Plus className="h-4 w-4" /> Add Category
            </Button>
          </Link>
        }
      />

      <Card>
        <ListToolbar
          search={{
            value: search,
            placeholder: 'Search Categories...',
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
          emptyMessage="No categories found"
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
        title="Delete Category"
        description="Are you sure you want to delete this category? This action cannot be undone."
        onConfirm={confirmDelete}
        confirmText={isDeleting ? 'Deleting...' : 'Delete'}
        variant="destructive"
      />
    </div>
  );
}
