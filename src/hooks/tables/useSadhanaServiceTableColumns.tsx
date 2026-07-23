import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, Edit2, Trash2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
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
          <div className="relative h-10 w-10 rounded-md overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
            {row.cover_image_url ? (
              <Image src={row.cover_image_url} alt={row.name} fill className="object-cover" unoptimized />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="h-5 w-5 text-slate-300" />
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
      renderCell: (row) => <StatusBadge status={row.category} type="service_category" />,
    },
    {
      id: 'pricing',
      header: 'Pricing',
      cellClassName: 'font-medium text-slate-900',
      renderCell: (row) => priceCell(row),
    },
    {
      id: 'is_active',
      accessorKey: 'is_active',
      header: 'Status',
      sortable: true,
      renderCell: (row) => <StatusBadge status={row.is_active} type="active" />,
    },
    {
      id: 'display_order',
      accessorKey: 'display_order',
      header: 'Order',
      sortable: true,
      cellClassName: 'text-slate-500',
      renderCell: (row) => row.display_order ?? 0,
    },
    {
      id: 'actions',
      header: 'Actions',
      renderCell: (row) => (
        <div>
          <Link href={`/sadhana-services/${row.id}`}>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-indigo-600">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/sadhana-services/${row.id}?mode=edit`}>
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
