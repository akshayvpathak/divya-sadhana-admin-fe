'use client';

import { useState } from 'react';
import { useCategories, useDeleteCategory } from '@/hooks/useCategories';
import { Plus, Search, Filter } from 'lucide-react';
import { ClearFiltersButton } from '@/components/common/ClearFiltersButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import Link from 'next/link';
import { DataTable } from '@/components/common/DataTable/DataTable';
import { useCategoryTableColumns } from '@/hooks/tables/useCategoryTableColumns';
import { useDebounce } from '@/hooks/useDebounce';
import { DataTablePagination } from '@/components/common/DataTablePagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { categoryStatusOptions } from '@/components/ui/badges/badge-status';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardBand } from '@/components/ui/card';

export default function CategoriesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  
  // Deletion state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [sort, setSort] = useState('');
  const [status, setStatus] = useState('all');

  // Function to clear all filters
  const clearAllFilters = () => {
    setSearch('');
    setStatus('all');
    setPage(1);
  };

  // Button visible only when any filter is active
  const hasActiveFilters = search !== '' || status !== 'all';

  const { data, isLoading } = useCategories(page, 10, debouncedSearch, sort, status);
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
        }
      });
    }
  };

  const columns = useCategoryTableColumns({
    openDeleteModal,
  });

  return (
    <div className="space-y-6  pb-8">
      <PageHeader
        title="Categories"
        description="Manage product categories and taxonomy"
        actions={
          <Link href="/categories/create">
            <Button>
              <Plus className="h-4 w-4" /> Add Category
            </Button>
          </Link>
        }
      />

      <Card>
        <CardBand className="flex flex-col items-center justify-between gap-4 border-b border-line md:flex-row">
          <div className="relative max-w-sm flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-moon" />
            <Input
              placeholder="Search Categories..."
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
              value={status}
              onValueChange={(val) => {
                setStatus(val || 'all');
                setPage(1);
              }}
            >
              <SelectTrigger className="bg-surface w-[140px]">
                <SelectValue placeholder="All Statuses">
                  {categoryStatusOptions.find(o => o.value === status)?.label || 'All Statuses'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {categoryStatusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
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
          emptyMessage="No categories found"
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
        title="Delete Category"
        description="Are you sure you want to delete this category? This action cannot be undone."
        onConfirm={confirmDelete}
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        variant="destructive"
      />
    </div>
  );
}
