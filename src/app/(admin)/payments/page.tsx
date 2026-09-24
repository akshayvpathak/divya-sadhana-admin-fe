'use client';

import {
  usePaymentsListQuery,
  usePaymentsInfiniteQuery,
} from '@/hooks/queries/usePaymentsQuery';
import { ResponsiveDataView } from '@/components/common/ResponsiveDataView';
import { ListToolbar, ToolbarFilter } from '@/components/common/ListToolbar';
import { usePaymentTableColumns } from '@/hooks/tables/usePaymentTableColumns';
import { useDebounce } from '@/hooks/useDebounce';
import { useListQueryState } from '@/hooks/useListQueryState';
import { useIsCompact } from '@/hooks/useMediaQuery';
import { DataTablePagination } from '@/components/common/DataTablePagination';
import {
  paymentPageStatusOptions,
  paymentSourceOptions,
} from '@/components/ui/badges/badge-status';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/card';

/** Defaults double as the URL contract: anything at its default stays out of the query. */
const DEFAULTS = { page: 1, search: "", status: "all", source: "all" };

export default function PaymentsPage() {
  // In the URL, so opening a record and coming back keeps the filters, the
  // page and the scroll position.
  const [query, patch] = useListQueryState(DEFAULTS);
  const { page, search, status, source } = query;
  const setPage = (next: number) => patch({ page: next });
  const debouncedSearch = useDebounce(search, 300);

  const clearAllFilters = () => patch({ search: '', status: 'all', source: 'all', page: 1 });

  const hasActiveFilters =
    search !== '' || status !== 'all' || source !== 'all';

  const isCompact = useIsCompact();
  const { data, isLoading } = usePaymentsListQuery(
    page,
    debouncedSearch,
    status,
    source,
    { enabled: isCompact === false }
  );
  const mobile = usePaymentsInfiniteQuery(debouncedSearch, status, source, {
    enabled: isCompact === true,
  });

  const totalPages = data?.data?.count ? Math.ceil(data.data.count / 10) : 1;
  const columns = usePaymentTableColumns();

  const toolbarFilters: ToolbarFilter[] = [
    {
      key: 'source',
      label: 'Source',
      value: source,
      options: paymentSourceOptions,
      placeholder: 'All Sources',
      widthClass: 'w-[160px]',
      onChange: (val) => patch({ source: val, page: 1 }),
    },
    {
      key: 'status',
      label: 'Payment status',
      value: status,
      options: paymentPageStatusOptions,
      placeholder: 'All Statuses',
      widthClass: 'w-[140px]',
      onChange: (val) => patch({ status: val, page: 1 }),
    },
  ];

  return (
    <div className="space-y-5 pb-8 sm:space-y-6">
      <PageHeader title="Payments" />

      <Card>
        <ListToolbar
          search={{
            value: search,
            placeholder: 'Search Payments...',
            onChange: (val) => patch({ search: val, page: 1 }),
          }}
          filters={toolbarFilters}
          onClear={clearAllFilters}
          hasActiveFilters={hasActiveFilters}
        />

        <ResponsiveDataView
          columns={columns}
          data={data?.data?.results || []}
          isLoading={isLoading}
          mobile={mobile}
          emptyMessage="No payments found"
          emptyHint="Nothing here yet. Empty is expected until real payments land."
          pagination={
            data?.data ? (
              <DataTablePagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={data.data.count}
                onPageChange={setPage}
              />
            ) : null
          }
        />
      </Card>
    </div>
  );
}
