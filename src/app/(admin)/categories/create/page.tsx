'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { categorySchema, CategoryFormData } from '@/schemas/category.schema';
import { useCreateCategory } from '@/hooks/useCategories';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { CategoryForm } from '@/components/forms/CategoryForm';
import { PageHeader } from '@/components/common/PageHeader';

export default function CreateCategoryPage() {
  const router = useRouter();
  const { mutate: createCategory, isPending } = useCreateCategory();

  const onSubmit = (formData: CategoryFormData) => {
    createCategory(formData, { 
      onSuccess: () => {
        router.push('/categories');
      } 
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/categories"
        title="Create New Category"
        description="Add a new product category"
      />

      <div className="bg-surface rounded-xl shadow-sm border border-line p-6">
        <CategoryForm 
          onSubmit={onSubmit}
          isPending={isPending}
        />
      </div>
    </div>
  );
}
