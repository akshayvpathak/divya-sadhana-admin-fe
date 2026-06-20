import React from 'react';
import Link from 'next/link';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { ColumnConfig } from '@/components/common/DataTable/types';
import { Trustee } from '@/schemas/trustees.schema';
import { formatPercent } from '@/lib/currency';

export function trusteeDisplayName(row: Trustee): string {
  if (row.name) return row.name;
  const full = [row.first_name, row.last_name].filter(Boolean).join(' ').trim();
  if (full) return full;
  return row.email || '—';
}

interface UseTrusteeTableColumnsProps {
  /** Resolves the state names attributed to a trustee (from active assignments). */
  getStates: (row: Trustee) => string[];
}

export const useTrusteeTableColumns = ({
  getStates,
}: UseTrusteeTableColumnsProps): ColumnConfig<Trustee>[] => {
  return [
    {
      id: 'name',
      header: 'Name',
      sortable: true,
      sortKey: 'name',
      cellClassName: 'font-medium text-slate-900',
      renderCell: (row) => trusteeDisplayName(row),
    },
    {
      id: 'email',
      accessorKey: 'email',
      header: 'Email',
      cellClassName: 'text-slate-500 max-w-[220px] truncate',
      renderCell: (row) => row.email || '—',
    },
    {
      id: 'referral_code',
      accessorKey: 'referral_code',
      header: 'Code',
      cellClassName: 'font-mono text-xs text-slate-600',
      renderCell: (row) => row.referral_code || '—',
    },
    {
      id: 'commission_percent',
      accessorKey: 'commission_percent',
      header: 'Comm %',
      headerAlign: 'right',
      cellAlign: 'right',
      cellClassName: 'font-medium text-slate-900',
      renderCell: (row) =>
        row.commission_percent !== null && row.commission_percent !== undefined
          ? formatPercent(row.commission_percent)
          : '—',
    },
    {
      id: 'states',
      header: 'State(s)',
      renderCell: (row) => {
        const states = getStates(row);
        if (!states.length) {
          return <span className="text-amber-600 text-xs font-medium">(none)</span>;
        }
        return <span className="text-slate-700 text-sm">{states.join(', ')}</span>;
      },
    },
    {
      id: 'is_active',
      accessorKey: 'is_active',
      header: 'Status',
      sortable: true,
      sortKey: 'is_active',
      renderCell: (row) => <StatusBadge status={row.is_active} type="active" />,
    },
    {
      id: 'actions',
      header: 'Actions',
      headerAlign: 'right',
      cellAlign: 'right',
      renderCell: (row) => (
        <div className="flex justify-end">
          <Link href={`/trustees/${row.id}`}>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-indigo-600"
              title="View"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      ),
    },
  ];
};
