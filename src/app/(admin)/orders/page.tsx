'use client';

import { useState } from 'react';
import {
  useOrdersListQuery,
  useExportOrdersCsvMutation,
  useShippingInfoQuery,
} from '@/hooks/queries/useOrdersQuery';
import { Search, Filter, Download, Truck } from 'lucide-react';
import { ClearFiltersButton } from '@/components/common/ClearFiltersButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/common/DataTable/DataTable';
import { useOrderTableColumns } from '@/hooks/tables/useOrderTableColumns';
import { useDebounce } from '@/hooks/useDebounce';
import { DataTablePagination } from '@/components/common/DataTablePagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { orderStatusOptions, orderPaymentOptions, orderShippingOptions } from '@/components/ui/badges/badge-status';

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

  const { data, isLoading } = useOrdersListQuery(page, debouncedSearch, sort, {
    status: status === 'all' ? undefined : status,
    payment_status: paymentStatus === 'all' ? undefined : paymentStatus,
    shipping_status: shippingStatus === 'all' ? undefined : shippingStatus,
  });

  const { data: shippingInfo } = useShippingInfoQuery();
  const { mutate: exportCsv, isPending: exporting } = useExportOrdersCsvMutation();

  const handleSort = (field: string) => {
    setSort(field);
    setPage(1);
  };

  const totalPages = data?.data?.count ? Math.ceil(data.data.count / 10) : 1;
  const columns = useOrderTableColumns();

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Orders</h1>
          <p className="mt-1 text-slate-500">Manage platform orders and manual fulfillment</p>
        </div>
        <Button
          variant="outline"
          disabled={exporting}
          onClick={() => exportCsv()}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          {exporting ? 'Exporting…' : 'Export CSV'}
        </Button>
      </div>

      {shippingInfo ? (
        <div className="flex items-start gap-3 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-950">
          <Truck className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
          <div>
            <p className="font-semibold">Customer delivery estimate</p>
            <p className="mt-0.5 text-indigo-900/80">
              {shippingInfo.delivery_estimate_text}
              {shippingInfo.measured_from === 'order_date'
                ? ' (measured from order date, not dispatch).'
                : ''}
            </p>
            <p className="mt-1 text-xs text-indigo-800/70">
              Carriers: {shippingInfo.carriers.map((c) => c.name).join(' · ') || '—'}
              {' · '}
              Edit estimate copy in Django admin (API is read-only).
            </p>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 p-4 md:flex-row">
          <div className="relative w-full max-w-sm flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search Orders..."
              className="w-full bg-white pl-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 sm:flex-nowrap md:w-auto">
            <Filter className="h-4 w-4 shrink-0 text-slate-400" />
            <Select
              value={status}
              onValueChange={(val) => {
                setStatus(val || 'all');
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[150px] bg-white">
                <SelectValue placeholder="All Statuses">
                  {orderStatusOptions.find((o) => o.value === status)?.label || 'All Statuses'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {orderStatusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={paymentStatus}
              onValueChange={(val) => {
                setPaymentStatus(val || 'all');
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[155px] bg-white">
                <SelectValue placeholder="All Payment">
                  {orderPaymentOptions.find((o) => o.value === paymentStatus)?.label ||
                    'All Payment'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {orderPaymentOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={shippingStatus}
              onValueChange={(val) => {
                setShippingStatus(val || 'all');
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[200px] bg-white">
                <SelectValue placeholder="All Shipping">
                  {orderShippingOptions.find((o) => o.value === shippingStatus)?.label ||
                    'All Shipping'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {orderShippingOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <ClearFiltersButton onClear={clearAllFilters} className="ml-auto" />
            )}
          </div>
        </div>

        <DataTable
          columns={columns}
          data={data?.data?.results || []}
          isLoading={isLoading}
          sort={sort}
          onSort={handleSort}
          emptyMessage="No orders found"
        />

        {data?.data && (
          <DataTablePagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={data.data.count}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
}
