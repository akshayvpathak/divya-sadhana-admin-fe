import Link from 'next/link';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { ColumnConfig } from '@/components/common/DataTable/types';
import { formatINR } from '@/lib/currency';
import dayjs from 'dayjs';

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
          <span className="font-mono text-xs text-slate-500">{row.booking_number}</span>
        </div>
      ),
    },
    {
      id: 'booker_name',
      accessorKey: 'booker_name',
      header: 'Booker',
      renderCell: (row) => row.booker_name ?? '—',
    },
    {
      id: 'amount',
      accessorKey: 'amount',
      header: 'Amount',
      sortable: true,
      cellClassName: 'font-medium text-slate-900',
      renderCell: (row) => formatINR(row.amount),
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: 'Status',
      sortable: true,
      renderCell: (row) => <StatusBadge status={row.status} type="service_booking_status" />,
    },
    {
      id: 'scheduled_at',
      accessorKey: 'scheduled_at',
      header: 'Muhurat',
      cellClassName: 'text-slate-500',
      renderCell: (row) => (row.scheduled_at ? dayjs(row.scheduled_at).format('MMM D, YYYY h:mm A') : '-'),
    },
    {
      id: 'created_at',
      accessorKey: 'created_at',
      header: 'Created',
      sortable: true,
      cellClassName: 'text-slate-500',
      renderCell: (row) => (row.created_at ? dayjs(row.created_at).format('MMM D, YYYY') : '-'),
    },
    {
      id: 'actions',
      header: 'Actions',
      renderCell: (row) => (
        <Link href={`/service-bookings/${row.id}`}>
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-indigo-600">
            <Eye className="h-4 w-4" />
          </Button>
        </Link>
      ),
    },
  ];
};
