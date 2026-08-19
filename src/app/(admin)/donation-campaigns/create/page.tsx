'use client';

import { useCreateDonationCampaignMutation } from '@/hooks/queries/useDonationCampaignsQuery';
import { useRouter } from 'next/navigation';
import { DonationCampaignForm } from '@/components/forms/DonationCampaignForm';
import { CreateDonationCampaignPayload } from '@/schemas/donation-campaigns.schema';
import { PageHeader } from '@/components/common/PageHeader';

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
      <PageHeader
        backHref="/donation-campaigns"
        title="Create Donation Campaign"
      />

      <div className="bg-surface rounded-2xl shadow-card border border-line p-4 sm:p-6">
        <DonationCampaignForm 
          onSubmit={onSubmit}
          isPending={isPending}
        />
      </div>
    </div>
  );
}
