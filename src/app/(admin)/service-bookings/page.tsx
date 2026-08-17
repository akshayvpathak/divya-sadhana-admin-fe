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
import { Card, CardBand } from '@/components/ui/card';
import { PageHeader } from '@/components/common/PageHeader';

export default function ServiceBookingsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [sort, setSort] = useState('');

  const { filters, handleFilterChange, getApiParams, resetFilters, hasActiveFilters: filterManagerActive } = useFilterManager(
    { status: 'all', service: 'all' },
    () => setPage(1),
  );
  const apiParams = getApiParams();

  // Button visible when search or any filter is active
  const hasActiveFilters = search !== '' || filterManagerActive;

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
      <PageHeader
        title="Service Bookings"
      />

      <Card>
        <CardBand className="flex flex-col items-center justify-between gap-4 border-b border-line md:flex-row">
          <div className="relative w-full max-w-sm flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-moon" />
            <Input
              placeholder="Search bookings..."
              className="bg-surface pl-9 w-full"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <FilterManager
            configs={filterConfigs}
            values={filters}
            onFilterChange={handleFilterChange}
            onClear={() => { resetFilters(); setSearch(''); setPage(1); }}
            hasActiveFilters={hasActiveFilters}
          />
        </CardBand>

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
      </Card>
    </div>
  );
}
