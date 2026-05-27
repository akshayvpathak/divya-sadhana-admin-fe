'use client';

import { useDonationCampaignQuery } from '@/hooks/queries/useDonationCampaignsQuery';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import dayjs from 'dayjs';

export default function ViewDonationCampaignPage() {
  const params = useParams();
  const id = params.id as string;
  
  const { data, isLoading } = useDonationCampaignQuery(id);
  const campaign = data;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/donation-campaigns">
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {isLoading ? <Skeleton className="h-9 w-64" /> : 'Campaign Details'}
          </h1>
          <p className="text-slate-500 mt-1">Fundraising progress and campaign information</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-80 w-full rounded-3xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        </div>
      ) : campaign && (
        <div className="space-y-8 mt-4">
          {/* Hero Section with Image & Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 relative h-80 rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner">
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
                  <ImageIcon className="h-16 w-12 text-slate-300" />
                </div>
              )}
              <div className="absolute top-4 right-4">
                <span className={`px-4 py-2 rounded-full text-xs font-black shadow-lg backdrop-blur-md ${
                  campaign.status === 'active' ? 'bg-green-500/90 text-white' : 'bg-slate-500/90 text-white'
                }`}>
                  {campaign.status.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="lg:col-span-2 flex flex-col justify-between space-y-6">
              <div className="p-6 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-100 space-y-6 text-white">
                <h3 className="text-xs font-bold text-indigo-200 uppercase tracking-widest">Fundraising Progress</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-4xl font-black tracking-tighter">${campaign.raised_amount}</span>
                    <span className="text-sm font-bold text-indigo-200 mb-1">of ${campaign.target_amount}</span>
                  </div>
                  <div className="h-3 w-full bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white transition-all duration-1000 ease-out" 
                      style={{ width: `${Math.min(Number(campaign.progress_percent), 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="bg-white/20 px-2 py-1 rounded-md">{campaign.progress_percent}% Goal</span>
                    <span className="uppercase">{campaign.currency}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Starts At</p>
                  <p className="text-sm font-bold text-slate-900">{dayjs(campaign.starts_at).format('MMM D, YYYY')}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Ends At</p>
                  <p className="text-sm font-bold text-slate-900">{dayjs(campaign.ends_at).format('MMM D, YYYY')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="space-y-4 p-8 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{campaign.title}</h2>
            <div className="prose prose-slate max-w-none">
              <p className="text-slate-600 leading-relaxed text-lg">{campaign.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
