'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useServiceBookingsListQuery } from '@/hooks/queries/useServiceBookingsQuery';
import { useAllSadhanaServicesQuery } from '@/hooks/queries/useSadhanaServicesQuery';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/common/DataTable/DataTable';
import { useServiceBookingTableColumns } from '@/hooks/tables/useServiceBookingTableColumns';
import { useDebounce } from '@/hooks/useDebounce';
import { DataTablePagination } from '@/components/common/DataTablePagination';
import { FilterManager, useFilterManager } from '@/components/common/FilterManager';
import { serviceBookingStatusOptions } from '@/components/ui/badges/badge-status';

export default function ServiceBookingsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [sort, setSort] = useState('');

  const { filters, handleFilterChange, getApiParams } = useFilterManager(
    { status: 'all', service: 'all' },
    () => setPage(1),
  );
  const apiParams = getApiParams();

  const { data: services } = useAllSadhanaServicesQuery();
  const { data, isLoading } = useServiceBookingsListQuery({
    page,
    status: apiParams.status,
    service__slug: apiParams.service,
    search: debouncedSearch,
    ordering: sort,
  });

  const columns = useServiceBookingTableColumns();
  const totalPages = data?.data?.count ? Math.ceil(data.data.count / 10) : 1;

  const serviceOptions = useMemo(
    () => [
      { value: 'all', label: 'All Services' },
      ...(services ?? []).map((s) => ({ value: s.slug, label: s.name })),
    ],
    [services],
  );

  const filterConfigs = [
    { key: 'status', placeholder: 'All Statuses', options: serviceBookingStatusOptions, widthClass: 'w-[170px]' },
    { key: 'service', placeholder: 'All Services', options: serviceOptions, widthClass: 'w-[190px]' },
  ];

  const handleSort = (field: string) => {
    setSort(field);
    setPage(1);
  };

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Service Bookings</h1>
        <p className="mt-1 text-slate-500">Manage seva / anushthan bookings and scheduling</p>
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 p-4 sm:flex-row">
          <div className="relative w-full max-w-sm flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search bookings..."
              className="bg-white pl-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <FilterManager configs={filterConfigs} values={filters} onFilterChange={handleFilterChange} />
        </div>

        <DataTable
          columns={columns}
          data={data?.data?.results || []}
          isLoading={isLoading}
          sort={sort}
          onSort={handleSort}
          emptyMessage="No service bookings found"
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
