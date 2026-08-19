'use client';

import { useMemo, useState } from 'react';
import {
  useOrdersListQuery,
  useOrdersInfiniteQuery,
  useExportOrdersCsvMutation,
  useShippingInfoQuery,
} from '@/hooks/queries/useOrdersQuery';
import { Download, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResponsiveDataView } from '@/components/common/ResponsiveDataView';
import { ListToolbar, ToolbarFilter } from '@/components/common/ListToolbar';
import { useOrderTableColumns } from '@/hooks/tables/useOrderTableColumns';
import { useDebounce } from '@/hooks/useDebounce';
import { useIsCompact } from '@/hooks/useMediaQuery';
import { DataTablePagination } from '@/components/common/DataTablePagination';
import {
  orderStatusOptions,
  orderPaymentOptions,
  orderShippingOptions,
} from '@/components/ui/badges/badge-status';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/card';

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [sort, setSort] = useState('-created_at');

  const [status, setStatus] = useState('all');
  const [paymentStatus, setPaymentStatus] = useState('all');
  const [shippingStatus, setShippingStatus] = useState('all');

  const hasActiveFilters =
    search !== '' ||
    status !== 'all' ||
    paymentStatus !== 'all' ||
    shippingStatus !== 'all';

  const clearAllFilters = () => {
    setSearch('');
    setStatus('all');
    setPaymentStatus('all');
    setShippingStatus('all');
    setPage(1);
    setSort('');
  };

  const filters = useMemo(
    () => ({
      status: status === 'all' ? undefined : status,
      payment_status: paymentStatus === 'all' ? undefined : paymentStatus,
      shipping_status: shippingStatus === 'all' ? undefined : shippingStatus,
    }),
    [status, paymentStatus, shippingStatus]
  );

  // Exactly one of the two runs: the table's page query above `lg`, the card
  // list's infinite query below it.
  const isCompact = useIsCompact();
  const { data, isLoading } = useOrdersListQuery(page, debouncedSearch, sort, filters, {
    enabled: isCompact === false,
  });
  const mobile = useOrdersInfiniteQuery(debouncedSearch, sort, filters, {
    enabled: isCompact === true,
  });

  const { data: shippingInfo } = useShippingInfoQuery();
  const { mutate: exportCsv, isPending: exporting } = useExportOrdersCsvMutation();

  const handleSort = (field: string) => {
    setSort(field);
    setPage(1);
  };

  const totalPages = data?.data?.count ? Math.ceil(data.data.count / 10) : 1;
  const columns = useOrderTableColumns();

  const toolbarFilters: ToolbarFilter[] = [
    {
      key: 'status',
      label: 'Order status',
      value: status,
      options: orderStatusOptions,
      placeholder: 'All Statuses',
      widthClass: 'w-[150px]',
      onChange: (val) => {
        setStatus(val);
        setPage(1);
      },
    },
    {
      key: 'payment_status',
      label: 'Payment status',
      value: paymentStatus,
      options: orderPaymentOptions,
      placeholder: 'All Payment',
      widthClass: 'w-[155px]',
      onChange: (val) => {
        setPaymentStatus(val);
        setPage(1);
      },
    },
    {
      key: 'shipping_status',
      label: 'Shipping status',
      value: shippingStatus,
      options: orderShippingOptions,
      placeholder: 'All Shipping',
      widthClass: 'w-[190px]',
      onChange: (val) => {
        setShippingStatus(val);
        setPage(1);
      },
    },
  ];

  return (
    <div className="space-y-5 pb-8 sm:space-y-6">
      <PageHeader
        title="Orders"
        actions={
          <Button
            variant="outline"
            disabled={exporting}
            onClick={() => exportCsv()}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {exporting ? 'Exporting…' : 'Export CSV'}
          </Button>
        }
      />

      {shippingInfo ? (
        <div className="flex items-start gap-3 rounded-xl border border-gold/25 bg-tint px-4 py-3 text-sm text-ink">
          <Truck className="mt-0.5 h-4 w-4 shrink-0 text-gold-press" />
          <div className="min-w-0">
            <p className="font-semibold">Customer delivery estimate</p>
            <p className="mt-0.5 text-ink/80">
              {shippingInfo.delivery_estimate_text}
              {shippingInfo.measured_from === 'order_date'
                ? ' (measured from order date, not dispatch).'
                : ''}
            </p>
            <p className="mt-1 text-xs text-gold-press/70">
              Carriers: {shippingInfo.carriers.map((c) => c.name).join(' · ') || '—'}
              {' · '}
              Edit estimate copy in Django admin (API is read-only).
            </p>
          </div>
        </div>
      ) : null}

      <Card>
        <ListToolbar
          search={{
            value: search,
            placeholder: 'Search Orders...',
            onChange: (val) => {
              setSearch(val);
              setPage(1);
            },
          }}
          filters={toolbarFilters}
          onClear={clearAllFilters}
          hasActiveFilters={hasActiveFilters}
          sortColumns={columns}
          sort={sort}
          onSort={handleSort}
        />

        <ResponsiveDataView
          columns={columns}
          data={data?.data?.results || []}
          isLoading={isLoading}
          sort={sort}
          onSort={handleSort}
          mobile={mobile}
          emptyMessage="No orders found"
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
