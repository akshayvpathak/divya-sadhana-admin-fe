import React from 'react';
import { StatusBadge } from '@/components/ui/status-badge';
import { RowActions } from '@/components/common/RowActions';
import { ColumnConfig } from '@/components/common/DataTable/types';
import { formatINR } from '@/lib/currency';
import { DateTimeCell } from '@/components/common/DateTimeCell';
import { courierPartnerOptions } from '@/schemas/orders.schema';

const PARTNER_LABEL: Record<string, string> = Object.fromEntries(
  courierPartnerOptions.map((o) => [o.value, o.label]),
);

export interface OrderRow {
  id: string;
  order_number: string;
  user?: string | { first_name?: string; last_name?: string } | null;
  status?: string;
  payment_status?: string;
  shipping_status?: string;
  courier_partner?: string | null;
  courier_name?: string | null;
  tracking_number?: string | null;
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
      mobile: 'title',
      mobileLabel: 'Order',
    },
    {
      id: 'user',
      accessorKey: 'user',
      header: 'User',
      sortable: true,
      mobile: 'subtitle',
      renderCell: (row) =>
        typeof row.user === 'string'
          ? row.user
          : row.user?.first_name
            ? `${row.user.first_name} ${row.user.last_name}`
            : 'Unknown',
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: 'Status',
      sortable: true,
      headerAlign: 'center',
      cellAlign: 'center',
      mobile: 'status',
      renderCell: (row) => <StatusBadge status={row.status || ''} type="order_status" />,
    },
    {
      id: 'payment_status',
      accessorKey: 'payment_status',
      header: 'Payment Status',
      sortable: true,
      headerAlign: 'center',
      cellAlign: 'center',
      mobile: 'status',
      renderCell: (row) => (
        <StatusBadge status={row.payment_status || ''} type="payment_status" />
      ),
    },
    {
      id: 'shipping_status',
      accessorKey: 'shipping_status',
      header: 'Shipping',
      sortable: true,
      headerAlign: 'center',
      cellAlign: 'center',
      // A third badge in the card header would crowd it; fulfilment detail sits
      // behind "More details" with the courier and tracking number.
      mobile: 'detail',
      renderCell: (row) => (
        <StatusBadge status={row.shipping_status || ''} type="shipping_status" />
      ),
    },
    {
      id: 'courier',
      header: 'Courier',
      mobile: 'detail',
      renderCell: (row) => {
        const label =
          row.courier_name ||
          PARTNER_LABEL[row.courier_partner || ''] ||
          row.courier_partner ||
          '—';
        return <span className="text-sm text-charcoal">{label}</span>;
      },
    },
    {
      id: 'tracking_number',
      header: 'Tracking',
      mobile: 'detail',
      renderCell: (row) =>
        row.tracking_number ? (
          <span className="font-mono text-xs text-ink">{row.tracking_number}</span>
        ) : (
          <span className="text-moon">—</span>
        ),
    },
    {
      id: 'total_amount',
      accessorKey: 'total_amount',
      header: 'Total Amount',
      sortable: true,
      cellClassName: 'font-medium',
      mobile: 'field',
      mobileLabel: 'Total',
      renderCell: (row) =>
        row.total_amount !== undefined ? formatINR(row.total_amount) : null,
    },
    {
      id: 'created_at',
      accessorKey: 'created_at',
      header: 'Order Date',
      sortable: true,
      cellClassName: 'whitespace-nowrap',
      mobile: 'field',
      mobileLabel: 'Ordered',
      renderCell: (row) => <DateTimeCell value={row.created_at} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      mobile: 'actions',
      headerAlign: 'center',
      cellAlign: 'center',
      renderCell: (row) => (
        <RowActions actions={[{ kind: 'view', href: `/orders/${row.id}` }]} />
      ),
    },
  ];
};
