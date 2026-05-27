'use client';

import { useCategory, useUpdateCategory } from '@/hooks/useCategories';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { CategoryForm } from '@/components/forms/CategoryForm';
import { CategoryFormData } from '@/schemas/category.schema';

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
      <div className="flex items-center gap-4">
        <Link href="/categories">
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {isEdit ? 'Edit Category' : 'View Category'}
          </h1>
          <p className="text-slate-500 mt-1">
            {isEdit ? 'Update category details' : 'Detailed information about the category'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
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
