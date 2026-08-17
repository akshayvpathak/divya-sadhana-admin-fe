'use client';

import { useState } from 'react';
import { useAiReadingsListQuery } from '@/hooks/queries/useAiReadingsQuery';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/common/DataTable/DataTable';
import { useAiReadingsTableColumns } from '@/hooks/tables/useAiReadingsTableColumns';
import { useDebounce } from '@/hooks/useDebounce';
import { DataTablePagination } from '@/components/common/DataTablePagination';
import { FilterManager, useFilterManager } from '@/components/common/FilterManager';
import { aiReadingStatusOptions } from '@/components/ui/badges/badge-status';
import { failureCodeOptions } from '@/lib/reading-failures';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardBand } from '@/components/ui/card';

export default function AiReadingsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [sort, setSort] = useState('-created_at');

  const { filters, handleFilterChange, resetFilters, hasActiveFilters: filterManagerActive } = useFilterManager({
    status: 'all',
    serviceKind: 'all',
    failureCode: 'all',
  }, () => setPage(1));

  // Button visible when search or any filter is active
  const hasActiveFilters = search !== '' || filterManagerActive;

  const { data, isLoading } = useAiReadingsListQuery(
    page,
    debouncedSearch,
    filters.status,
    filters.serviceKind,
    sort,
    filters.failureCode
  );

  const handleSort = (field: string) => {
    setSort(field);
    setPage(1);
  };

  const totalPages = data?.data?.count ? Math.ceil(data.data.count / 10) : 1;
  const columns = useAiReadingsTableColumns();

  const filterConfigs = [
    {
      key: 'serviceKind',
      placeholder: 'All Services',
      options: [
        { value: 'all', label: 'All Services' },
        { value: 'face_reading', label: 'Face Reading' },
        { value: 'palm_reading', label: 'Palm Reading' },
      ],
      widthClass: 'w-[160px]',
    },
    {
      key: 'status',
      placeholder: 'All Status',
      options: aiReadingStatusOptions,
      widthClass: 'w-[140px]',
    },
    // Pre-check rejection rate is the metric that tells us whether the upload
    // guidance is working, so it needs to be filterable, not just visible.
    {
      key: 'failureCode',
      placeholder: 'Any failure',
      options: failureCodeOptions,
      widthClass: 'w-[190px]',
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="AI Readings"
      />

      <Card>
        <CardBand className="flex flex-col items-center justify-between gap-4 border-b border-line md:flex-row">
          <div className="relative max-w-sm flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-moon" />
            <Input
              placeholder="Search AI Reports..."
              className="pl-9 bg-surface w-full"
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
          emptyMessage="No AI readings found"
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
