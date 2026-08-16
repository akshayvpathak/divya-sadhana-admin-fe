import React from 'react';
import { StatusBadge } from '@/components/ui/status-badge';
import { RowActions } from '@/components/common/RowActions';
import { ColumnConfig } from '@/components/common/DataTable/types';

export interface CategoryRow {
  id: string;
  name: string;
  isActive: boolean;
  description: string;
}

interface UseCategoryTableColumnsProps {
  openDeleteModal: (id: string) => void;
}

export const useCategoryTableColumns = ({
  openDeleteModal,
}: UseCategoryTableColumnsProps): ColumnConfig<CategoryRow>[] => {
  return [
    {
      id: 'name',
      accessorKey: 'name',
      header: 'Name',
      sortable: true,
      renderCell: (row) => (
        <div className="flex flex-col max-w-[250px]">
          <span className="font-medium truncate">{row.name}</span>
          <span 
            className="text-xs text-moon overflow-hidden whitespace-nowrap text-ellipsis [&>*]:inline"
            dangerouslySetInnerHTML={{ __html: row.description || '' }}
          />
        </div>
      ),
    },
    {
      id: 'isActive',
      accessorKey: 'isActive',
      header: 'Status',
      sortable: true,
      sortKey: 'is_active',
      renderCell: (row) => <StatusBadge status={row.isActive} type="active" />,
    },

    {
      id: 'actions',
      header: 'Actions',
      headerAlign: 'right',
      cellAlign: 'right',
      renderCell: (row) => (
        <RowActions
          actions={[
            { kind: 'view', href: `/categories/${row.id}?mode=view` },
            { kind: 'edit', href: `/categories/${row.id}?mode=edit` },
            { kind: 'delete', onClick: () => openDeleteModal(row.id) },
          ]}
        />
      ),
    },
  ];
};
