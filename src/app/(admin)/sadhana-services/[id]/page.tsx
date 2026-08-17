'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { SadhanaServiceForm } from '@/components/forms/SadhanaServiceForm';
import {
  useSadhanaServiceQuery,
  useUpdateSadhanaServiceMutation,
} from '@/hooks/queries/useSadhanaServicesQuery';
import { CreateSadhanaServicePayload } from '@/schemas/sadhana-services.schema';
import { PageHeader } from '@/components/common/PageHeader';

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
      <PageHeader
        backHref="/sadhana-services"
        title={isEdit ? 'Edit Service' : 'Service Details'}
      />

      <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 w-full animate-pulse rounded-lg bg-cosmos" />
            ))}
          </div>
        ) : (
          <SadhanaServiceForm serviceId={id} onSubmit={onSubmit} isPending={isPending} readOnly={!isEdit} />
        )}
      </div>
    </div>
  );
}
