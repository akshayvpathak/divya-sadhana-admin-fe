'use client';

import { useMemo, useState } from 'react';
import {
  useDonationCampaignsListQuery,
  useDonationCampaignsInfiniteQuery,
  useDeleteDonationCampaignMutation,
} from '@/hooks/queries/useDonationCampaignsQuery';
import { Plus } from 'lucide-react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ResponsiveDataView } from '@/components/common/ResponsiveDataView';
import { ListToolbar, ToolbarFilter } from '@/components/common/ListToolbar';
import { useDonationCampaignTableColumns } from '@/hooks/tables/useDonationCampaignTableColumns';
import { useDebounce } from '@/hooks/useDebounce';
import { useIsCompact } from '@/hooks/useMediaQuery';
import { DataTablePagination } from '@/components/common/DataTablePagination';
import { useFilterManager } from '@/components/common/FilterManager';
import { campaignStatusOptions } from '@/components/ui/badges/badge-status';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/card';

export default function DonationCampaignsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [sort, setSort] = useState('');

  // Deletion state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null);

  const {
    filters,
    handleFilterChange,
    getApiParams,
    resetFilters,
    hasActiveFilters: filterManagerActive,
  } = useFilterManager({ status: 'all' }, () => setPage(1));

  const apiParams = getApiParams();
  const hasActiveFilters = search !== '' || filterManagerActive;

  const queryFilters = useMemo(
    () => ({ search: debouncedSearch, status: apiParams.status, sort }),
    [debouncedSearch, apiParams.status, sort]
  );

  const isCompact = useIsCompact();
  const { data, isLoading } = useDonationCampaignsListQuery(
    { ...queryFilters, page },
    { enabled: isCompact === false }
  );
  const mobile = useDonationCampaignsInfiniteQuery(queryFilters, {
    enabled: isCompact === true,
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
        },
      });
    }
  };

  const handleSort = (field: string) => {
    setSort(field);
    setPage(1);
  };

  const totalPages = data?.data?.count ? Math.ceil(data.data.count / 10) : 1;
  const columns = useDonationCampaignTableColumns({ openDeleteModal });

  const toolbarFilters: ToolbarFilter[] = [
    {
      key: 'status',
      label: 'Status',
      value: filters.status,
      options: campaignStatusOptions,
      placeholder: 'All Statuses',
      widthClass: 'w-[140px]',
      onChange: (val) => handleFilterChange('status', val),
    },
  ];

  return (
    <div className="space-y-5 pb-8 sm:space-y-6">
      <PageHeader
        title="Donation Campaigns"
        actions={
          <Link href="/donation-campaigns/create">
            <Button>
              <Plus className="h-4 w-4" /> Add Campaign
            </Button>
          </Link>
        }
      />

      <Card>
        <ListToolbar
          search={{
            value: search,
            placeholder: 'Search Campaigns...',
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
          emptyMessage="No donation campaigns found"
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

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        title="Delete Donation Campaign"
        description="Are you sure you want to delete this donation campaign? This action cannot be undone."
        onConfirm={confirmDelete}
        confirmText={isDeleting ? 'Deleting...' : 'Delete'}
        variant="destructive"
      />
    </div>
  );
}
