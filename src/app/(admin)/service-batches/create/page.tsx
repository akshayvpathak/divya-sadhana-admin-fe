'use client';

import { useRouter } from 'next/navigation';
import { ServiceBatchForm } from '@/components/forms/ServiceBatchForm';
import { useCreateServiceBatchMutation } from '@/hooks/queries/useServiceBatchesQuery';
import { CreateServiceBatchPayload } from '@/schemas/service-batches.schema';
import { PageHeader } from '@/components/common/PageHeader';

export default function CreateServiceBatchPage() {
  const router = useRouter();
  const { mutate: createBatch, isPending } = useCreateServiceBatchMutation();

  const onSubmit = (formData: CreateServiceBatchPayload) => {
    createBatch(formData, { onSuccess: () => router.push('/service-batches') });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/service-batches"
        title="Create Service Batch"
      />

      <div className="rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-6">
        <ServiceBatchForm onSubmit={onSubmit} isPending={isPending} />
      </div>
    </div>
  );
}
