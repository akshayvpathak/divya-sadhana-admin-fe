import React from 'react';
import Link from 'next/link';
import { Eye, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { ColumnConfig } from '@/components/common/DataTable/types';
import dayjs from 'dayjs';

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
      cellClassName: 'font-medium',
    },
    {
      id: 'email',
      accessorKey: 'email',
      header: 'Email',
      sortable: true,
      cellClassName: 'text-slate-500',
    },
    {
      id: 'role',
      accessorKey: 'role',
      header: 'Role',
      sortable: true,
      sortKey: 'is_active',
      renderCell: (row) => <StatusBadge status={row.role} type="role" />,
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
      id: 'createdAt',
      accessorKey: 'createdAt',
      header: 'Joined',
      sortable: false,
      cellClassName: 'text-slate-500',
      renderCell: (row) => dayjs(row.createdAt).format('MMM D, YYYY'),
    },
    {
      id: 'actions',
      header: 'Actions',
      renderCell: (row) => (
        <div>
          <Link href={`/users/${row.id}?mode=view`}>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-slate-400 hover:text-indigo-600"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/users/${row.id}?mode=edit`}>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-indigo-600">
              <Edit2 className="h-4 w-4" />
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => openDeleteModal(row.id)} 
            className="text-slate-400 hover:text-rose-600"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];
};
