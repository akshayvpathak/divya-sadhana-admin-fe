'use client';

import { useMemo, useState } from 'react';
import {
  useServiceBookingsListQuery,
  useServiceBookingsInfiniteQuery,
} from '@/hooks/queries/useServiceBookingsQuery';
import { useAllSadhanaServicesQuery } from '@/hooks/queries/useSadhanaServicesQuery';
import { ResponsiveDataView } from '@/components/common/ResponsiveDataView';
import { ListToolbar, ToolbarFilter } from '@/components/common/ListToolbar';
import { useServiceBookingTableColumns } from '@/hooks/tables/useServiceBookingTableColumns';
import { useDebounce } from '@/hooks/useDebounce';
import { useIsCompact } from '@/hooks/useMediaQuery';
import { DataTablePagination } from '@/components/common/DataTablePagination';
import { useFilterManager } from '@/components/common/FilterManager';
import { serviceBookingStatusOptions } from '@/components/ui/badges/badge-status';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/common/PageHeader';

export default function ServiceBookingsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [sort, setSort] = useState('');

  const {
    filters,
    handleFilterChange,
    getApiParams,
    resetFilters,
    hasActiveFilters: filterManagerActive,
  } = useFilterManager({ status: 'all', service: 'all' }, () => setPage(1));

  const apiParams = getApiParams();
  const hasActiveFilters = search !== '' || filterManagerActive;

  const { data: services } = useAllSadhanaServicesQuery();

  const queryFilters = useMemo(
    () => ({
      status: apiParams.status,
      service__slug: apiParams.service,
      search: debouncedSearch,
      ordering: sort,
    }),
    [apiParams.status, apiParams.service, debouncedSearch, sort]
  );

  const isCompact = useIsCompact();
  const { data, isLoading } = useServiceBookingsListQuery(
    { ...queryFilters, page },
    { enabled: isCompact === false }
  );
  const mobile = useServiceBookingsInfiniteQuery(queryFilters, {
    enabled: isCompact === true,
  });

  const columns = useServiceBookingTableColumns();
  const totalPages = data?.data?.count ? Math.ceil(data.data.count / 10) : 1;

  const serviceOptions = useMemo(
    () => [
      { value: 'all', label: 'All Services' },
      ...(services ?? []).map((s) => ({ value: s.slug, label: s.name })),
    ],
    [services]
  );

  const toolbarFilters: ToolbarFilter[] = [
    {
      key: 'status',
      label: 'Status',
      value: filters.status,
      options: serviceBookingStatusOptions,
      placeholder: 'All Statuses',
      widthClass: 'w-[170px]',
      onChange: (val) => handleFilterChange('status', val),
    },
    {
      key: 'service',
      label: 'Service',
      value: filters.service,
      options: serviceOptions,
      placeholder: 'All Services',
      widthClass: 'w-[190px]',
      onChange: (val) => handleFilterChange('service', val),
    },
  ];

  const handleSort = (field: string) => {
    setSort(field);
    setPage(1);
  };

  return (
    <div className="space-y-5 pb-8 sm:space-y-6">
      <PageHeader title="Service Bookings" />

      <Card>
        <ListToolbar
          search={{
            value: search,
            placeholder: 'Search bookings...',
            onChange: (val) => {
              setSearch(val);
              setPage(1);
            },
          }}
          filters={toolbarFilters}
          onClear={() => {
            resetFilters();
            setSearch('');
            setPage(1);
          }}
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
          emptyMessage="No service bookings found"
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
