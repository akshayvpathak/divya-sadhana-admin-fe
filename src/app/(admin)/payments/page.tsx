'use client';

import { useState } from 'react';
import {
  usePaymentsListQuery,
  usePaymentsInfiniteQuery,
} from '@/hooks/queries/usePaymentsQuery';
import { ResponsiveDataView } from '@/components/common/ResponsiveDataView';
import { ListToolbar, ToolbarFilter } from '@/components/common/ListToolbar';
import { usePaymentTableColumns } from '@/hooks/tables/usePaymentTableColumns';
import { useDebounce } from '@/hooks/useDebounce';
import { useIsCompact } from '@/hooks/useMediaQuery';
import { DataTablePagination } from '@/components/common/DataTablePagination';
import {
  paymentPageStatusOptions,
  paymentSourceOptions,
} from '@/components/ui/badges/badge-status';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/card';

export default function PaymentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [status, setStatus] = useState('all');
  const [source, setSource] = useState('all');

  const clearAllFilters = () => {
    setSearch('');
    setStatus('all');
    setSource('all');
    setPage(1);
  };

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
      onChange: (val) => {
        setSource(val);
        setPage(1);
      },
    },
    {
      key: 'status',
      label: 'Payment status',
      value: status,
      options: paymentPageStatusOptions,
      placeholder: 'All Statuses',
      widthClass: 'w-[140px]',
      onChange: (val) => {
        setStatus(val);
        setPage(1);
      },
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
            onChange: (val) => {
              setSearch(val);
              setPage(1);
            },
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
