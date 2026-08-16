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
        description="Add a new fundraising campaign to the platform"
      />

      <div className="bg-surface rounded-xl shadow-sm border border-line p-6">
        <DonationCampaignForm 
          onSubmit={onSubmit}
          isPending={isPending}
        />
      </div>
    </div>
  );
}
