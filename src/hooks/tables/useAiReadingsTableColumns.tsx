import React from 'react';
import Link from 'next/link';
import { Eye, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ColumnConfig } from '@/components/common/DataTable/types';
import dayjs from 'dayjs';

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
      id: 'request_number',
      accessorKey: 'request_number',
      header: 'Request Number',
      sortable: true,
      cellClassName: 'font-mono text-xs font-bold text-slate-900',
      renderCell: (row) => (
        <Link href={`/ai-readings/${row.id}`} className="text-indigo-600 hover:text-indigo-900 hover:underline">
          {row.request_number}
        </Link>
      )
    },
    {
      id: 'user',
      accessorKey: 'user__email',
      header: 'User',
      sortable: true,
      renderCell: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-900">{row.user?.full_name || 'Unknown'}</span>
          <span className="text-xs text-slate-500">{row.user?.email || 'N/A'}</span>
        </div>
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
      id: 'is_cache_hit',
      accessorKey: 'is_cache_hit',
      header: 'Cache Hit',
      sortable: true,
      renderCell: (row) => row.is_cache_hit ? (
        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
          <CheckCircle2 className="h-3.5 w-3.5" /> Yes
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
          <XCircle className="h-3.5 w-3.5" /> No
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
