'use client';

import { useState } from 'react';
import { useDonationCampaignsListQuery, useDeleteDonationCampaignMutation } from '@/hooks/queries/useDonationCampaignsQuery';
import { Search, Plus } from 'lucide-react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { DataTable } from '@/components/common/DataTable/DataTable';
import { useDonationCampaignTableColumns } from '@/hooks/tables/useDonationCampaignTableColumns';
import { useDebounce } from '@/hooks/useDebounce';
import { DataTablePagination } from '@/components/common/DataTablePagination';
import { FilterManager, useFilterManager } from '@/components/common/FilterManager';
import { campaignStatusOptions } from '@/components/ui/badges/badge-status';

export default function DonationCampaignsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [sort, setSort] = useState('');
  
  // Deletion state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null);

  const { filters, handleFilterChange, getApiParams } = useFilterManager({
    status: 'all',
  }, () => setPage(1));

  const apiParams = getApiParams();

  const { data, isLoading } = useDonationCampaignsListQuery({
    page,
    search: debouncedSearch,
    status: apiParams.status,
    sort
  });
  const { mutate: deleteCampaign, isPending: isDeleting } = useDeleteDonationCampaignMutation();

  const openDeleteModal = (id: string) => {
    setCampaignToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (campaignToDelete) {
      deleteCampaign(campaignToDelete, {
        onSuccess: () => {
          setIsDeleteModalOpen(false);
          setCampaignToDelete(null);
        }
      });
    }
  };

  const handleSort = (field: string) => {
    setSort(field);
    setPage(1);
  };

  const totalPages = data?.data?.count ? Math.ceil(data.data.count / 10) : 1;

  const columns = useDonationCampaignTableColumns({
    openDeleteModal,
  });

  const statusOptions = campaignStatusOptions;

  const filterConfigs = [
    {
      key: 'status',
      placeholder: 'All Statuses',
      options: statusOptions,
      widthClass: 'w-[140px]',
    },
  ];

  return (
    <div className="space-y-6  pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Donation Campaigns</h1>
          <p className="text-slate-500 mt-1">Manage platform donation campaigns</p>
        </div>
        <Link href="/donation-campaigns/create">
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4" /> Add Campaign
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative max-w-sm flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search Campaigns..."
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
          emptyMessage="No donation campaigns found"
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

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        title="Delete Donation Campaign"
        description="Are you sure you want to delete this donation campaign? This action cannot be undone."
        onConfirm={confirmDelete}
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        variant="destructive"
      />
    </div>
  );
}
