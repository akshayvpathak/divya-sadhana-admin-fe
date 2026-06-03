'use client';

import { useState } from 'react';
import { useDonationCampaignsListQuery, useDeleteDonationCampaignMutation } from '@/hooks/queries/useDonationCampaignsQuery';
import { Search, ChevronLeft, ChevronRight, Eye, Edit2, Trash2, Image as ImageIcon, ArrowUp, ArrowDown, ArrowUpDown, Plus } from 'lucide-react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import dayjs from 'dayjs';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function DonationCampaignsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('');
  
  // Deletion state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null);

  const { data, isLoading } = useDonationCampaignsListQuery({ page, search, sort });
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
    if (sort === field) {
      setSort(`-${field}`);
    } else if (sort === `-${field}`) {
      setSort('');
    } else {
      setSort(field);
    }
    setPage(1);
  };

  const getSortIcon = (field: string) => {
    if (sort === field) return <ArrowUp className="h-4 w-4 text-indigo-600 shrink-0" />;
    if (sort === `-${field}`) return <ArrowDown className="h-4 w-4 text-indigo-600 shrink-0" />;
    return <ArrowUpDown className="h-4 w-4 text-slate-400 shrink-0" />;
  };

  const totalPages = data?.data?.count ? Math.ceil(data.data.count / 10) : 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Donation Campaigns</h1>
          <p className="text-slate-500 mt-1">Manage platform donation campaigns</p>
        </div>
        <Link href="/donation-campaigns/create">
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="mr-2 h-4 w-4" /> Add Campaign
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search campaigns..."
              className="pl-9 bg-white"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead 
                  className="cursor-pointer select-none hover:bg-slate-100/50 transition-colors"
                  onClick={() => handleSort('title')}
                >
                  <div className="flex items-center gap-1">
                    Title
                    {getSortIcon('title')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer select-none hover:bg-slate-100/50 transition-colors"
                  onClick={() => handleSort('target_amount')}
                >
                  <div className="flex items-center gap-1">
                    Target
                    {getSortIcon('target_amount')}
                  </div>
                </TableHead>
                <TableHead>Progress</TableHead>
                <TableHead 
                  className="cursor-pointer select-none hover:bg-slate-100/50 transition-colors"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1">
                    Status
                    {getSortIcon('status')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer select-none hover:bg-slate-100/50 transition-colors"
                  onClick={() => handleSort('ends_at')}
                >
                  <div className="flex items-center gap-1">
                    Ends At
                    {getSortIcon('ends_at')}
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-10 rounded-md" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : data?.data?.results?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    No donation campaigns found
                  </TableCell>
                </TableRow>
              ) : (
                data?.data?.results?.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <div className="h-10 w-10 relative rounded-md overflow-hidden bg-slate-100 border border-slate-200">
                        {campaign.cover_image_url ? (
                          <Image 
                            src={campaign.cover_image_url} 
                            alt={campaign.title} 
                            fill 
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-5 w-5 text-slate-300" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">{campaign.title}</TableCell>
                    <TableCell className="font-medium text-slate-900">${campaign.target_amount}</TableCell>
                    <TableCell>
                      <div className="space-y-1.5 w-full max-w-[120px]">
                        <div className="flex justify-between text-[10px] font-medium">
                          <span>${campaign.raised_amount}</span>
                          <span>{campaign.progress_percent}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-600 transition-all duration-500" 
                            style={{ width: `${Math.min(Number(campaign.progress_percent), 100)}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={campaign.status} type="campaign_status" />
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {campaign.ends_at ? dayjs(campaign.ends_at).format('MMM D, YYYY') : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link href={`/donation-campaigns/${campaign.id}`}>
                          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-indigo-600">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/donation-campaigns/${campaign.id}?mode=edit`}>
                          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-indigo-600">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => openDeleteModal(campaign.id)} 
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>


        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing <span className="font-medium">{(page - 1) * 10 + 1}</span> to <span className="font-medium">{Math.min(page * 10, data?.data?.count || 0)}</span> of <span className="font-medium">{data?.data?.count || 0}</span> results
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
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
