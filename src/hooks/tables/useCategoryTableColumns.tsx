import React from 'react';
import Link from 'next/link';
import { Eye, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
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
            className="text-xs text-slate-500 overflow-hidden whitespace-nowrap text-ellipsis [&>*]:inline"
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
      renderCell: (row) => (
        <div>
          <Link href={`/categories/${row.id}?mode=view`}>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-slate-400 hover:text-indigo-600"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/categories/${row.id}?mode=edit`}>
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
