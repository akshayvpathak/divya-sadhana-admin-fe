'use client';

import { useCreateDonationCampaignMutation } from '@/hooks/queries/useDonationCampaignsQuery';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { DonationCampaignForm } from '@/components/forms/DonationCampaignForm';
import { CreateDonationCampaignPayload } from '@/schemas/donation-campaigns.schema';

export default function CreateDonationCampaignPage() {
  const router = useRouter();
  const { mutate: createCampaign, isPending } = useCreateDonationCampaignMutation();

  const onSubmit = (formData: CreateDonationCampaignPayload) => {
    createCampaign(formData, { 
      onSuccess: () => {
        router.push('/donation-campaigns');
      } 
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/donation-campaigns">
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Create Donation Campaign</h1>
          <p className="text-slate-500 mt-1">Add a new fundraising campaign to the platform</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <DonationCampaignForm 
          onSubmit={onSubmit}
          isPending={isPending}
        />
      </div>
    </div>
  );
}
