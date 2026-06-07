'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { categorySchema, CategoryFormData } from '@/schemas/category.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    isActive: fetchedCategory.isActive ?? true,
  } : propsInitialData, [fetchedCategory, propsInitialData]);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      isActive: true,
      ...initialData,
    },
  });

  const nameValue = watch('name');
  const isActiveValue = watch('isActive');

  // Auto-generate slug from name if not edit mode and name changes
  useEffect(() => {
    if (!readOnly && !categoryId && nameValue) {
      const generatedSlug = nameValue
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setValue('slug', generatedSlug, { shouldValidate: true });
    }
  }, [nameValue, setValue, readOnly, categoryId]);

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
            placeholder="Electronics" 
            {...register('name')} 
            disabled={readOnly}
            className={readOnly ? "bg-slate-50 border-slate-200 text-slate-600 cursor-default focus-visible:ring-0" : ""}
          />
          {errors.name && <p className="text-sm text-rose-500">{errors.name.message}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="slug">Slug <span className="text-rose-500">*</span></Label>
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
        <Label htmlFor="description">Description <span className="text-rose-500">*</span></Label>
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

      <div className="space-y-2">
        <Label htmlFor="isActive">Status <span className="text-rose-500">*</span></Label>
        <Select 
          value={isActiveValue !== undefined ? (isActiveValue ? "active" : "inactive") : ""} 
          onValueChange={(val) => setValue('isActive', val === 'active')}
          disabled={readOnly}
        >
          <SelectTrigger id="isActive" className={readOnly ? "bg-slate-50 border-slate-200 text-slate-600 cursor-default" : "bg-white"}>
            <SelectValue placeholder="Select status">
              {isActiveValue ? 'Active' : 'Inactive'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        {errors.isActive && <p className="text-sm text-rose-500">{errors.isActive.message}</p>}
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
