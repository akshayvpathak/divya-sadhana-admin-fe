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
  // Feeds a composed avatar + name cell, so this has to stay a string — the
  // DataTable's N/A chip only fires for a cell that is entirely blank.
  return row.user_email || row.email || '—';
}

const ROLE_LABEL: Record<string, string> = {
  trustee: 'Trustee',
  state_executive: 'State Executive',
  district_president: 'District President',
};

const ROLE_BADGE: Record<string, string> = {
  trustee: 'bg-tint text-gold-press border-gold/25',
  state_executive: 'bg-plum-tint text-plum-ink border-plum/25',
  district_president: 'bg-success-tint text-success-ink border-success/25',
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
              <p className="font-medium text-ink truncate">{name}</p>
              {email ? (
                <p className="text-xs text-moon truncate max-w-[200px]">{email}</p>
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
        const badge = ROLE_BADGE[role] ?? 'bg-cream text-charcoal border-line';
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
          <span className="inline-flex items-center rounded-md bg-cosmos px-2 py-1 font-mono text-xs font-medium text-charcoal ring-1 ring-inset ring-line/80">
            {row.referral_code}
          </span>
        ) : (
          <span className="text-line">—</span>
        ),
    },
    {
      id: 'commission_percent',
      accessorKey: 'commission_percent',
      header: 'Comm %',
      headerAlign: 'right',
      cellAlign: 'right',
      cellClassName: 'font-semibold tabular-nums text-ink',
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
            <span className="inline-flex items-center gap-1 rounded-full bg-cream px-2 py-0.5 text-xs font-medium text-moon ring-1 ring-inset ring-line">
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
                className="inline-flex items-center rounded-full bg-info-tint px-2 py-0.5 text-xs font-medium text-info-ink ring-1 ring-inset ring-info/20"
                title={label}
              >
                {label}
              </span>
            ))}
            {labels.length > 2 ? (
              <span
                className="inline-flex items-center rounded-full bg-cream px-2 py-0.5 text-xs font-medium text-moon ring-1 ring-inset ring-line"
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
