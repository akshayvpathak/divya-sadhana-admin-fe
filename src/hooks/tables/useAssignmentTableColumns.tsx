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
      cellClassName: 'font-medium text-ink',
      mobile: 'title',
      renderCell: (row) => row.member_email || row.trustee_email || null,
    },
    {
      id: 'member_referral_code',
      header: 'Code',
      mobile: 'subtitle',
      cellClassName: 'font-mono text-xs text-moon',
      renderCell: (row) => row.member_referral_code || row.trustee_referral_code || null,
    },
    {
      id: 'role',
      header: 'Role',
      mobile: 'field',
      renderCell: (row) => (
        <span className="text-sm text-charcoal">
          {row.role_display || (row.role ? row.role.replace(/_/g, ' ') : '—')}
        </span>
      ),
    },
    {
      id: 'state_name',
      accessorKey: 'state_name',
      header: 'Territory',
      cellClassName: 'text-charcoal',
      mobile: 'field',
      renderCell: (row) => {
        const state = row.state_name || '—';
        return row.district_name ? `${state} · ${row.district_name}` : state;
      },
    },
    {
      id: 'area_commission_percent',
      accessorKey: 'area_commission_percent',
      header: 'Rate override',
      mobile: 'field',
      headerAlign: 'right',
      cellAlign: 'right',
      cellClassName: 'font-medium text-ink',
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
      mobile: 'status',
      headerAlign: 'center',
      cellAlign: 'center',
      renderCell: (row) => <StatusBadge status={row.is_active} type="active" />,
    },
  ];

  if (!readOnly && openEditModal && openDeleteModal) {
    columns.push({
      id: 'actions',
      header: 'Actions',
      mobile: 'actions',
      headerAlign: 'center',
      cellAlign: 'center',
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
