'use client';

import { useMemo, useState } from 'react';
import { useProducts, useProductsInfinite, useDeleteProduct } from '@/hooks/useProducts';
import { useAllCategories } from '@/hooks/useCategories';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import Link from 'next/link';
import { ResponsiveDataView } from '@/components/common/ResponsiveDataView';
import { ListToolbar, ToolbarFilter } from '@/components/common/ListToolbar';
import { useProductTableColumns } from '@/hooks/tables/useProductTableColumns';
import { useDebounce } from '@/hooks/useDebounce';
import { useListQueryState } from '@/hooks/useListQueryState';
import { useIsCompact } from '@/hooks/useMediaQuery';
import { DataTablePagination } from '@/components/common/DataTablePagination';
import { productStatusOptions, productPublishedOptions } from '@/components/ui/badges/badge-status';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/card';

/** Defaults double as the URL contract: anything at its default stays out of the query. */
const DEFAULTS = { page: 1, search: "", sort: "", category: "all", status: "all", published: "all" };

export default function ProductsPage() {
  // In the URL, so opening a record and coming back keeps the filters, the
  // page and the scroll position.
  const [query, patch] = useListQueryState(DEFAULTS);
  const { page, search, sort, category: selectedCategory, status, published } = query;
  const setPage = (next: number) => patch({ page: next });
  const debouncedSearch = useDebounce(search, 300);

  const clearAllFilters = () => patch({ search: '', category: 'all', status: 'all', published: 'all', page: 1 });

  const hasActiveFilters =
    search !== '' ||
    selectedCategory !== 'all' ||
    status !== 'all' ||
    published !== 'all';

  // Deletion state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const { data: categories } = useAllCategories();

  const isCompact = useIsCompact();
  const { data, isLoading } = useProducts(
    page,
    10,
    debouncedSearch,
    selectedCategory,
    sort,
    status,
    published,
    { enabled: isCompact === false }
  );
  const mobile = useProductsInfinite(
    10,
    debouncedSearch,
    selectedCategory,
    sort,
    status,
    published,
    { enabled: isCompact === true }
  );
  const { mutate: deleteProduct, isPending: isDeleting } = useDeleteProduct();

  const handleSort = (field: string) => patch({ sort: field, page: 1 });

  const openDeleteModal = (id: string) => {
    setProductToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (productToDelete) {
      deleteProduct(productToDelete, {
        onSuccess: () => {
          setIsDeleteModalOpen(false);
          setProductToDelete(null);
        },
      });
    }
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'NA';
    const category = categories?.find((c) => c.id === categoryId);
    return category ? category.name : 'NA';
  };

  const columns = useProductTableColumns({ getCategoryName, openDeleteModal });

  const categoryOptions = useMemo(
    () => [
      { value: 'all', label: 'All Categories' },
      ...(categories ?? [])
        .filter((c) => c.isActive !== false || c.id === selectedCategory)
        .map((c) => ({ value: c.id, label: c.name })),
    ],
    [categories, selectedCategory]
  );

  const toolbarFilters: ToolbarFilter[] = [
    {
      key: 'category',
      label: 'Category',
      value: selectedCategory,
      options: categoryOptions,
      placeholder: 'All Categories',
      widthClass: 'w-[160px]',
      onChange: (val) => patch({ category: val, page: 1 }),
    },
    {
      key: 'status',
      label: 'Status',
      value: status,
      options: productStatusOptions,
      placeholder: 'All Statuses',
      widthClass: 'w-[130px]',
      onChange: (val) => patch({ status: val, page: 1 }),
    },
    {
      key: 'published',
      label: 'Visibility',
      value: published,
      options: productPublishedOptions,
      placeholder: 'All Published',
      widthClass: 'w-[140px]',
      onChange: (val) => patch({ published: val, page: 1 }),
    },
  ];

  return (
    <div className="space-y-5 pb-8 sm:space-y-6">
      <PageHeader
        title="Products"
        actions={
          <Link href="/products/create">
            <Button>
              <Plus className="h-4 w-4" /> Add Product
            </Button>
          </Link>
        }
      />

      <Card>
        <ListToolbar
          search={{
            value: search,
            placeholder: 'Search Products...',
            onChange: (val) => patch({ search: val, page: 1 }),
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
          emptyMessage="No products found"
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
        title="Delete Product"
        description="Are you sure you want to delete this product? This action cannot be undone."
        onConfirm={confirmDelete}
        confirmText={isDeleting ? 'Deleting...' : 'Delete'}
        variant="destructive"
      />
    </div>
  );
}
