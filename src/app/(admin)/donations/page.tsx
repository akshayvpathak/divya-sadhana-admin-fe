'use client';

import { useState } from 'react';
import { useDonationsListQuery } from '@/hooks/queries/useDonationsQuery';
import { useAllDonationCampaignsQuery } from '@/hooks/queries/useDonationCampaignsQuery';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/common/DataTable/DataTable';
import { useDonationTableColumns } from '@/hooks/tables/useDonationTableColumns';
import { useDebounce } from '@/hooks/useDebounce';
import { DataTablePagination } from '@/components/common/DataTablePagination';
import { FilterManager, useFilterManager } from '@/components/common/FilterManager';
import { donationStatusOptions } from '@/components/ui/badges/badge-status';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardBand } from '@/components/ui/card';

export default function DonationsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [sort, setSort] = useState('-paid_at');

  const { data: campaignsData } = useAllDonationCampaignsQuery();

  // Paid is the default view — unpaid donations are mostly abandoned checkouts.
  const { filters, handleFilterChange, getApiParams, resetFilters, hasActiveFilters: filterManagerActive } = useFilterManager({
    status: 'paid',
    campaign: 'all',
  }, () => setPage(1));

  const apiParams = getApiParams();

  // Button visible when search or any filter is active
  const hasActiveFilters = search !== '' || filterManagerActive;

  const { data, isLoading } = useDonationsListQuery({
    page,
    search: debouncedSearch,
    status: apiParams.status,
    campaign: apiParams.campaign,
    sort
  });

  const handleSort = (field: string) => {
    setSort(field);
    setPage(1);
  };

  const totalPages = data?.data?.count ? Math.ceil(data.data.count / 10) : 1;
  const columns = useDonationTableColumns();

  const statusOptions = donationStatusOptions;
  const campaignOptions = [
    { value: 'all', label: 'All Campaigns' },
    ...(campaignsData || []).map((c: any) => ({
      value: c.id,
      label: c.title,
    })),
  ];

  const filterConfigs = [
    {
      key: 'campaign',
      placeholder: 'All Campaigns',
      options: campaignOptions,
      widthClass: 'w-[180px]',
    },
    {
      key: 'status',
      placeholder: 'All Status',
      options: statusOptions,
      widthClass: 'w-[140px]',
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Donations"
        description="Manage platform donations"
      />

      <Card>
        <CardBand className="flex flex-col items-center justify-between gap-4 border-b border-line md:flex-row">
          <div className="relative max-w-sm flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-moon" />
            <Input
              placeholder="Search Donations..."
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
          emptyMessage="No donations found"
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
