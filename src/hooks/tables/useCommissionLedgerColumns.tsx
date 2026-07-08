import React from 'react';
import dayjs from 'dayjs';
import { StatusBadge } from '@/components/ui/status-badge';
import { ModuleStatus } from '@/components/ui/badges/ModuleStatus';
import { ColumnConfig } from '@/components/common/DataTable/types';
import { CommissionEntry } from '@/schemas/trustees.schema';
import { formatINR } from '@/lib/currency';

function resolveOrderLabel(row: CommissionEntry): string {
  if (row.order_number) return row.order_number;
  const order = row.order as unknown;
  if (typeof order === 'string') return order;
  if (order && typeof order === 'object') {
    const o = order as Record<string, unknown>;
    return (o.order_number as string) || (o.number as string) || (o.id as string) || '—';
  }
  return '—';
}

export const useCommissionLedgerColumns = (): ColumnConfig<CommissionEntry>[] => {
  return [
    {
      id: 'order',
      header: 'Order',
      cellClassName: 'font-mono text-xs text-slate-700',
      renderCell: (row) => resolveOrderLabel(row),
    },
    {
      id: 'kind',
      accessorKey: 'kind',
      header: 'Kind',
      cellClassName: 'text-slate-700',
      renderCell: (row) => row.kind ? <StatusBadge status={row.kind} /> : '—',
    },
    {
      id: 'amount',
      accessorKey: 'amount',
      header: 'Amount',
      headerAlign: 'right',
      cellAlign: 'right',
      cellClassName: 'font-medium text-slate-900',
      renderCell: (row) => formatINR(row.amount),
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: 'Status',
      renderCell: (row) => <ModuleStatus status={row.status} module="commission" />,
    },
    {
      id: 'matures_at',
      accessorKey: 'matures_at',
      header: 'Unlocks',
      cellClassName: 'text-slate-500 text-sm',
      renderCell: (row) =>
        row.matures_at ? dayjs(row.matures_at).format('MMM D, YYYY') : '—',
    },
  ];
};
