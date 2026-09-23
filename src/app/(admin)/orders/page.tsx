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
import { Card, CardBand } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  DATE_RANGE_OPTIONS,
  DateRangePreset,
  resolveDateRange,
  today,
} from '@/lib/date-range';
import { cn } from '@/lib/utils';

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [sort, setSort] = useState('-created_at');

  const [status, setStatus] = useState('all');
  const [paymentStatus, setPaymentStatus] = useState('all');
  const [shippingStatus, setShippingStatus] = useState('all');

  const [datePreset, setDatePreset] = useState<DateRangePreset>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const dateError =
    datePreset === 'custom' && customStart && customEnd && customStart > customEnd
      ? 'Start date must be on or before the end date.'
      : null;

  const hasActiveFilters =
    search !== '' ||
    status !== 'all' ||
    paymentStatus !== 'all' ||
    shippingStatus !== 'all' ||
    datePreset !== 'all';

  const clearAllFilters = () => {
    setSearch('');
    setStatus('all');
    setPaymentStatus('all');
    setShippingStatus('all');
    setDatePreset('all');
    setCustomStart('');
    setCustomEnd('');
    setPage(1);
    setSort('');
  };

  const applyDatePreset = (preset: DateRangePreset) => {
    setDatePreset(preset);
    setPage(1);
    if (preset !== 'custom') {
      setCustomStart('');
      setCustomEnd('');
    }
  };

  const filters = useMemo(
    () => ({
      status: status === 'all' ? undefined : status,
      payment_status: paymentStatus === 'all' ? undefined : paymentStatus,
      shipping_status: shippingStatus === 'all' ? undefined : shippingStatus,
      ...resolveDateRange(datePreset, customStart, customEnd),
    }),
    [status, paymentStatus, shippingStatus, datePreset, customStart, customEnd]
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
    {
      key: 'date_range',
      label: 'Order date',
      value: datePreset,
      options: DATE_RANGE_OPTIONS,
      placeholder: 'All time',
      widthClass: 'w-[160px]',
      onChange: (val) => applyDatePreset(val as DateRangePreset),
    },
  ];

  return (
    <div className="space-y-5 pb-8 sm:space-y-6">
      <PageHeader
        title="Orders"
        actions={
          <Button
            variant="outline"
            disabled={exporting || !!dateError}
            onClick={() => exportCsv({ search: debouncedSearch, filters })}
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

        {datePreset === 'custom' && (
          <CardBand className="flex flex-col gap-3 border-b border-line sm:flex-row sm:items-end">
            <label className="flex flex-col gap-1.5 text-[11px] font-bold uppercase tracking-wide text-moon">
              From
              <Input
                type="date"
                value={customStart}
                max={customEnd || today()}
                onChange={(e) => {
                  setCustomStart(e.target.value);
                  setPage(1);
                }}
                className="h-11 w-full bg-surface sm:w-[180px]"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-[11px] font-bold uppercase tracking-wide text-moon">
              To
              <Input
                type="date"
                value={customEnd}
                min={customStart || undefined}
                max={today()}
                onChange={(e) => {
                  setCustomEnd(e.target.value);
                  setPage(1);
                }}
                className="h-11 w-full bg-surface sm:w-[180px]"
              />
            </label>
            {(dateError || !customStart || !customEnd) && (
              <p
                role={dateError ? 'alert' : undefined}
                className={cn(
                  'pb-2.5 text-xs',
                  dateError ? 'font-semibold text-danger' : 'text-moon'
                )}
              >
                {dateError ?? 'Pick both dates to apply the range.'}
              </p>
            )}
          </CardBand>
        )}

        <ResponsiveDataView
          columns={columns}
          data={data?.data?.results || []}
          isLoading={isLoading}
          sort={sort}
          onSort={handleSort}
          mobile={mobile}
          emptyMessage="No orders found"
          emptyHint={
            hasActiveFilters
              ? 'No orders match these filters. Try a wider date range or clear the filters.'
              : 'Nothing here yet. Empty is expected until real customers pay.'
          }
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
