import React from 'react';
import Link from 'next/link';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { ColumnConfig } from '@/components/common/DataTable/types';
import { formatINR } from '@/lib/currency';
import dayjs from 'dayjs';

export interface PaymentRow {
  id: string;
  internal_payment_ref?: string;
  user?: string | { first_name?: string; last_name?: string; [key: string]: any } | null;
  provider?: string | null;
  amount?: string | number;
  status?: string;
  created_at?: string | null;
  [key: string]: any;
}

export const usePaymentTableColumns = (): ColumnConfig<PaymentRow>[] => {
  return [
    {
      id: 'internal_payment_ref',
      accessorKey: 'internal_payment_ref',
      header: 'Reference',
      sortable: true,
      cellClassName: 'font-medium text-slate-500 text-xs',
    },
    {
      id: 'user',
      accessorKey: 'user',
      header: 'User',
      sortable: true,
      renderCell: (row) => typeof row.user === 'string' ? row.user : row.user?.first_name ? `${row.user.first_name} ${row.user.last_name}` : 'Unknown',
    },
    {
      id: 'provider',
      accessorKey: 'provider',
      header: 'Provider',
      sortable: true,
      renderCell: (row) => (
        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">
          {row.provider || 'N/A'}
        </span>
      ),
    },
    {
      id: 'amount',
      accessorKey: 'amount',
      header: 'Amount',
      sortable: true,
      cellClassName: 'font-medium',
      renderCell: (row) => row.amount !== undefined ? formatINR(row.amount) : '-',
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: 'Status',
      sortable: true,
      renderCell: (row) => <StatusBadge status={row.status || ''} type="transaction_status" />,
    },
    {
      id: 'created_at',
      accessorKey: 'created_at',
      header: 'Date',
      sortable: true,
      cellClassName: 'text-slate-500',
      renderCell: (row) => row.created_at ? dayjs(row.created_at).format('MMM D, YYYY') : '-',
    },
    {
      id: 'actions',
      header: 'Actions',
      renderCell: (row) => (
        <div>
          <Link href={`/payments/${row.id}`}>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-indigo-600">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      ),
    },
  ];
};
