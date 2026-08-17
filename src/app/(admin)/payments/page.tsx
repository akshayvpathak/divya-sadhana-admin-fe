'use client';

import { useState } from 'react';
import { usePaymentsListQuery } from '@/hooks/queries/usePaymentsQuery';
import { Search, Filter } from 'lucide-react';
import { ClearFiltersButton } from '@/components/common/ClearFiltersButton';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/common/DataTable/DataTable';
import { usePaymentTableColumns } from '@/hooks/tables/usePaymentTableColumns';
import { useDebounce } from '@/hooks/useDebounce';
import { DataTablePagination } from '@/components/common/DataTablePagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { paymentPageStatusOptions } from '@/components/ui/badges/badge-status';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardBand } from '@/components/ui/card';

export default function PaymentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [sort, setSort] = useState('-created_at');
  const [status, setStatus] = useState('all');

  // Function to clear all filters
  const clearAllFilters = () => {
    setSearch('');
    setStatus('all');
    setPage(1);
    setSort('');
  };

  // Determine if any filter is active
  const hasActiveFilters =
    search !== '' ||
    status !== 'all';
  
  const { data, isLoading } = usePaymentsListQuery(page, debouncedSearch, sort, status);

  const handleSort = (field: string) => {
    setSort(field);
    setPage(1);
  };

  const totalPages = data?.data?.count ? Math.ceil(data.data.count / 10) : 1;
  const columns = usePaymentTableColumns();

  return (
    <div className="space-y-6  pb-8">
      <PageHeader
        title="Payments"
      />

      <Card>
        <CardBand className="flex flex-col items-center justify-between gap-4 border-b border-line md:flex-row">
          <div className="relative max-w-sm flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-moon" />
            <Input
              placeholder="Search Payments..."
              className="pl-9 bg-surface w-full"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center w-full md:w-auto">
            <Filter className="h-4 w-4 text-moon shrink-0" />
            <Select
              value={status}
              onValueChange={(val) => {
                setStatus(val || 'all');
                setPage(1);
              }}
            >
              <SelectTrigger className="bg-surface w-[140px]">
                <SelectValue placeholder="All Statuses">
                  {paymentPageStatusOptions.find(o => o.value === status)?.label || 'All Statuses'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {paymentPageStatusOptions.map((opt) => (
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
        </CardBand>

        <DataTable
          columns={columns}
          data={data?.data?.results || []}
          isLoading={isLoading}
          sort={sort}
          onSort={handleSort}
          emptyMessage="No payments found"
        />

        {data?.data && (
          <DataTablePagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={data.data.count}
            onPageChange={setPage}
          />
        )}
      </Card>
    </div>
  );
}
