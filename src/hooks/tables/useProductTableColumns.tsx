import React from 'react';
import Image from 'next/image';
import { Package } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';
import { RowActions } from '@/components/common/RowActions';
import { ColumnConfig } from '@/components/common/DataTable/types';
import { formatINR } from '@/lib/currency';

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
          <div className="relative h-10 w-10 rounded-md overflow-hidden bg-cosmos shrink-0 border border-line">
            {row.image ? (
              <Image 
                src={row.image} 
                alt={row.name || ''}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-moon">
                <Package className="h-5 w-5" />
              </div>
            )}
          </div>
          <div className="flex flex-col max-w-[250px]">
            <span className="font-medium truncate">{row.name}</span>
            <span 
              className="text-xs text-moon overflow-hidden whitespace-nowrap text-ellipsis [&>*]:inline"
              dangerouslySetInnerHTML={{ __html: row.description || '' }}
            />
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
      // Plain text, no chip.
      renderCell: (row) => getCategoryName(row.categoryId) || null,
    },
    {
      id: 'price',
      accessorKey: 'price',
      header: 'Price',
      sortable: true,
      cellClassName: 'font-medium text-ink',
      renderCell: (row) => formatINR(row.price),
    },
    {
      id: 'stock',
      accessorKey: 'stock',
      header: 'Stock',
      sortable: true,
      sortKey: 'stock_quantity',
      renderCell: (row) => (
        <span className={`text-xs font-bold ${row.stock <= 10 ? 'text-danger' : 'text-charcoal'}`}>
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
      headerAlign: 'center',
      cellAlign: 'center',
      renderCell: (row) => <StatusBadge status={row.is_active} type="active" />,
    },
    {
      id: 'is_published',
      accessorKey: 'is_published',
      header: 'Published',
      sortable: true,
      sortKey: 'is_published',
      headerAlign: 'center',
      cellAlign: 'center',
      renderCell: (row) => <StatusBadge status={row.is_published} type="published" />,
    },
    {
      id: 'actions',
      header: 'Actions',
      headerAlign: 'center',
      cellAlign: 'center',
      renderCell: (row) => (
        <RowActions
          actions={[
            { kind: 'view', href: `/products/${row.id}?mode=view` },
            { kind: 'edit', href: `/products/${row.id}?mode=edit` },
            { kind: 'delete', onClick: () => openDeleteModal(row.id) },
          ]}
        />
      ),
    },
  ];
};
