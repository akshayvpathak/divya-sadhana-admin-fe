'use client';

import { useRouter } from 'next/navigation';
import { SadhanaServiceForm } from '@/components/forms/SadhanaServiceForm';
import { useCreateSadhanaServiceMutation } from '@/hooks/queries/useSadhanaServicesQuery';
import { CreateSadhanaServicePayload } from '@/schemas/sadhana-services.schema';
import { PageHeader } from '@/components/common/PageHeader';

export default function CreateSadhanaServicePage() {
  const router = useRouter();
  const { mutate: createService, isPending } = useCreateSadhanaServiceMutation();

  const onSubmit = (formData: CreateSadhanaServicePayload) => {
    createService(formData, { onSuccess: () => router.push('/sadhana-services') });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/sadhana-services"
        title="Create Sadhana Service"
      />

      <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">
        <SadhanaServiceForm onSubmit={onSubmit} isPending={isPending} />
      </div>
    </div>
  );
}
