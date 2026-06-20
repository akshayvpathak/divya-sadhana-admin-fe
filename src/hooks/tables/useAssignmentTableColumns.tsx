import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { ColumnConfig } from '@/components/common/DataTable/types';
import { Assignment } from '@/schemas/territory.schema';
import { formatPercent } from '@/lib/currency';

interface UseAssignmentTableColumnsProps {
  openEditModal: (assignment: Assignment) => void;
  openDeleteModal: (id: string) => void;
}

export const useAssignmentTableColumns = ({
  openEditModal,
  openDeleteModal,
}: UseAssignmentTableColumnsProps): ColumnConfig<Assignment>[] => {
  return [
    {
      id: 'trustee_email',
      accessorKey: 'trustee_email',
      header: 'Trustee',
      cellClassName: 'font-medium text-slate-900',
      renderCell: (row) => row.trustee_email || '—',
    },
    {
      id: 'trustee_referral_code',
      accessorKey: 'trustee_referral_code',
      header: 'Code',
      cellClassName: 'font-mono text-xs text-slate-500',
      renderCell: (row) => row.trustee_referral_code || '—',
    },
    {
      id: 'state_name',
      accessorKey: 'state_name',
      header: 'State',
      cellClassName: 'text-slate-700',
      renderCell: (row) => row.state_name || '—',
    },
    {
      id: 'area_commission_percent',
      accessorKey: 'area_commission_percent',
      header: 'Area %',
      headerAlign: 'right',
      cellAlign: 'right',
      cellClassName: 'font-medium text-slate-900',
      renderCell: (row) =>
        row.area_commission_percent !== null &&
        row.area_commission_percent !== undefined &&
        row.area_commission_percent !== ''
          ? formatPercent(row.area_commission_percent)
          : 'Default',
    },
    {
      id: 'is_active',
      accessorKey: 'is_active',
      header: 'Status',
      renderCell: (row) => <StatusBadge status={row.is_active} type="active" />,
    },
    {
      id: 'actions',
      header: 'Actions',
      headerAlign: 'right',
      cellAlign: 'right',
      renderCell: (row) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openEditModal(row)}
            className="text-slate-400 hover:text-indigo-600"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openDeleteModal(row.id)}
            className="text-slate-400 hover:text-rose-600"
            title="Remove"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];
};
