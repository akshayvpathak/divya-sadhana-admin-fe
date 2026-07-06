'use client';

import { useState } from 'react';
import { useDonationsListQuery } from '@/hooks/queries/useDonationsQuery';
import { useAllDonationCampaignsQuery } from '@/hooks/queries/useDonationCampaignsQuery';
import { Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/common/DataTable/DataTable';
import { useDonationTableColumns } from '@/hooks/tables/useDonationTableColumns';
import { useDebounce } from '@/hooks/useDebounce';
import { DataTablePagination } from '@/components/common/DataTablePagination';
import { TableFilter } from '@/components/common/TableFilter';

export default function DonationsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [status, setStatus] = useState('all');
  const [campaign, setCampaign] = useState('all');
  const [sort, setSort] = useState('-paid_at');

  const { data: campaignsData } = useAllDonationCampaignsQuery();
  const { data, isLoading } = useDonationsListQuery({
    page,
    search: debouncedSearch,
    status: status === 'all' ? undefined : status,
    campaign: campaign === 'all' ? undefined : campaign,
    sort
  });

  const handleSort = (field: string) => {
    setSort(field);
    setPage(1);
  };

  const totalPages = data?.data?.count ? Math.ceil(data.data.count / 10) : 1;
  const columns = useDonationTableColumns();

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'paid', label: 'Paid' },
    { value: 'pending', label: 'Pending' },
    { value: 'failed', label: 'Failed' },
    { value: 'refunded', label: 'Refunded' },
  ];

  const campaignOptions = [
    { value: 'all', label: 'All Campaigns' },
    ...(campaignsData?.map((c) => ({ value: c.id, label: c.title })) || []),
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

          <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center w-full sm:w-auto justify-end">
            <Filter className="h-4 w-4 text-slate-400 shrink-0" />
            
            <TableFilter
              value={campaign}
              onValueChange={(val) => {
                setCampaign(val);
                setPage(1);
              }}
              options={campaignOptions}
              placeholder="All Campaigns"
              widthClass="w-[180px]"
            />

            <TableFilter
              value={status}
              onValueChange={(val) => {
                setStatus(val);
                setPage(1);
              }}
              options={statusOptions}
              placeholder="All Status"
              widthClass="w-[140px]"
            />
          </div>
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
