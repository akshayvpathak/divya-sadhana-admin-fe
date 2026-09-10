'use client';

import { useState } from 'react';
import {
  useAiReadingsListQuery,
  useAiReadingsInfiniteQuery,
} from '@/hooks/queries/useAiReadingsQuery';
import { ResponsiveDataView } from '@/components/common/ResponsiveDataView';
import { ListToolbar, ToolbarFilter } from '@/components/common/ListToolbar';
import { useAiReadingsTableColumns } from '@/hooks/tables/useAiReadingsTableColumns';
import { useDebounce } from '@/hooks/useDebounce';
import { useIsCompact } from '@/hooks/useMediaQuery';
import { DataTablePagination } from '@/components/common/DataTablePagination';
import { useFilterManager } from '@/components/common/FilterManager';
import { aiReadingStatusOptions } from '@/components/ui/badges/badge-status';
import { failureCodeOptions } from '@/lib/reading-failures';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/card';

const SERVICE_KIND_OPTIONS = [
  { value: 'all', label: 'All Services' },
  { value: 'face_reading', label: 'Face Reading' },
  { value: 'palm_reading', label: 'Palm Reading' },
];

export default function AiReadingsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [sort, setSort] = useState('-created_at');

  const {
    filters,
    handleFilterChange,
    resetFilters,
    hasActiveFilters: filterManagerActive,
  } = useFilterManager(
    {
      status: 'all',
      serviceKind: 'all',
      failureCode: 'all',
    },
    () => setPage(1)
  );

  const hasActiveFilters = search !== '' || filterManagerActive;

  const isCompact = useIsCompact();
  const { data, isLoading } = useAiReadingsListQuery(
    page,
    debouncedSearch,
    filters.status,
    filters.serviceKind,
    sort,
    filters.failureCode,
    { enabled: isCompact === false }
  );
  const mobile = useAiReadingsInfiniteQuery(
    debouncedSearch,
    filters.status,
    filters.serviceKind,
    sort,
    filters.failureCode,
    { enabled: isCompact === true }
  );

  const handleSort = (field: string) => {
    setSort(field);
    setPage(1);
  };

  const totalPages = data?.data?.count ? Math.ceil(data.data.count / 10) : 1;
  const columns = useAiReadingsTableColumns();

  const toolbarFilters: ToolbarFilter[] = [
    {
      key: 'serviceKind',
      label: 'Service',
      value: filters.serviceKind,
      options: SERVICE_KIND_OPTIONS,
      placeholder: 'All Services',
      widthClass: 'w-[160px]',
      onChange: (val) => handleFilterChange('serviceKind', val),
    },
    {
      key: 'status',
      label: 'Status',
      value: filters.status,
      options: aiReadingStatusOptions,
      placeholder: 'All Status',
      widthClass: 'w-[140px]',
      onChange: (val) => handleFilterChange('status', val),
    },
    // Pre-check rejection rate is the metric that tells us whether the upload
    // guidance is working, so it needs to be filterable, not just visible.
    {
      key: 'failureCode',
      label: 'Failure reason',
      value: filters.failureCode,
      options: failureCodeOptions,
      placeholder: 'Any failure',
      widthClass: 'w-[190px]',
      onChange: (val) => handleFilterChange('failureCode', val),
    },
  ];

  return (
    <div className="space-y-5 pb-8 sm:space-y-6">
      <PageHeader title="AI Readings" />

      <Card>
        <ListToolbar
          search={{
            value: search,
            placeholder: 'Search AI Reports...',
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
          emptyMessage="No AI readings found"
          emptyHint="Nothing here yet. Empty is expected until customers unlock a reading."
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
