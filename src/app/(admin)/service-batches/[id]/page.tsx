'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ServiceBatchForm } from '@/components/forms/ServiceBatchForm';
import {
  useServiceBatchQuery,
  useUpdateServiceBatchMutation,
} from '@/hooks/queries/useServiceBatchesQuery';
import { CreateServiceBatchPayload } from '@/schemas/service-batches.schema';
import { PageHeader } from '@/components/common/PageHeader';

export default function ViewServiceBatchPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;

  const mode = searchParams.get('mode') || 'view';
  const isEdit = mode === 'edit';

  const { isLoading } = useServiceBatchQuery(id);
  const { mutate: updateBatch, isPending } = useUpdateServiceBatchMutation();

  const onSubmit = (formData: CreateServiceBatchPayload) => {
    updateBatch({ batchId: id, payload: formData }, { onSuccess: () => router.push('/service-batches') });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/service-batches"
        title={isEdit ? 'Edit Batch' : 'Batch Details'}
      />

      <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 w-full animate-pulse rounded-lg bg-cosmos" />
            ))}
          </div>
        ) : (
          <ServiceBatchForm batchId={id} onSubmit={onSubmit} isPending={isPending} readOnly={!isEdit} />
        )}
      </div>
    </div>
  );
}
