import React from 'react';
import Link from 'next/link';
import { Eye, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { ColumnConfig } from '@/components/common/DataTable/types';
import { Trustee } from '@/schemas/trustees.schema';
import { formatPercent } from '@/lib/currency';

export function trusteeDisplayName(row: Trustee): string {
  if (row.user_full_name) return row.user_full_name;
  if (row.name) return row.name;
  const full = [row.first_name, row.last_name].filter(Boolean).join(' ').trim();
  if (full) return full;
  return row.user_email || row.email || '—';
}

const ROLE_LABEL: Record<string, string> = {
  trustee: 'Trustee',
  state_executive: 'State Executive',
  district_president: 'District President',
};

const ROLE_BADGE: Record<string, string> = {
  trustee: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  state_executive: 'bg-violet-50 text-violet-700 border-violet-200',
  district_president: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export function networkRoleLabel(row: Pick<Trustee, 'role' | 'role_display'>): string {
  if (row.role_display) return row.role_display;
  if (row.role && ROLE_LABEL[row.role]) return ROLE_LABEL[row.role];
  if (row.role) return row.role.replace(/_/g, ' ');
  return 'Trustee';
}

interface UseTrusteeTableColumnsProps {
  /** Territory labels attributed to this member (state, or state · district). */
  getTerritory: (row: Trustee) => string[];
}

export const useTrusteeTableColumns = ({
  getTerritory,
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
      cellClassName: 'text-slate-500 max-w-[200px] truncate',
      renderCell: (row) => row.user_email || row.email || '—',
    },
    {
      id: 'role',
      header: 'Role',
      headerClassName: 'min-w-[240px]',
      cellClassName: 'min-w-[240px]',
      renderCell: (row) => {
        const role = row.role || 'trustee';
        const label = networkRoleLabel(row);
        const badge = ROLE_BADGE[role] ?? 'bg-slate-50 text-slate-700 border-slate-200';
        return (
          <span
            className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${badge}`}
            title={label}
          >
            {label}
          </span>
        );
      },
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
      id: 'territory',
      header: 'Territory',
      renderCell: (row) => {
        const labels = getTerritory(row);
        if (!labels.length) {
          return <span className="text-amber-600 text-xs font-medium">(none)</span>;
        }
        return <span className="text-slate-700 text-sm">{labels.join(', ')}</span>;
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
          <Link href={`/trustees/${row.id}/edit`}>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-indigo-600"
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      ),
    },
  ];
};
