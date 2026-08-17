import { StatusBadge } from '@/components/ui/status-badge';
import { RowActions } from '@/components/common/RowActions';
import { ColumnConfig } from '@/components/common/DataTable/types';
import { DateTimeCell } from '@/components/common/DateTimeCell';

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
          <span className="text-xs text-moon">{row.service_name ?? '—'}</span>
        </div>
      ),
    },
    {
      id: 'starts_at',
      accessorKey: 'starts_at',
      header: 'Starts',
      sortable: true,
      cellClassName: 'whitespace-nowrap',
      renderCell: (row) => <DateTimeCell value={row.starts_at} />,
    },
    {
      id: 'ends_at',
      accessorKey: 'ends_at',
      header: 'Ends',
      cellClassName: 'whitespace-nowrap',
      renderCell: (row) => <DateTimeCell value={row.ends_at} />,
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
      headerAlign: 'center',
      cellAlign: 'center',
      renderCell: (row) => <StatusBadge status={row.is_open} type="active" />,
    },
    {
      id: 'actions',
      header: 'Actions',
      headerAlign: 'center',
      cellAlign: 'center',
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
