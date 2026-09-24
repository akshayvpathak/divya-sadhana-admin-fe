'use client';

import { useMemo } from 'react';
import { ResponsiveDataView } from '@/components/common/ResponsiveDataView';
import { useListQueryState } from '@/hooks/useListQueryState';
import { ListToolbar, ToolbarFilter } from '@/components/common/ListToolbar';
import { DataTablePagination } from '@/components/common/DataTablePagination';
import {
  useWithdrawalsListQuery,
  useWithdrawalsInfiniteQuery,
} from '@/hooks/queries/useWithdrawalsQuery';
import { useWithdrawalTableColumns } from '@/components/withdrawals/useWithdrawalTableColumns';
import { WITHDRAWAL_STATUSES } from '@/schemas/withdrawals.schema';
import { useIsCompact } from '@/hooks/useMediaQuery';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/card';

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  ...WITHDRAWAL_STATUSES.map((s) => ({
    value: s,
    label: s.charAt(0).toUpperCase() + s.slice(1),
  })),
];

/** Defaults double as the URL contract: anything at its default stays out of the query. */
const DEFAULTS = { page: 1, status: 'all' };

export default function WithdrawalsPage() {
  // In the URL, so opening a withdrawal and coming back keeps the filter, the
  // page and the scroll position.
  const [query, patch, clearAllFilters] = useListQueryState(DEFAULTS);
  const { page, status } = query;
  const setPage = (next: number) => patch({ page: next });

  const hasActiveFilters = status !== 'all';

  const queryFilters = useMemo(
    () => ({ page_size: PAGE_SIZE, status: status === 'all' ? undefined : status }),
    [status]
  );

  const isCompact = useIsCompact();
  const { data, isLoading, isError, error, refetch } = useWithdrawalsListQuery(
    { ...queryFilters, page },
    { enabled: isCompact === false }
  );
  const mobile = useWithdrawalsInfiniteQuery(queryFilters, { enabled: isCompact === true });

  const columns = useWithdrawalTableColumns();

  const rows = data?.data?.results ?? [];
  const totalItems = data?.data?.count ?? rows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  const toolbarFilters: ToolbarFilter[] = [
    {
      key: 'status',
      label: 'Request status',
      value: status,
      options: STATUS_OPTIONS,
      placeholder: 'All Statuses',
      widthClass: 'w-[160px]',
      onChange: (val) => patch({ status: val, page: 1 }),
    },
  ];

  return (
    <div className="space-y-5 pb-8 sm:space-y-6">
      <PageHeader title="Withdrawals" />

      <Card>
        <ListToolbar
          filters={toolbarFilters}
          onClear={clearAllFilters}
          hasActiveFilters={hasActiveFilters}
        />

        <ResponsiveDataView
          columns={columns}
          data={rows}
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRetry={() => refetch()}
          mobile={mobile}
          emptyMessage="No withdrawal requests found"
          emptyHint="Nothing here yet. Empty is expected until members request a payout."
          rowKey="id"
          pagination={
            data?.data ? (
              <DataTablePagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalItems}
                onPageChange={setPage}
              />
            ) : null
          }
        />
      </Card>
    </div>
  );
}
