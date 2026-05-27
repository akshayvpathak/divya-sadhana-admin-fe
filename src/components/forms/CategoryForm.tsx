'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { categorySchema, CategoryFormData } from '@/schemas/category.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { useEffect, useMemo } from 'react';

import { useCategory } from '@/hooks/useCategories';

interface CategoryFormProps {
  categoryId?: string;
  initialData?: CategoryFormData;
  onSubmit?: (data: CategoryFormData) => void;
  isPending?: boolean;
  readOnly?: boolean;
}

export function CategoryForm({ categoryId, initialData: propsInitialData, onSubmit, isPending, readOnly = false }: CategoryFormProps) {
  const { data: fetchedCategory, isLoading: isFetching } = useCategory(categoryId || '');
  
  const initialData = useMemo(() => fetchedCategory ? {
    name: fetchedCategory.name,
    slug: fetchedCategory.slug,
    description: fetchedCategory.description,
  } : propsInitialData, [fetchedCategory, propsInitialData]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: initialData,
  });

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  const handleFormSubmit = (data: CategoryFormData) => {
    if (onSubmit) {
      onSubmit(data);
    }
  };

  if (categoryId && isFetching) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-4 w-20 bg-slate-100 animate-pulse rounded" />
          <div className="h-10 w-full bg-slate-50 animate-pulse rounded-lg" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-20 bg-slate-100 animate-pulse rounded" />
          <div className="h-10 w-full bg-slate-50 animate-pulse rounded-lg" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-20 bg-slate-100 animate-pulse rounded" />
          <div className="h-24 w-full bg-slate-50 animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Category Name</Label>
          <Input 
            id="name" 
            placeholder="Electronics" 
            {...register('name')} 
            disabled={readOnly}
            className={readOnly ? "bg-slate-50 border-slate-200 text-slate-600 cursor-default focus-visible:ring-0" : ""}
          />
          {errors.name && <p className="text-sm text-rose-500">{errors.name.message}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input 
            id="slug" 
            placeholder="electronics" 
            {...register('slug')} 
            disabled={readOnly}
            className={readOnly ? "bg-slate-50 border-slate-200 text-slate-600 cursor-default focus-visible:ring-0" : ""}
          />
          {errors.slug && <p className="text-sm text-rose-500">{errors.slug.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea 
          id="description" 
          placeholder="All kinds of electronic devices..." 
          {...register('description')} 
          disabled={readOnly}
          className={readOnly ? "bg-slate-50 border-slate-200 text-slate-600 cursor-default focus-visible:ring-0" : ""}
          rows={4}
        />
        {errors.description && <p className="text-sm text-rose-500">{errors.description.message}</p>}
      </div>

      <div className="pt-4 flex justify-end gap-2">
        <Link href="/categories">
          <Button type="button" variant="outline">
            {readOnly ? 'Back' : 'Cancel'}
          </Button>
        </Link>
        {!readOnly && (
          <Button type="submit" disabled={isPending} className="bg-indigo-600 hover:bg-indigo-700">
            {isPending ? 'Processing...' : (initialData ? 'Edit Category' : 'Create Category')}
          </Button>
        )}
      </div>
    </form>
  );
}
