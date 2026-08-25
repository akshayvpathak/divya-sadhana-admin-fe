import React from 'react';
import { StatusBadge } from '@/components/ui/status-badge';
import { TableAvatar } from '@/components/common/TableAvatar';
import { RowActions } from '@/components/common/RowActions';
import { ColumnConfig } from '@/components/common/DataTable/types';
import { userRoleBadgeClass } from '@/hooks/useUsers';

export interface UserRow {
  id: string;
  name: string;
  email: string;
  is_superuser: boolean;
  network_role: string | null;
  network_role_display: string | null;
  referral_code: string | null;
  roleLabel: string;
  is_active: boolean;
  createdAt: string;
}

interface UseUserTableColumnsProps {
  openDeleteModal: (id: string) => void;
}

function RoleCell({ row }: { row: UserRow }) {
  const networkBadge = userRoleBadgeClass(row.network_role);
  if (networkBadge) {
    return (
      <span
        className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${networkBadge}`}
        title={row.roleLabel}
      >
        {row.roleLabel}
      </span>
    );
  }
  return (
    <StatusBadge
      status={row.is_superuser ? 'admin' : 'user'}
      type="role"
    />
  );
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
      accessorKey: 'roleLabel',
      header: 'Role',
      headerAlign: 'center',
      cellAlign: 'center',
      mobile: 'status',
      renderCell: (row) => <RoleCell row={row} />,
    },
    {
      id: 'referral_code',
      accessorKey: 'referral_code',
      header: 'Referral',
      mobile: 'field',
      mobileLabel: 'Referral code',
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
