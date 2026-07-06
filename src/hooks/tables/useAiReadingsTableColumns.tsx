import React from 'react';
import Link from 'next/link';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ColumnConfig } from '@/components/common/DataTable/types';
import dayjs from 'dayjs';

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface AiReadingRow {
  id: string;
  request_number: string;
  service_name: string;
  service_kind: string;
  report_unlock_price: string;
  currency: string;
  user: {
    full_name: string;
    email: string;
  };
  status: string;
  is_cache_hit: boolean;
  created_at: string;
  [key: string]: any;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function ReadingStatusBadge({ status }: { status: string }) {
  let classes = "bg-slate-100 text-slate-700";
  let label = status;

  switch (status) {
    case "pending":
      classes = "bg-amber-100 text-amber-700 font-medium text-xs";
      label = "Pending";
      break;
    case "processing":
      classes = "bg-blue-100 text-blue-700 font-medium text-xs animate-pulse";
      label = "Processing";
      break;
    case "succeeded":
      classes = "bg-green-100 text-green-700 font-medium text-xs";
      label = "Succeeded";
      break;
    case "failed":
      classes = "bg-rose-100 text-rose-700 font-medium text-xs";
      label = "Failed";
      break;
    case "cancelled":
      classes = "bg-slate-100 text-slate-500 font-medium text-xs";
      label = "Cancelled";
      break;
  }
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-center whitespace-nowrap capitalize ${classes}`}>
      {label}
    </span>
  );
}

export const useAiReadingsTableColumns = (): ColumnConfig<AiReadingRow>[] => {
  return [
    {
      id: 'user',
      accessorKey: 'user__email',
      header: 'User',
      sortable: true,
      renderCell: (row) => (
        <Link href={`/ai-readings/${row.id}`} className="flex flex-col group">
          <span className="font-medium text-slate-900 group-hover:text-indigo-600 group-hover:underline">{row.user?.full_name || 'Unknown'}</span>
          <span className="text-xs text-slate-500">{row.user?.email || 'N/A'}</span>
        </Link>
      ),
    },
    {
      id: 'service_name',
      accessorKey: 'service_name',
      header: 'Service',
      sortable: true,
      renderCell: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-900">{row.service_name}</span>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{row.service_kind.replace('_', ' ')}</span>
        </div>
      )
    },
    {
      id: 'price',
      header: 'Price',
      renderCell: (row) => (
        <span className="font-medium">
          {row.report_unlock_price} <span className="text-xs text-slate-400 uppercase font-bold">{row.currency}</span>
        </span>
      ),
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: 'Status',
      sortable: true,
      renderCell: (row) => <ReadingStatusBadge status={row.status} />,
    },
    {
      id: 'created_at',
      accessorKey: 'created_at',
      header: 'Created Date',
      sortable: true,
      cellClassName: 'text-slate-500 text-sm',
      renderCell: (row) => row.created_at ? dayjs(row.created_at).format('MMM D, YYYY') : '-',
    },
    {
      id: 'actions',
      header: 'Actions',
      renderCell: (row) => (
        <div>
          <Link href={`/ai-readings/${row.id}`}>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-indigo-600">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      ),
    },
  ];
};
