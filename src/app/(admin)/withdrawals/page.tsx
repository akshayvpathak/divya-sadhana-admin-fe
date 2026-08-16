'use client';

import { useState } from 'react';
import { Filter } from 'lucide-react';
import { ClearFiltersButton } from '@/components/common/ClearFiltersButton';
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
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardBand } from '@/components/ui/card';

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

  // Button visible only when status filter is active
  const hasActiveFilters = status !== 'all';

  const clearAllFilters = () => {
    setStatus('all');
    setPage(1);
  };

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
      <PageHeader
        title="Withdrawals"
        description="Review and process trustee payout requests"
      />

      <Card>
        <CardBand className="flex flex-col items-center justify-end gap-4 border-b border-line md:flex-row">
          <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center w-full md:w-auto">
            <Filter className="h-4 w-4 text-moon shrink-0" />
            <Select
              value={status}
              onValueChange={(val) => {
                setStatus(val || 'all');
                setPage(1);
              }}
            >
              <SelectTrigger className="bg-surface w-[160px]">
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
            {hasActiveFilters && (
              <ClearFiltersButton onClear={clearAllFilters} />
            )}
          </div>
        </CardBand>

        {isError ? (
          <div className="p-8 text-center text-danger">
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
      </Card>
    </div>
  );
}
