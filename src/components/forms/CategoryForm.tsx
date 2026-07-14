'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false, loading: () => <p className="text-sm text-slate-500 py-4">Loading editor...</p> });
import { categorySchema, CategoryFormData } from '@/schemas/category.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
    description: fetchedCategory.description,
    isActive: fetchedCategory.isActive ?? true,
  } : propsInitialData, [fetchedCategory, propsInitialData]);

  const { register, control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
      isActive: true,
      ...initialData,
    },
  });

  const nameValue = watch('name');
  const isActiveValue = watch('isActive');

  useEffect(() => {
    register('isActive');
  }, [register]);

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
          <Label htmlFor="name">Category Name <span className="text-rose-500">*</span></Label>
          <Input
            id="name"
            placeholder="Category Name"
            {...register('name')}
            disabled={readOnly}
            className={readOnly ? "bg-slate-50 border-slate-200 text-slate-600 cursor-default focus-visible:ring-0" : ""}
          />
          {errors.name && <p className="text-sm text-rose-500">{errors.name.message}</p>}
        </div>
        <div className="flex items-center gap-2 pt-8">
          <Switch
            id="isActive"
            checked={!!isActiveValue}
            onCheckedChange={(val) => setValue('isActive', val)}
            disabled={readOnly}
          />
          <Label htmlFor="isActive" className="cursor-pointer">Active</Label>
          {errors.isActive && <p className="text-sm text-rose-500">{errors.isActive.message}</p>}
        </div>
      </div>

      <div className="space-y-2 pb-4">
        <Label htmlFor="description">Description <span className="text-rose-500">*</span></Label>
        <div className="bg-white rounded-md pb-6">
          {readOnly ? (
            <div 
              className="p-4 bg-slate-50 border border-slate-200 rounded-md min-h-[200px] max-h-[400px] overflow-y-auto prose prose-sm max-w-none text-slate-700"
              dangerouslySetInnerHTML={{ __html: watch('description') || '' }}
            />
          ) : (
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <ReactQuill 
                  theme="snow"
                  value={field.value}
                  onChange={field.onChange}
                  className="h-[200px] mb-12"
                />
              )}
            />
          )}
        </div>
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
