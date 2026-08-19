'use client';

import { useDonationCampaignQuery, useUpdateDonationCampaignMutation } from '@/hooks/queries/useDonationCampaignsQuery';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Image as ImageIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { formatDate } from '@/lib/datetime';
import { DonationCampaignForm } from '@/components/forms/DonationCampaignForm';
import { formatINR } from '@/lib/currency';
import { useState } from 'react';
import { useDonationsListQuery } from '@/hooks/queries/useDonationsQuery';
import { DataTable } from '@/components/common/DataTable/DataTable';
import { useDonationTableColumns } from '@/hooks/tables/useDonationTableColumns';
import { DataTablePagination } from '@/components/common/DataTablePagination';
import { PageHeader } from '@/components/common/PageHeader';

export default function ViewDonationCampaignPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  
  const mode = searchParams.get('mode') || 'view';
  const isEdit = mode === 'edit';

  const { data, isLoading } = useDonationCampaignQuery(id);
  const { mutate: updateCampaign, isPending } = useUpdateDonationCampaignMutation();
  const campaign = data;

  const [donationsPage, setDonationsPage] = useState(1);
  const { data: donationsData, isLoading: donationsLoading } = useDonationsListQuery({
    campaign: id,
    page: donationsPage,
  });

  const rawColumns = useDonationTableColumns();
  const donationsColumns = rawColumns.filter((col) => col.id !== 'campaign');
  const donationsTotalPages = donationsData?.data?.count ? Math.ceil(donationsData.data.count / 10) : 1;

  const onSubmit = (formData: any) => {
    updateCampaign({ campaignId: id, payload: formData }, {
      onSuccess: () => {
        router.push('/donation-campaigns');
      }
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/donation-campaigns"
        title={isLoading ? <Skeleton className="h-9 w-64" /> : isEdit ? 'Edit Campaign' : 'Campaign Details'}
      />

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-80 w-full rounded-3xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        </div>
      ) : isEdit ? (
        <div className="bg-surface rounded-2xl shadow-card border border-line p-4 sm:p-6">
          <DonationCampaignForm
            campaignId={id}
            onSubmit={onSubmit}
            isPending={isPending}
          />
        </div>
      ) : campaign && (
        <div className="space-y-8 mt-4">
          {/* Hero Section with Image & Stats */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 lg:gap-8">
            <div className="lg:col-span-3 relative h-80 rounded-3xl overflow-hidden bg-cosmos border border-line shadow-inner">
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
                  <ImageIcon className="h-16 w-12 text-line" />
                </div>
              )}
              <div className="absolute top-4 right-4">
                <span className={`px-4 py-2 rounded-full text-xs font-black shadow-lg backdrop-blur-md ${
                  campaign.status === 'active' ? 'bg-success/90 text-white' : 'bg-moon/90 text-white'
                }`}>
                  {campaign.status.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="lg:col-span-2 flex flex-col justify-between space-y-6">
              <div className="p-5 sm:p-6 bg-gold-deep rounded-3xl shadow-xl shadow-gold/20 space-y-6 text-white">
                <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest">Fundraising Progress</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-4xl font-black tracking-tighter">{formatINR(campaign.raised_amount)}</span>
                    <span className="text-sm font-bold text-white/60 mb-1">of {formatINR(campaign.target_amount)}</span>
                  </div>
                  <div className="h-3 w-full bg-surface/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-surface transition-all duration-1000 ease-out" 
                      style={{ width: `${Math.min(Number(campaign.progress_percent), 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="bg-surface/20 px-2 py-1 rounded-md">{campaign.progress_percent}% Goal</span>
                    <span className="uppercase">{campaign.currency}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-cream rounded-2xl border border-line/60">
                  <p className="text-[10px] text-moon font-bold uppercase mb-1">Starts At</p>
                  <p className="text-sm font-bold text-ink">{formatDate(campaign.starts_at)}</p>
                </div>
                <div className="p-4 bg-cream rounded-2xl border border-line/60">
                  <p className="text-[10px] text-moon font-bold uppercase mb-1">Ends At</p>
                  <p className="text-sm font-bold text-ink">{formatDate(campaign.ends_at)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="space-y-4 p-5 sm:p-8 bg-surface rounded-3xl border border-line shadow-sm">
            <h2 className="text-2xl font-black text-ink tracking-tight">{campaign.title}</h2>
            <div 
              className="prose prose-slate max-w-none text-base leading-relaxed text-charcoal sm:text-lg"
              dangerouslySetInnerHTML={{ __html: campaign.description || '' }}
            />
          </div>

          {/* Donations Received Section */}
          <div className="space-y-4 p-5 sm:p-8 bg-surface rounded-3xl border border-line shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-ink tracking-tight">Donations Received</h2>
                <p className="text-sm text-moon mt-1">List of contributions to this campaign</p>
              </div>
              <span className="bg-tint text-gold-press text-xs font-bold px-3 py-1 rounded-full border border-gold/25">
                {donationsData?.data?.count || 0} Total
              </span>
            </div>
            
            <div className="border border-line/60 rounded-2xl overflow-hidden mt-4">
              <DataTable
                columns={donationsColumns}
                data={donationsData?.data?.results || []}
                isLoading={donationsLoading}
                emptyMessage="No donations received yet for this campaign"
              />
            </div>

            {donationsData?.data && donationsData.data.count > 0 && (
              <div className="pt-4 border-t border-line/60">
                <DataTablePagination
                  currentPage={donationsPage}
                  totalPages={donationsTotalPages}
                  totalItems={donationsData.data.count}
                  onPageChange={setDonationsPage}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
