import React from 'react';
import { DateTimeCell } from '@/components/common/DateTimeCell';
import { StatusBadge } from '@/components/ui/status-badge';
import { ModuleStatus } from '@/components/ui/badges/ModuleStatus';
import { ColumnConfig } from '@/components/common/DataTable/types';
import { CommissionEntry } from '@/schemas/trustees.schema';
import { formatINR } from '@/lib/currency';

function resolveOrderLabel(row: CommissionEntry): string {
  const anyRow = row as CommissionEntry & {
    source_reference?: string | null;
    source_kind?: string | null;
  };
  if (anyRow.source_reference) return anyRow.source_reference;
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
      header: 'Source',
      cellClassName: 'font-mono text-xs text-charcoal',
      renderCell: (row) => resolveOrderLabel(row),
    },
    {
      id: 'kind',
      accessorKey: 'kind',
      header: 'Kind',
      headerAlign: 'center',
      cellAlign: 'center',
      cellClassName: 'text-charcoal',
      renderCell: (row) => (row.kind ? <StatusBadge status={row.kind} /> : null),
    },
    {
      id: 'amount',
      accessorKey: 'amount',
      header: 'Amount',
      headerAlign: 'right',
      cellAlign: 'right',
      cellClassName: 'font-medium text-ink',
      renderCell: (row) => formatINR(row.amount),
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: 'Status',
      headerAlign: 'center',
      cellAlign: 'center',
      renderCell: (row) => <ModuleStatus status={row.status} module="commission" />,
    },
    {
      id: 'matures_at',
      accessorKey: 'matures_at',
      header: 'Unlocks',
      cellClassName: 'whitespace-nowrap',
      renderCell: (row) => <DateTimeCell value={row.matures_at} />,
    },
  ];
};
