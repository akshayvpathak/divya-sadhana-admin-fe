import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, Edit2, Trash2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { ColumnConfig } from '@/components/common/DataTable/types';

export interface ProductRow {
  id: string;
  name: string | null;
  description: string | null;
  image?: string | null;
  categoryId: string | null;
  price: number;
  stock: number;
  is_active: boolean;
  is_published: boolean;
}

interface UseProductTableColumnsProps {
  getCategoryName: (categoryId: string | null) => string;
  openDeleteModal: (id: string) => void;
}

export const useProductTableColumns = ({
  getCategoryName,
  openDeleteModal,
}: UseProductTableColumnsProps): ColumnConfig<ProductRow>[] => {
  return [
    {
      id: 'name',
      accessorKey: 'name',
      header: 'Product',
      sortable: true,
      renderCell: (row) => (
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 rounded-md overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
            {row.image ? (
              <Image 
                src={row.image} 
                alt={row.name || ''}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <Package className="h-5 w-5" />
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-medium">{row.name}</span>
            <span className="text-xs text-slate-500 max-w-[150px] truncate">
              {row.description}
            </span>
          </div>
        </div>
      ),
    },
    {
      id: 'category',
      accessorKey: 'categoryId',
      header: 'Category',
      sortable: true,
      sortKey: 'category',
      renderCell: (row) => (
        <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs">
          {getCategoryName(row.categoryId)}
        </span>
      ),
    },
    {
      id: 'price',
      accessorKey: 'price',
      header: 'Price',
      sortable: true,
      cellClassName: 'font-medium text-slate-900',
      renderCell: (row) => `$${row.price.toFixed(2)}`,
    },
    {
      id: 'stock',
      accessorKey: 'stock',
      header: 'Stock',
      sortable: true,
      sortKey: 'stock_quantity',
      renderCell: (row) => (
        <span className={`text-xs font-bold ${row.stock <= 10 ? 'text-rose-600' : 'text-slate-600'}`}>
          {row.stock}
        </span>
      ),
    },
    {
      id: 'is_active',
      accessorKey: 'is_active',
      header: 'Status',
      sortable: true,
      sortKey: 'is_active',
      renderCell: (row) => <StatusBadge status={row.is_active} type="active" />,
    },
    {
      id: 'is_published',
      accessorKey: 'is_published',
      header: 'Published',
      sortable: true,
      sortKey: 'is_published',
      renderCell: (row) => <StatusBadge status={row.is_published} type="published" />,
    },
    {
      id: 'actions',
      header: 'Actions',
      renderCell: (row) => (
        <div>
          <Link href={`/products/${row.id}?mode=view`}>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-slate-400 hover:text-indigo-600"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/products/${row.id}?mode=edit`}>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-indigo-600">
              <Edit2 className="h-4 w-4" />
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => openDeleteModal(row.id)} 
            className="text-slate-400 hover:text-rose-600"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];
};
