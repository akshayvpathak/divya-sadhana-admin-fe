'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ServiceBatchForm } from '@/components/forms/ServiceBatchForm';
import {
  useServiceBatchQuery,
  useUpdateServiceBatchMutation,
} from '@/hooks/queries/useServiceBatchesQuery';
import { CreateServiceBatchPayload } from '@/schemas/service-batches.schema';

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
      <div className="flex items-center gap-4">
        <Link href="/service-batches">
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{isEdit ? 'Edit Batch' : 'Batch Details'}</h1>
          <p className="mt-1 text-slate-500">{isEdit ? 'Update the batch schedule' : 'Batch configuration'}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 w-full animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : (
          <ServiceBatchForm batchId={id} onSubmit={onSubmit} isPending={isPending} readOnly={!isEdit} />
        )}
      </div>
    </div>
  );
}
