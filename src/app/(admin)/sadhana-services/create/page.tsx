'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SadhanaServiceForm } from '@/components/forms/SadhanaServiceForm';
import { useCreateSadhanaServiceMutation } from '@/hooks/queries/useSadhanaServicesQuery';
import { CreateSadhanaServicePayload } from '@/schemas/sadhana-services.schema';

export default function CreateSadhanaServicePage() {
  const router = useRouter();
  const { mutate: createService, isPending } = useCreateSadhanaServiceMutation();

  const onSubmit = (formData: CreateSadhanaServicePayload) => {
    createService(formData, { onSuccess: () => router.push('/sadhana-services') });
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
          <h1 className="text-3xl font-bold text-slate-900">Create Sadhana Service</h1>
          <p className="mt-1 text-slate-500">Add a new seva / anushthan service</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <SadhanaServiceForm onSubmit={onSubmit} isPending={isPending} />
      </div>
    </div>
  );
}
