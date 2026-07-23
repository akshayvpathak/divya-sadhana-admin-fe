'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ServiceBatchForm } from '@/components/forms/ServiceBatchForm';
import { useCreateServiceBatchMutation } from '@/hooks/queries/useServiceBatchesQuery';
import { CreateServiceBatchPayload } from '@/schemas/service-batches.schema';

export default function CreateServiceBatchPage() {
  const router = useRouter();
  const { mutate: createBatch, isPending } = useCreateServiceBatchMutation();

  const onSubmit = (formData: CreateServiceBatchPayload) => {
    createBatch(formData, { onSuccess: () => router.push('/service-batches') });
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
          <h1 className="text-3xl font-bold text-slate-900">Create Service Batch</h1>
          <p className="mt-1 text-slate-500">Schedule a new batch for a class service</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <ServiceBatchForm onSubmit={onSubmit} isPending={isPending} />
      </div>
    </div>
  );
}
