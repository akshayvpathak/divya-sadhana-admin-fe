import React from 'react';
import { MapPin } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';
import { TableAvatar } from '@/components/common/TableAvatar';
import { RowActions } from '@/components/common/RowActions';
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
      cellClassName: 'whitespace-normal',
      renderCell: (row) => {
        const name = trusteeDisplayName(row);
        const email = row.user_email || row.email || '';
        return (
          <div className="flex items-center gap-3 min-w-[180px]">
            <TableAvatar name={name} />
            <div className="min-w-0">
              <p className="font-medium text-slate-900 truncate">{name}</p>
              {email ? (
                <p className="text-xs text-slate-400 truncate max-w-[200px]">{email}</p>
              ) : null}
            </div>
          </div>
        );
      },
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
      renderCell: (row) =>
        row.referral_code ? (
          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 font-mono text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-200/80">
            {row.referral_code}
          </span>
        ) : (
          <span className="text-slate-300">—</span>
        ),
    },
    {
      id: 'commission_percent',
      accessorKey: 'commission_percent',
      header: 'Comm %',
      headerAlign: 'right',
      cellAlign: 'right',
      cellClassName: 'font-semibold tabular-nums text-slate-900',
      renderCell: (row) =>
        row.commission_percent !== null && row.commission_percent !== undefined
          ? formatPercent(row.commission_percent)
          : '—',
    },
    {
      id: 'territory',
      header: 'Territory',
      cellClassName: 'whitespace-normal',
      renderCell: (row) => {
        const labels = getTerritory(row);
        if (!labels.length) {
          return (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-400 ring-1 ring-inset ring-slate-200">
              <MapPin className="h-3 w-3" />
              Unassigned
            </span>
          );
        }
        return (
          <div className="flex flex-wrap gap-1 max-w-[240px]">
            {labels.slice(0, 2).map((label) => (
              <span
                key={label}
                className="inline-flex items-center rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-800 ring-1 ring-inset ring-sky-100"
                title={label}
              >
                {label}
              </span>
            ))}
            {labels.length > 2 ? (
              <span
                className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-500 ring-1 ring-inset ring-slate-200"
                title={labels.slice(2).join(', ')}
              >
                +{labels.length - 2}
              </span>
            ) : null}
          </div>
        );
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
        <RowActions
          actions={[
            { kind: 'view', href: `/trustees/${row.id}` },
            { kind: 'edit', href: `/trustees/${row.id}/edit` },
          ]}
        />
      ),
    },
  ];
};
