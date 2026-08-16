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
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardBand } from '@/components/ui/card';

export default function DonationCampaignsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [sort, setSort] = useState('');
  
  // Deletion state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null);

  const { filters, handleFilterChange, getApiParams, resetFilters, hasActiveFilters: filterManagerActive } = useFilterManager({
    status: 'all',
  }, () => setPage(1));

  const apiParams = getApiParams();

  // Button visible when search or any filter is active
  const hasActiveFilters = search !== '' || filterManagerActive;

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
      <PageHeader
        title="Donation Campaigns"
        description="Manage platform donation campaigns"
        actions={
          <Link href="/donation-campaigns/create">
            <Button>
              <Plus className="h-4 w-4" /> Add Campaign
            </Button>
          </Link>
        }
      />

      <Card>
        <CardBand className="flex flex-col items-center justify-between gap-4 border-b border-line md:flex-row">
          <div className="relative max-w-sm flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-moon" />
            <Input
              placeholder="Search Campaigns..."
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
      </Card>

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
