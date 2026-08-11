import { StatusBadge } from '@/components/ui/status-badge';
import { RowActions } from '@/components/common/RowActions';
import { ColumnConfig } from '@/components/common/DataTable/types';
import dayjs from 'dayjs';

export interface ServiceBatchRow {
  id: string;
  title: string;
  service_name?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  capacity?: number | null;
  is_open: boolean;
}

interface Props {
  openDeleteModal: (id: string) => void;
}

export const useServiceBatchTableColumns = ({ openDeleteModal }: Props): ColumnConfig<ServiceBatchRow>[] => {
  return [
    {
      id: 'title',
      accessorKey: 'title',
      header: 'Batch',
      sortable: true,
      renderCell: (row) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.title}</span>
          <span className="text-xs text-slate-500">{row.service_name ?? '—'}</span>
        </div>
      ),
    },
    {
      id: 'starts_at',
      accessorKey: 'starts_at',
      header: 'Starts',
      sortable: true,
      cellClassName: 'text-slate-500',
      renderCell: (row) => (row.starts_at ? dayjs(row.starts_at).format('MMM D, YYYY h:mm A') : '-'),
    },
    {
      id: 'ends_at',
      accessorKey: 'ends_at',
      header: 'Ends',
      cellClassName: 'text-slate-500',
      renderCell: (row) => (row.ends_at ? dayjs(row.ends_at).format('MMM D, YYYY') : '-'),
    },
    {
      id: 'capacity',
      accessorKey: 'capacity',
      header: 'Capacity',
      renderCell: (row) => (row.capacity != null ? row.capacity : '∞'),
    },
    {
      id: 'is_open',
      accessorKey: 'is_open',
      header: 'Open',
      renderCell: (row) => <StatusBadge status={row.is_open} type="active" />,
    },
    {
      id: 'actions',
      header: 'Actions',
      headerAlign: 'right',
      cellAlign: 'right',
      renderCell: (row) => (
        <RowActions
          actions={[
            { kind: 'view', href: `/service-batches/${row.id}` },
            { kind: 'edit', href: `/service-batches/${row.id}?mode=edit` },
            { kind: 'delete', onClick: () => openDeleteModal(row.id) },
          ]}
        />
      ),
    },
  ];
};
