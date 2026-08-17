import { StatusBadge } from '@/components/ui/status-badge';
import { RowActions } from '@/components/common/RowActions';
import { ColumnConfig } from '@/components/common/DataTable/types';
import { formatINR } from '@/lib/currency';
import { DateTimeCell } from '@/components/common/DateTimeCell';

export interface ServiceBookingRow {
  id: string;
  booking_number: string;
  service_name?: string | null;
  service_category?: string | null;
  booker_name?: string | null;
  amount: number;
  status: string;
  scheduled_at?: string | null;
  created_at?: string;
}

export const useServiceBookingTableColumns = (): ColumnConfig<ServiceBookingRow>[] => {
  return [
    {
      id: 'booking_number',
      accessorKey: 'booking_number',
      header: 'Booking',
      sortable: true,
      renderCell: (row) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.service_name ?? '—'}</span>
          <span className="font-mono text-xs text-moon">{row.booking_number}</span>
        </div>
      ),
    },
    {
      id: 'booker_name',
      accessorKey: 'booker_name',
      header: 'Booker',
      renderCell: (row) => row.booker_name ?? null,
    },
    {
      id: 'amount',
      accessorKey: 'amount',
      header: 'Amount',
      sortable: true,
      cellClassName: 'font-medium text-ink',
      renderCell: (row) => formatINR(row.amount),
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: 'Status',
      sortable: true,
      headerAlign: 'center',
      cellAlign: 'center',
      renderCell: (row) => <StatusBadge status={row.status} type="service_booking_status" />,
    },
    {
      id: 'scheduled_at',
      accessorKey: 'scheduled_at',
      header: 'Muhurat',
      cellClassName: 'whitespace-nowrap',
      renderCell: (row) => <DateTimeCell value={row.scheduled_at} />,
    },
    {
      id: 'created_at',
      accessorKey: 'created_at',
      header: 'Created',
      sortable: true,
      cellClassName: 'whitespace-nowrap',
      renderCell: (row) => <DateTimeCell value={row.created_at} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      headerAlign: 'center',
      cellAlign: 'center',
      renderCell: (row) => (
        <RowActions actions={[{ kind: 'view', href: `/service-bookings/${row.id}` }]} />
      ),
    },
  ];
};
