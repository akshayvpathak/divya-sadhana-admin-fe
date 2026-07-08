'use client';

import { useState } from 'react';
import { useOrdersListQuery } from '@/hooks/queries/useOrdersQuery';
import { Search, Filter } from 'lucide-react';
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

  const { data, isLoading } = useOrdersListQuery(
    page,
    debouncedSearch,
    sort,
    {
      status: status === 'all' ? undefined : status,
      payment_status: paymentStatus === 'all' ? undefined : paymentStatus,
      shipping_status: shippingStatus === 'all' ? undefined : shippingStatus,
    }
  );

  const handleSort = (field: string) => {
    setSort(field);
    setPage(1);
  };

  const totalPages = data?.data?.count ? Math.ceil(data.data.count / 10) : 1;
  const columns = useOrderTableColumns();

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Orders</h1>
          <p className="text-slate-500 mt-1">Manage platform orders</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col lg:flex-row gap-4 items-start justify-between">
          <div className="relative max-w-sm flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search Orders..."
              className="pl-9 bg-white"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center w-full lg:w-auto">
            <Filter className="h-4 w-4 text-slate-400 shrink-0" />

            {/* Order Status */}
            <Select
              value={status}
              onValueChange={(val) => {
                setStatus(val || 'all');
                setPage(1);
              }}
            >
              <SelectTrigger className="bg-white w-[150px]">
                <SelectValue placeholder="All Statuses">
                  {orderStatusOptions.find(o => o.value === status)?.label || 'All Statuses'}
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

            {/* Payment Status */}
            <Select
              value={paymentStatus}
              onValueChange={(val) => {
                setPaymentStatus(val || 'all');
                setPage(1);
              }}
            >
              <SelectTrigger className="bg-white w-[155px]">
                <SelectValue placeholder="All Payment">
                  {orderPaymentOptions.find(o => o.value === paymentStatus)?.label || 'All Payment'}
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

            {/* Shipping Status */}
            <Select
              value={shippingStatus}
              onValueChange={(val) => {
                setShippingStatus(val || 'all');
                setPage(1);
              }}
            >
              <SelectTrigger className="bg-white w-[200px]">
                <SelectValue placeholder="All Shipping">
                  {orderShippingOptions.find(o => o.value === shippingStatus)?.label || 'All Shipping'}
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
