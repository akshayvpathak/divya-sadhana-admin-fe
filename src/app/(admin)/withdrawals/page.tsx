'use client';

import { useState } from 'react';
import { Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable } from '@/components/common/DataTable/DataTable';
import { DataTablePagination } from '@/components/common/DataTablePagination';
import { useWithdrawalsListQuery } from '@/hooks/queries/useWithdrawalsQuery';
import { useWithdrawalTableColumns } from '@/components/withdrawals/useWithdrawalTableColumns';
import { WITHDRAWAL_STATUSES } from '@/schemas/withdrawals.schema';

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  ...WITHDRAWAL_STATUSES.map((s) => ({
    value: s,
    label: s.charAt(0).toUpperCase() + s.slice(1),
  })),
];

export default function WithdrawalsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');

  const { data, isLoading, isError, error } = useWithdrawalsListQuery({
    page,
    page_size: PAGE_SIZE,
    status: status === 'all' ? undefined : status,
  });

  const columns = useWithdrawalTableColumns();

  const rows = data?.data?.results ?? [];
  const totalItems = data?.data?.count ?? rows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  const statusLabel =
    STATUS_OPTIONS.find((o) => o.value === status)?.label ?? 'All Statuses';

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Withdrawals</h1>
          <p className="text-slate-500 mt-1">
            Review and process trustee payout requests
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row gap-4 items-center justify-end">
          <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
            <Filter className="h-4 w-4 text-slate-400 shrink-0" />
            <Select
              value={status}
              onValueChange={(val) => {
                setStatus(val || 'all');
                setPage(1);
              }}
            >
              <SelectTrigger className="bg-white w-[160px]">
                <SelectValue placeholder="All Statuses">
                  {statusLabel}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isError ? (
          <div className="p-8 text-center text-rose-600">
            {(error as Error)?.message || 'Failed to load withdrawals'}
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={rows}
              isLoading={isLoading}
              emptyMessage="No withdrawal requests found"
              rowKey="id"
            />

            {data?.data && (
              <DataTablePagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalItems}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
