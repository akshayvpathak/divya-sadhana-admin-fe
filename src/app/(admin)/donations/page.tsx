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

export default function DonationsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [sort, setSort] = useState('-paid_at');

  const { data: campaignsData } = useAllDonationCampaignsQuery();

  const { filters, handleFilterChange, getApiParams } = useFilterManager({
    status: 'all',
    campaign: 'all',
  }, () => setPage(1));

  const apiParams = getApiParams();

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Donations</h1>
          <p className="text-slate-500 mt-1">Manage platform donations</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative max-w-sm flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search Donations..."
              className="pl-9 bg-white"
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
          />
        </div>

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
      </div>
    </div>
  );
}
