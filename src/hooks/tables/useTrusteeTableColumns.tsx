import React from 'react';
import Link from 'next/link';
import { Eye, MapPin, Pencil } from 'lucide-react';
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

function initialsFromName(name: string): string {
  const parts = name.replace(/[^a-zA-Z\s]/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
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

const AVATAR_TONES = [
  'bg-indigo-100 text-indigo-700',
  'bg-sky-100 text-sky-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-800',
  'bg-rose-100 text-rose-700',
  'bg-violet-100 text-violet-700',
];

function avatarTone(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % AVATAR_TONES.length;
  }
  return AVATAR_TONES[hash];
}

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
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${avatarTone(name)}`}
              aria-hidden
            >
              {initialsFromName(name)}
            </div>
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
        <div className="flex justify-end gap-2">
          <Link href={`/trustees/${row.id}`}>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 border-slate-200 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
              title="View"
            >
              <Eye className="h-3.5 w-3.5" />
              View
            </Button>
          </Link>
          <Link href={`/trustees/${row.id}/edit`}>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 border-slate-200 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
              title="Edit"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          </Link>
        </div>
      ),
    },
  ];
};
