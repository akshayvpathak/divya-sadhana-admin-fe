import React from 'react';
import { StatusBadge } from '@/components/ui/status-badge';
import { TableAvatar } from '@/components/common/TableAvatar';
import { RowActions } from '@/components/common/RowActions';
import { ColumnConfig } from '@/components/common/DataTable/types';

export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  createdAt: string;
}

interface UseUserTableColumnsProps {
  openDeleteModal: (id: string) => void;
}

export const useUserTableColumns = ({
  openDeleteModal,
}: UseUserTableColumnsProps): ColumnConfig<UserRow>[] => {
  return [
    {
      id: 'name',
      accessorKey: 'name',
      header: 'Name',
      sortable: true,
      sortKey: 'first_name',
      mobile: 'title',
      // The avatar earns its place in a 220px table cell; in a full-width card
      // it is just an indent in front of the headline.
      renderMobile: (row) => (row.name?.trim() ? row.name : null),
      // Returning null for a nameless user lets the table's N/A chip stand in.
      renderCell: (row) =>
        row.name?.trim() ? (
          <div className="flex items-center gap-3">
            <TableAvatar name={row.name} />
            <span className="font-semibold text-ink">{row.name}</span>
          </div>
        ) : null,
    },
    {
      id: 'email',
      accessorKey: 'email',
      header: 'Email',
      sortable: true,
      cellClassName: 'text-moon',
      mobile: 'subtitle',
    },
    {
      id: 'role',
      accessorKey: 'role',
      header: 'Role',
      sortable: true,
      sortKey: 'is_active',
      headerAlign: 'center',
      cellAlign: 'center',
      mobile: 'status',
      renderCell: (row) => <StatusBadge status={row.role} type="role" />,
    },
    {
      id: 'is_active',
      accessorKey: 'is_active',
      header: 'Status',
      sortable: true,
      sortKey: 'is_active',
      headerAlign: 'center',
      cellAlign: 'center',
      mobile: 'status',
      renderCell: (row) => <StatusBadge status={row.is_active} type="active" />,
    },
    // {
    //   id: 'createdAt',
    //   accessorKey: 'createdAt',
    //   header: 'Joined',
    //   sortable: false,
    //   cellClassName: 'text-moon',
    //   renderCell: (row) => dayjs(row.createdAt).format('MMM D, YYYY'),
    // },
    {
      id: 'actions',
      header: 'Actions',
      mobile: 'actions',
      headerAlign: 'center',
      cellAlign: 'center',
      renderCell: (row) => (
        <RowActions
          actions={[
            { kind: 'view', href: `/users/${row.id}?mode=view` },
            { kind: 'edit', href: `/users/${row.id}?mode=edit` },
            { kind: 'delete', onClick: () => openDeleteModal(row.id) },
          ]}
        />
      ),
    },
  ];
};
