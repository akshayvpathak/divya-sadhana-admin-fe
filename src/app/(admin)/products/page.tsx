'use client';

import { useState } from 'react';
import { useProducts, useDeleteProduct } from '@/hooks/useProducts';
import { useAllCategories } from '@/hooks/useCategories';
import { Plus, Search, Filter } from 'lucide-react';
import { ClearFiltersButton } from '@/components/common/ClearFiltersButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { DataTable } from '@/components/common/DataTable/DataTable';
import { useProductTableColumns } from '@/hooks/tables/useProductTableColumns';
import { useDebounce } from '@/hooks/useDebounce';
import { DataTablePagination } from '@/components/common/DataTablePagination';
import { productStatusOptions, productPublishedOptions } from '@/components/ui/badges/badge-status';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardBand } from '@/components/ui/card';

export default function ProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sort, setSort] = useState('');
  const [status, setStatus] = useState('all');
  const [published, setPublished] = useState('all');

  // Function to clear all filters
  const clearAllFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setStatus('all');
    setPublished('all');
    setPage(1);
  };

  // Button visible only when any filter is active
  const hasActiveFilters =
    search !== '' ||
    selectedCategory !== 'all' ||
    status !== 'all' ||
    published !== 'all';
  
  // Deletion state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const { data: categories } = useAllCategories();
  const { data, isLoading } = useProducts(page, 10, debouncedSearch, selectedCategory, sort, status, published);
  const { mutate: deleteProduct, isPending: isDeleting } = useDeleteProduct();

  const handleSort = (field: string) => {
    setSort(field);
    setPage(1);
  };

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
        }
      });
    }
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'NA';
    const category = categories?.find(c => c.id === categoryId);
    return category ? category.name : 'NA';
  };

  const columns = useProductTableColumns({
    getCategoryName,
    openDeleteModal,
  });

  return (
    <div className="space-y-6  pb-8">
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
        <CardBand className="flex flex-col items-center justify-between gap-4 border-b border-line md:flex-row">
          <div className="relative max-w-sm flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-moon" />
            <Input
              placeholder="Search Products..."
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
            
            {/* Category Select */}
            <Select 
              value={selectedCategory} 
              onValueChange={(val) => {
                setSelectedCategory((val as string) || 'all');
                setPage(1);
              }}
            >
              <SelectTrigger className="bg-surface w-[160px]">
                <SelectValue placeholder="All Categories">
                  {selectedCategory === 'all' 
                    ? 'All Categories' 
                    : (categories?.find(c => c.id === selectedCategory)?.name || selectedCategory)
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories
                  ?.filter(category => category.isActive !== false || category.id === selectedCategory)
                  ?.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            {/* Status Select */}
            <Select
              value={status}
              onValueChange={(val) => {
                setStatus(val || 'all');
                setPage(1);
              }}
            >
              <SelectTrigger className="bg-surface w-[130px]">
                <SelectValue placeholder="All Statuses">
                  {productStatusOptions.find(o => o.value === status)?.label || 'All Statuses'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {productStatusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Published Select */}
            <Select
              value={published}
              onValueChange={(val) => {
                setPublished(val || 'all');
                setPage(1);
              }}
            >
              <SelectTrigger className="bg-surface w-[140px]">
                <SelectValue placeholder="All Published">
                  {productPublishedOptions.find(o => o.value === published)?.label || 'All Published'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {productPublishedOptions.map((opt) => (
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
          emptyMessage="No products found"
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
        title="Delete Product"
        description="Are you sure you want to delete this product? This action cannot be undone."
        onConfirm={confirmDelete}
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        variant="destructive"
      />
    </div>
  );
}
