import React from 'react';
import Link from 'next/link';
import { RowActions } from '@/components/common/RowActions';
import { ColumnConfig } from '@/components/common/DataTable/types';
import { DateTimeCell } from '@/components/common/DateTimeCell';
import { ModuleStatus } from '@/components/ui/badges/ModuleStatus';
import { FAILURE_CLASS_META, describeFailure } from '@/lib/reading-failures';

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
  return <ModuleStatus status={status} module="ai-readings" />;
}

export const useAiReadingsTableColumns = (): ColumnConfig<AiReadingRow>[] => {
  return [
    {
      id: 'user',
      accessorKey: 'user__email',
      header: 'User',
      sortable: true,
      mobile: 'title',
      // The whole card already carries a View action, so the card headline is
      // plain text rather than a second link into the same record.
      renderMobile: (row) => (
        <span className="block">
          <span className="block break-words">{row.user?.full_name || 'Unknown'}</span>
          <span className="mt-0.5 block break-all text-xs font-normal text-moon">
            {row.user?.email || 'N/A'}
          </span>
        </span>
      ),
      renderCell: (row) => (
        <Link href={`/ai-readings/${row.id}`} className="flex flex-col group">
          <span className="font-medium text-ink group-hover:text-gold-press group-hover:underline">{row.user?.full_name || 'Unknown'}</span>
          <span className="text-xs text-moon">{row.user?.email || 'N/A'}</span>
        </Link>
      ),
    },
    {
      id: 'service_name',
      accessorKey: 'service_name',
      header: 'Service',
      sortable: true,
      mobile: 'field',
      renderMobile: (row) => (
        <span className="block">
          <span className="block font-medium text-ink">{row.service_name}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-moon">
            {row.service_kind?.replace('_', ' ')}
          </span>
        </span>
      ),
      renderCell: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-ink">{row.service_name}</span>
          <span className="text-[10px] text-moon font-bold uppercase tracking-wider">{row.service_kind.replace('_', ' ')}</span>
        </div>
      )
    },
    {
      id: 'price',
      header: 'Price',
      mobile: 'field',
      renderCell: (row) => (
        <span className="font-medium">
          {row.report_unlock_price} <span className="text-xs text-moon uppercase font-bold">{row.currency}</span>
        </span>
      ),
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: 'Status',
      sortable: true,
      headerAlign: 'center',
      cellAlign: 'center',
      mobile: 'status',
      // Why it failed, inline — so a run of pre-check rejections is visible
      // without opening every row.
      renderCell: (row) => {
        if (row.status !== 'failed') return <ReadingStatusBadge status={row.status} />;
        const meta = describeFailure(row.failure_code);
        return (
          <div className="flex flex-col items-center gap-1">
            <ReadingStatusBadge status={row.status} />
            <span
              className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${FAILURE_CLASS_META[meta.klass].badgeClass}`}
              title={meta.meaning}
            >
              {meta.label}
            </span>
          </div>
        );
      },
    },
    {
      id: 'created_at',
      accessorKey: 'created_at',
      header: 'Created Date',
      sortable: true,
      cellClassName: 'whitespace-nowrap',
      mobile: 'field',
      mobileLabel: 'Created',
      renderCell: (row) => <DateTimeCell value={row.created_at} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      mobile: 'actions',
      headerAlign: 'center',
      cellAlign: 'center',
      renderCell: (row) => (
        <RowActions actions={[{ kind: 'view', href: `/ai-readings/${row.id}` }]} />
      ),
    },
  ];
};
