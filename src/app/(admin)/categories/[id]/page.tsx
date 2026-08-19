'use client';

import { useCategory, useUpdateCategory } from '@/hooks/useCategories';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { CategoryForm } from '@/components/forms/CategoryForm';
import { CategoryFormData } from '@/schemas/category.schema';
import { PageHeader } from '@/components/common/PageHeader';

export default function CategoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  
  const mode = searchParams.get('mode') || 'view';
  const isEdit = mode === 'edit';

  const { data: category, isLoading } = useCategory(id);
  const { mutate: updateCategory, isPending } = useUpdateCategory();

  const onSubmit = (formData: CategoryFormData) => {
    updateCategory({ id, data: formData }, { 
      onSuccess: () => {
        router.push('/categories');
      } 
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/categories"
        title={isEdit ? 'Edit Category' : 'View Category'}
      />

      <div className="bg-surface rounded-2xl shadow-card border border-line p-4 sm:p-6">
        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <CategoryForm 
            categoryId={id}
            onSubmit={isEdit ? onSubmit : undefined}
            isPending={isEdit ? isPending : undefined}
            readOnly={!isEdit}
          />
        )}
      </div>
    </div>
  );
}
