import React from 'react';
import Image from 'next/image';
import { Image as ImageIcon } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';
import { RowActions } from '@/components/common/RowActions';
import { ColumnConfig } from '@/components/common/DataTable/types';
import { formatINR } from '@/lib/currency';

export interface SadhanaServiceRow {
  id: string;
  cover_image_url?: string | null;
  name: string;
  category: string;
  is_active: boolean;
  display_order?: number;
  pricing_options?: { amount: number; currency?: string }[];
}

function priceCell(row: SadhanaServiceRow): string {
  const opts = row.pricing_options ?? [];
  if (opts.length === 0) return '-';
  const min = Math.min(...opts.map((o) => Number(o.amount)));
  return opts.length > 1 ? `${formatINR(min)}+` : formatINR(min);
}

interface Props {
  openDeleteModal: (id: string) => void;
}

export const useSadhanaServiceTableColumns = ({
  openDeleteModal,
}: Props): ColumnConfig<SadhanaServiceRow>[] => {
  return [
    {
      id: 'name',
      accessorKey: 'name',
      header: 'Service',
      sortable: true,
      renderCell: (row) => (
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 rounded-md overflow-hidden bg-cosmos shrink-0 border border-line">
            {row.cover_image_url ? (
              <Image src={row.cover_image_url} alt={row.name} fill className="object-cover" unoptimized />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="h-5 w-5 text-line" />
              </div>
            )}
          </div>
          <span className="font-medium max-w-[260px] truncate">{row.name}</span>
        </div>
      ),
    },
    {
      id: 'category',
      accessorKey: 'category',
      header: 'Category',
      sortable: true,
      headerAlign: 'center',
      cellAlign: 'center',
      renderCell: (row) => <StatusBadge status={row.category} type="service_category" />,
    },
    {
      id: 'pricing',
      header: 'Pricing',
      cellClassName: 'font-medium text-ink',
      renderCell: (row) => priceCell(row),
    },
    {
      id: 'is_active',
      accessorKey: 'is_active',
      header: 'Status',
      sortable: true,
      headerAlign: 'center',
      cellAlign: 'center',
      renderCell: (row) => <StatusBadge status={row.is_active} type="active" />,
    },
    {
      id: 'display_order',
      accessorKey: 'display_order',
      header: 'Order',
      sortable: true,
      cellClassName: 'text-moon',
      renderCell: (row) => row.display_order ?? 0,
    },
    {
      id: 'actions',
      header: 'Actions',
      headerAlign: 'center',
      cellAlign: 'center',
      renderCell: (row) => (
        <RowActions
          actions={[
            { kind: 'view', href: `/sadhana-services/${row.id}` },
            { kind: 'edit', href: `/sadhana-services/${row.id}?mode=edit` },
            { kind: 'delete', onClick: () => openDeleteModal(row.id) },
          ]}
        />
      ),
    },
  ];
};
