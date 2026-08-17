import React from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/ui/status-badge';
import { RowActions } from '@/components/common/RowActions';
import { ColumnConfig } from '@/components/common/DataTable/types';
import { formatINR } from '@/lib/currency';
import { DateTimeCell } from '@/components/common/DateTimeCell';

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface PaymentRow {
  id: string;
  internal_payment_ref?: string;
  user?: string | { first_name?: string; last_name?: string; [key: string]: any } | null;
  provider?: string | null;
  amount?: string | number;
  status?: string;
  created_at?: string | null;
  order?: string | { id?: string; order_number?: string; [key: string]: any } | null;
  donation?: string | { id?: string; donation_number?: string; [key: string]: any } | null;
  [key: string]: any;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export const usePaymentTableColumns = (): ColumnConfig<PaymentRow>[] => {
  return [
    {
      id: 'internal_payment_ref',
      accessorKey: 'internal_payment_ref',
      header: 'Reference',
      sortable: true,
      cellClassName: 'font-medium text-moon text-xs',
    },
    {
      id: 'user',
      accessorKey: 'user',
      header: 'User',
      sortable: true,
      renderCell: (row) => typeof row.user === 'string' ? row.user : row.user?.first_name ? `${row.user.first_name} ${row.user.last_name}` : 'Unknown',
    },
    {
      id: 'association',
      header: 'Linked To',
      renderCell: (row) => {
        if (row.order) {
          const orderId = typeof row.order === 'object' ? row.order.id : row.order;
          const orderNum = typeof row.order === 'object' ? row.order.order_number : null;
          return (
            <Link href={`/orders/${orderId}`} className="text-gold-press hover:text-ink font-medium hover:underline">
              Order {orderNum ? `#${orderNum}` : ''}
            </Link>
          );
        }
        if (row.donation) {
          const donationNum = typeof row.donation === 'object' ? row.donation.donation_number : null;
          return (
            <span className="text-charcoal font-medium">
              Donation {donationNum ? `#${donationNum}` : ''}
            </span>
          );
        }
        return <span className="text-moon italic">None</span>;
      }
    },
    {
      id: 'provider',
      accessorKey: 'provider',
      header: 'Provider',
      sortable: true,
      cellClassName: 'capitalize',
      // Plain text, no chip. Returning null (not 'N/A') lets the table's shared
      // N/A chip stand in for a missing provider.
      renderCell: (row) => row.provider || null,
    },
    {
      id: 'amount',
      accessorKey: 'amount',
      header: 'Amount',
      sortable: true,
      cellClassName: 'font-medium',
      renderCell: (row) => (row.amount !== undefined ? formatINR(row.amount) : null),
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: 'Status',
      sortable: true,
      headerAlign: 'center',
      cellAlign: 'center',
      renderCell: (row) => <StatusBadge status={row.status || ''} type="transaction_status" />,
    },
    {
      id: 'created_at',
      accessorKey: 'created_at',
      header: 'Date',
      sortable: true,
      cellClassName: 'whitespace-nowrap',
      renderCell: (row) => <DateTimeCell value={row.created_at} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      headerAlign: 'center',
      cellAlign: 'center',
      renderCell: (row) => (
        <RowActions actions={[{ kind: 'view', href: `/payments/${row.id}` }]} />
      ),
    },
  ];
};
