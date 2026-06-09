'use client';

import { useState } from 'react';
import { useProducts, useDeleteProduct } from '@/hooks/useProducts';
import { useAllCategories } from '@/hooks/useCategories';
import { Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { DataTable } from '@/components/common/DataTable/DataTable';
import { useProductTableColumns } from '@/hooks/tables/useProductTableColumns';
import { useDebounce } from '@/hooks/useDebounce';
import { DataTablePagination } from '@/components/common/DataTablePagination';

export default function ProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sort, setSort] = useState('');
  
  // Deletion state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const { data: categories } = useAllCategories();
  const { data, isLoading } = useProducts(page, 10, debouncedSearch, selectedCategory, sort);
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Products</h1>
          <p className="text-slate-500 mt-1">Manage your inventory and pricing</p>
        </div>
        
        <Link href="/products/create">
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row gap-4">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search products..."
              className="pl-9 bg-white"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="w-full sm:w-64 flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400 shrink-0" />
            <Select 
              value={selectedCategory} 
              onValueChange={(val) => {
                setSelectedCategory((val as string) || 'all');
                setPage(1);
              }}
            >
              <SelectTrigger className="bg-white">
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
          </div>
        </div>

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
      </div>

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
