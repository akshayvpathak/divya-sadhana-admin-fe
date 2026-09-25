'use client';

import { useParams, useRouter } from 'next/navigation';

import { PageHeader } from '@/components/common/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { HomepageGalleryForm } from '@/components/forms/HomepageGalleryForm';
import {
  useHomepageGalleryItemQuery,
  useUpdateHomepageGalleryMutation,
} from '@/hooks/queries/useHomepageGalleryQuery';
import { HomepageGalleryFormValues } from '@/schemas/homepage-gallery.schema';

export default function EditHomepageGalleryPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: item, isLoading } = useHomepageGalleryItemQuery(id);
  const { mutate: updateItem, isPending } = useUpdateHomepageGalleryMutation();

  const onSubmit = (data: HomepageGalleryFormValues) => {
    const payload: Partial<HomepageGalleryFormValues> = { ...data };
    if (!payload.image_key) delete payload.image_key;

    updateItem(
      { id, payload },
      { onSuccess: () => router.push('/homepage-gallery') }
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader backHref="/homepage-gallery" title="Edit Homepage Image" />
      <div className="rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-6">
        {isLoading || !item ? (
          <div className="space-y-4">
            <Skeleton className="aspect-[16/9] w-full rounded-xl" />
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-24 md:col-span-2" />
            </div>
          </div>
        ) : (
          <HomepageGalleryForm item={item} onSubmit={onSubmit} isPending={isPending} />
        )}
      </div>
    </div>
  );
}
