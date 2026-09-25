'use client';

import { useRouter } from 'next/navigation';

import { PageHeader } from '@/components/common/PageHeader';
import { HomepageGalleryForm } from '@/components/forms/HomepageGalleryForm';
import { useCreateHomepageGalleryMutation } from '@/hooks/queries/useHomepageGalleryQuery';
import { HomepageGalleryFormValues } from '@/schemas/homepage-gallery.schema';

export default function CreateHomepageGalleryPage() {
  const router = useRouter();
  const { mutate: createItem, isPending } = useCreateHomepageGalleryMutation();

  const onSubmit = (data: HomepageGalleryFormValues) => {
    if (!data.image_key) return;
    createItem(
      { ...data, image_key: data.image_key },
      { onSuccess: () => router.push('/homepage-gallery') }
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader backHref="/homepage-gallery" title="Add Homepage Image" />
      <div className="rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-6">
        <HomepageGalleryForm onSubmit={onSubmit} isPending={isPending} />
      </div>
    </div>
  );
}
