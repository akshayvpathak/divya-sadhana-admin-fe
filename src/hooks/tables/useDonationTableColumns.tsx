import React from 'react';
import { StatusBadge } from '@/components/ui/status-badge';
import { ColumnConfig } from '@/components/common/DataTable/types';
import { formatINR } from '@/lib/currency';
import { DateTimeCell } from '@/components/common/DateTimeCell';

export interface DonationRow {
  id: string;
  donation_number?: string | null;
  donor_name?: string | null | undefined;
  campaign?: string | { id?: string; title?: string; [key: string]: any } | null | undefined;
  title?: string;
  campaign_title?: string | null;
  amount?: number;
  status?: string;
  paid_at?: string | null;
  [key: string]: any;
}

export const useDonationTableColumns = (): ColumnConfig<DonationRow>[] => {
  return [
    {
      id: 'donation_number',
      accessorKey: 'donation_number',
      header: 'Reference',
      sortable: true,
      cellClassName: 'font-medium text-xs text-moon',
      // null rather than '-' so the table's shared N/A chip stands in.
      renderCell: (row) => row.donation_number || null,
    },
    {
      id: 'donor_name',
      accessorKey: 'donor_name',
      header: 'Donor',
      sortable: true,
    },
    {
      id: 'campaign',
      accessorKey: 'campaign',
      header: 'Campaign',
      sortable: true,
      cellClassName: 'text-charcoal',
      renderCell: (row) => {
        if (row.campaign_title) {
          return row.campaign_title;
        }
        if (row.campaign && typeof row.campaign === 'object') {
          return row.campaign.title || 'General';
        }
        if (typeof row.campaign === 'string') {
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(row.campaign);
          return isUuid ? 'General' : row.campaign;
        }
        return 'General';
      },
    },
    {
      id: 'amount',
      accessorKey: 'amount',
      header: 'Amount',
      sortable: true,
      cellClassName: 'font-semibold tabular-nums',
      renderCell: (row) => (row.amount !== undefined ? formatINR(row.amount) : null),
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: 'Status',
      sortable: true,
      renderCell: (row) => <StatusBadge status={row.status || ''} type="transaction_status" />,
    },
    {
      id: 'paid_at',
      accessorKey: 'paid_at',
      header: 'Date',
      sortable: true,
      cellClassName: 'text-moon whitespace-nowrap',
      renderCell: (row) => <DateTimeCell value={row.paid_at} />,
    },
  ];
};
