'use client';

import {
  useAiReadingsListQuery,
  useAiReadingsInfiniteQuery,
} from '@/hooks/queries/useAiReadingsQuery';
import { ResponsiveDataView } from '@/components/common/ResponsiveDataView';
import { ListToolbar, ToolbarFilter } from '@/components/common/ListToolbar';
import { useAiReadingsTableColumns } from '@/hooks/tables/useAiReadingsTableColumns';
import { useDebounce } from '@/hooks/useDebounce';
import { useListQueryState } from '@/hooks/useListQueryState';
import { useIsCompact } from '@/hooks/useMediaQuery';
import { DataTablePagination } from '@/components/common/DataTablePagination';
import { useUrlFilterManager } from '@/components/common/FilterManager';
import { aiReadingStatusOptions } from '@/components/ui/badges/badge-status';
import { failureCodeOptions } from '@/lib/reading-failures';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/card';

const SERVICE_KIND_OPTIONS = [
  { value: 'all', label: 'All Services' },
  { value: 'face_reading', label: 'Face Reading' },
  { value: 'palm_reading', label: 'Palm Reading' },
];

/** Defaults double as the URL contract: anything at its default stays out of the query. */
const DEFAULTS = { page: 1, search: "", sort: "-created_at", status: "all", serviceKind: "all", failureCode: "all" };

export default function AiReadingsPage() {
  // In the URL, so opening a record and coming back keeps the filters, the
  // page and the scroll position.
  const [query, patch, resetQuery] = useListQueryState(DEFAULTS);
  const { page, search, sort } = query;
  const setPage = (next: number) => patch({ page: next });
  const debouncedSearch = useDebounce(search, 300);

  const {
    filters,
    handleFilterChange,
    hasActiveFilters: filterManagerActive,
  } = useUrlFilterManager({
      status: 'all',
      serviceKind: 'all',
      failureCode: 'all',
    }, query, patch);

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

  const handleSort = (field: string) => patch({ sort: field, page: 1 });

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
            onChange: (val) => patch({ search: val, page: 1 }),
          }}
          filters={toolbarFilters}
          onClear={resetQuery}
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
