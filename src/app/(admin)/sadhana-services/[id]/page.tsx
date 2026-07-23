'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SadhanaServiceForm } from '@/components/forms/SadhanaServiceForm';
import {
  useSadhanaServiceQuery,
  useUpdateSadhanaServiceMutation,
} from '@/hooks/queries/useSadhanaServicesQuery';
import { CreateSadhanaServicePayload } from '@/schemas/sadhana-services.schema';

export default function ViewSadhanaServicePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;

  const mode = searchParams.get('mode') || 'view';
  const isEdit = mode === 'edit';

  const { isLoading } = useSadhanaServiceQuery(id);
  const { mutate: updateService, isPending } = useUpdateSadhanaServiceMutation();

  const onSubmit = (formData: CreateSadhanaServicePayload) => {
    updateService({ serviceId: id, payload: formData }, { onSuccess: () => router.push('/sadhana-services') });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/sadhana-services">
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {isEdit ? 'Edit Service' : 'Service Details'}
          </h1>
          <p className="mt-1 text-slate-500">
            {isEdit ? 'Update the sadhana service' : 'Sadhana service configuration'}
          </p>
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
          <SadhanaServiceForm serviceId={id} onSubmit={onSubmit} isPending={isPending} readOnly={!isEdit} />
        )}
      </div>
    </div>
  );
}
