'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { categorySchema, CategoryFormData } from '@/schemas/category.schema';
import { useCreateCategory } from '@/hooks/useCategories';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

import { CategoryForm } from '@/components/forms/CategoryForm';

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
      <div className="flex items-center gap-4">
        <Link href="/categories">
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Create New Category</h1>
          <p className="text-slate-500 mt-1">Add a new product category</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <CategoryForm 
          onSubmit={onSubmit}
          isPending={isPending}
        />
      </div>
    </div>
  );
}
