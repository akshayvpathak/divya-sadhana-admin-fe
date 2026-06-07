import React from 'react';
import { StatusBadge } from '@/components/ui/status-badge';
import { ColumnConfig } from '@/components/common/DataTable/types';
import dayjs from 'dayjs';

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
      cellClassName: 'font-medium text-xs text-slate-500',
      renderCell: (row) => row.donation_number || '-',
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
      cellClassName: 'text-slate-600',
      renderCell: (row) => typeof row.campaign === 'string' ? row.campaign : row.campaign?.title || row.campaign_title || 'General',
    },
    {
      id: 'amount',
      accessorKey: 'amount',
      header: 'Amount',
      sortable: true,
      cellClassName: 'font-medium',
      renderCell: (row) => row.amount !== undefined ? `$${row.amount}` : '-',
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
      cellClassName: 'text-slate-500',
      renderCell: (row) => row.paid_at ? dayjs(row.paid_at).format('MMM D, YYYY') : '-',
    },
  ];
};
