import React from 'react';
import { StatusBadge } from '@/components/ui/status-badge';
import { RowActions } from '@/components/common/RowActions';
import { ColumnConfig } from '@/components/common/DataTable/types';
import { Assignment } from '@/schemas/territory.schema';
import { formatPercent } from '@/lib/currency';

interface UseAssignmentTableColumnsProps {
  openEditModal?: (assignment: Assignment) => void;
  openDeleteModal?: (id: string) => void;
  /** When true, omit the Actions column (Coverage overview). */
  readOnly?: boolean;
}

export const useAssignmentTableColumns = ({
  openEditModal,
  openDeleteModal,
  readOnly = false,
}: UseAssignmentTableColumnsProps = {}): ColumnConfig<Assignment>[] => {
  const columns: ColumnConfig<Assignment>[] = [
    {
      id: 'member_email',
      header: 'Member',
      cellClassName: 'font-medium text-slate-900',
      renderCell: (row) => row.member_email || row.trustee_email || '—',
    },
    {
      id: 'member_referral_code',
      header: 'Code',
      cellClassName: 'font-mono text-xs text-slate-500',
      renderCell: (row) => row.member_referral_code || row.trustee_referral_code || '—',
    },
    {
      id: 'role',
      header: 'Role',
      renderCell: (row) => (
        <span className="text-sm text-slate-700">
          {row.role_display || (row.role ? row.role.replace(/_/g, ' ') : '—')}
        </span>
      ),
    },
    {
      id: 'state_name',
      accessorKey: 'state_name',
      header: 'Territory',
      cellClassName: 'text-slate-700',
      renderCell: (row) => {
        const state = row.state_name || '—';
        return row.district_name ? `${state} · ${row.district_name}` : state;
      },
    },
    {
      id: 'area_commission_percent',
      accessorKey: 'area_commission_percent',
      header: 'Rate override',
      headerAlign: 'right',
      cellAlign: 'right',
      cellClassName: 'font-medium text-slate-900',
      renderCell: (row) => {
        const pct = row.commission_percent_override ?? row.area_commission_percent;
        return pct !== null && pct !== undefined && pct !== ''
          ? formatPercent(pct)
          : 'Default';
      },
    },
    {
      id: 'is_active',
      accessorKey: 'is_active',
      header: 'Status',
      renderCell: (row) => <StatusBadge status={row.is_active} type="active" />,
    },
  ];

  if (!readOnly && openEditModal && openDeleteModal) {
    columns.push({
      id: 'actions',
      header: 'Actions',
      headerAlign: 'right',
      cellAlign: 'right',
      renderCell: (row) => (
        <RowActions
          actions={[
            { kind: 'edit', onClick: () => openEditModal(row) },
            { kind: 'delete', label: 'Remove', onClick: () => openDeleteModal(row.id) },
          ]}
        />
      ),
    });
  }

  return columns;
};
