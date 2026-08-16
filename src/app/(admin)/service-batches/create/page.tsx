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
        description="Schedule a new batch for a class service"
      />

      <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">
        <ServiceBatchForm onSubmit={onSubmit} isPending={isPending} />
      </div>
    </div>
  );
}
