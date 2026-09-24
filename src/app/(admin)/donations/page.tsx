'use client';

import { useMemo } from 'react';
import {
  useDonationsListQuery,
  useDonationsInfiniteQuery,
} from '@/hooks/queries/useDonationsQuery';
import { useAllDonationCampaignsQuery } from '@/hooks/queries/useDonationCampaignsQuery';
import { ResponsiveDataView } from '@/components/common/ResponsiveDataView';
import { ListToolbar, ToolbarFilter } from '@/components/common/ListToolbar';
import { useDonationTableColumns } from '@/hooks/tables/useDonationTableColumns';
import { useDebounce } from '@/hooks/useDebounce';
import { useListQueryState } from '@/hooks/useListQueryState';
import { useIsCompact } from '@/hooks/useMediaQuery';
import { DataTablePagination } from '@/components/common/DataTablePagination';
import { useUrlFilterManager } from '@/components/common/FilterManager';
import { donationStatusOptions } from '@/components/ui/badges/badge-status';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/card';

/** Defaults double as the URL contract: anything at its default stays out of the query. */
const DEFAULTS = { page: 1, search: "", sort: "-paid_at", status: "paid", campaign: "all" };

export default function DonationsPage() {
  // In the URL, so opening a record and coming back keeps the filters, the
  // page and the scroll position.
  const [query, patch, resetQuery] = useListQueryState(DEFAULTS);
  const { page, search, sort } = query;
  const setPage = (next: number) => patch({ page: next });
  const debouncedSearch = useDebounce(search, 300);

  const { data: campaignsData } = useAllDonationCampaignsQuery();

  // Paid is the default view — unpaid donations are mostly abandoned checkouts.
  const {
    filters,
    handleFilterChange,
    getApiParams,
    hasActiveFilters: filterManagerActive,
  } = useUrlFilterManager({
      status: 'paid',
      campaign: 'all',
    }, query, patch);

  const apiParams = getApiParams();
  const hasActiveFilters = search !== '' || filterManagerActive;

  const queryFilters = useMemo(
    () => ({
      search: debouncedSearch,
      status: apiParams.status,
      campaign: apiParams.campaign,
      sort,
    }),
    [debouncedSearch, apiParams.status, apiParams.campaign, sort]
  );

  const isCompact = useIsCompact();
  const { data, isLoading } = useDonationsListQuery(
    { ...queryFilters, page },
    { enabled: isCompact === false }
  );
  const mobile = useDonationsInfiniteQuery(queryFilters, { enabled: isCompact === true });

  const handleSort = (field: string) => patch({ sort: field, page: 1 });

  const totalPages = data?.data?.count ? Math.ceil(data.data.count / 10) : 1;
  const columns = useDonationTableColumns();

  const campaignOptions = useMemo(
    () => [
      { value: 'all', label: 'All Campaigns' },
      ...(campaignsData || []).map((c: { id: string; title: string }) => ({
        value: c.id,
        label: c.title,
      })),
    ],
    [campaignsData]
  );

  const toolbarFilters: ToolbarFilter[] = [
    {
      key: 'campaign',
      label: 'Campaign',
      value: filters.campaign,
      options: campaignOptions,
      placeholder: 'All Campaigns',
      widthClass: 'w-[180px]',
      onChange: (val) => handleFilterChange('campaign', val),
    },
    {
      key: 'status',
      label: 'Status',
      value: filters.status,
      options: donationStatusOptions,
      placeholder: 'All Status',
      widthClass: 'w-[140px]',
      defaultValue: 'paid',
      onChange: (val) => handleFilterChange('status', val),
    },
  ];

  return (
    <div className="space-y-5 pb-8 sm:space-y-6">
      <PageHeader title="Donations" />

      <Card>
        <ListToolbar
          search={{
            value: search,
            placeholder: 'Search Donations...',
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
          emptyMessage="No donations found"
          emptyHint="Nothing here yet. Empty is expected until real donations arrive."
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
