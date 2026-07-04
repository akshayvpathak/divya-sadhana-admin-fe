import React from 'react';
import Link from 'next/link';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { ColumnConfig } from '@/components/common/DataTable/types';
import { formatINR } from '@/lib/currency';
import dayjs from 'dayjs';

export interface OrderRow {
  id: string;
  order_number: string;
  user?: string | { first_name?: string; last_name?: string } | null;
  status?: string;
  payment_status?: string;
  shipping_status?: string;
  total_amount?: number;
  created_at?: string;
}

export const useOrderTableColumns = (): ColumnConfig<OrderRow>[] => {
  return [
    {
      id: 'order_number',
      accessorKey: 'order_number',
      header: 'Order Number',
      sortable: true,
      cellClassName: 'font-medium',
    },
    {
      id: 'user',
      accessorKey: 'user',
      header: 'User',
      sortable: true,
      renderCell: (row) => typeof row.user === 'string' ? row.user : row.user?.first_name ? `${row.user.first_name} ${row.user.last_name}` : 'Unknown',
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: 'Status',
      sortable: true,
      renderCell: (row) => <StatusBadge status={row.status || ''} type="order_status" />,
    },
    {
      id: 'payment_status',
      accessorKey: 'payment_status',
      header: 'Payment Status',
      sortable: true,
      renderCell: (row) => <StatusBadge status={row.payment_status || ''} type="payment_status" />,
    },
    {
      id: 'shipping_status',
      accessorKey: 'shipping_status',
      header: 'Shipping Status',
      sortable: true,
      renderCell: (row) => <StatusBadge status={row.shipping_status || ''} type="shipping_status" />,
    },
    {
      id: 'total_amount',
      accessorKey: 'total_amount',
      header: 'Total Amount',
      sortable: true,
      cellClassName: 'font-medium',
      renderCell: (row) => row.total_amount !== undefined ? formatINR(row.total_amount) : '-',
    },
    {
      id: 'created_at',
      accessorKey: 'created_at',
      header: 'Order Date', // Renamed "Created" to "Order Date"
      sortable: true,
      cellClassName: 'text-slate-500',
      renderCell: (row) => row.created_at ? dayjs(row.created_at).format('MMM D, YYYY') : '-',
    },
    {
      id: 'actions',
      header: 'Actions',
      renderCell: (row) => (
        <div>
          <Link href={`/orders/${row.id}`}>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-indigo-600">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      ),
    },
  ];
};
