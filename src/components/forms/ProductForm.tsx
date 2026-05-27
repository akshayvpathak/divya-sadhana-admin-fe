'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema, ProductFormData } from '@/schemas/product.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { useEffect, useMemo } from 'react';
import { useProduct } from '@/hooks/useProducts';
import { useAllCategories } from '@/hooks/useCategories';
import { cn } from '@/lib/utils';

import { Switch } from '@/components/ui/switch';
import { useUploadImageMutation } from '@/hooks/queries/useImageUploadQuery';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';

interface ProductFormProps {
  productId?: string;
  initialData?: ProductFormData;
  categories?: { id: string; name: string }[];
  onSubmit?: (data: ProductFormData) => void;
  isPending?: boolean;
  readOnly?: boolean;
}

export function ProductForm({ productId, initialData: propsInitialData, categories: propsCategories, onSubmit, isPending, readOnly = false }: ProductFormProps) {
  const { data: fetchedProduct, isLoading: isFetchingProduct } = useProduct(productId || '');
  const { data: fetchedCategories, isLoading: isFetchingCategories } = useAllCategories();
  const uploadMutation = useUploadImageMutation();
  const [isDragging, setIsDragging] = useState(false);

  const categories = fetchedCategories || propsCategories;
  const isFetching = isFetchingProduct || isFetchingCategories;

  const initialData = useMemo(() => fetchedProduct ? {
    name: fetchedProduct.name,
    price: fetchedProduct.price,
    description: fetchedProduct.description,
    categoryId: fetchedProduct.categoryId,
    image: fetchedProduct.image || '',
    sku: fetchedProduct.sku || '',
    stock_quantity: fetchedProduct.stock || 0,
    is_active: fetchedProduct.isActive ?? true,
    is_published: fetchedProduct.isPublished ?? false,
  } : propsInitialData, [fetchedProduct, propsInitialData]);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: initialData,
  });

  const categoryId = watch('categoryId');
  const imageUrl = watch('image');
  const isActive = watch('is_active');
  const isPublished = watch('is_published');

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  const handleFormSubmit = (data: ProductFormData) => {
    if (onSubmit) {
      onSubmit(data);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!readOnly) setIsDragging(true);
  }, [readOnly]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (readOnly) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [readOnly]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    try {
      const keys = await uploadMutation.mutateAsync([file]);
      if (keys && keys.length > 0) {
        setValue('image', keys[0]);
        toast.success('Image uploaded successfully');
      }
    } catch (error) {
      toast.error('Failed to upload image');
    }
  };

  if (productId && isFetching) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-20 bg-slate-100 animate-pulse rounded" />
              <div className="h-10 w-full bg-slate-50 animate-pulse rounded-lg" />
            </div>
          ))}
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
          <Label htmlFor="name">Product Name</Label>
          <Input 
            id="name" 
            placeholder="Wireless Headphones" 
            {...register('name')} 
            disabled={readOnly}
            className={readOnly ? "bg-slate-50 border-slate-200 text-slate-600 cursor-default focus-visible:ring-0" : ""}
          />
          {errors.name && <p className="text-sm text-rose-500">{errors.name.message}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="price">Price ($)</Label>
          <Input 
            id="price" 
            type="number" 
            step="0.01" 
            placeholder="99.99" 
            {...register('price')} 
            disabled={readOnly}
            className={readOnly ? "bg-slate-50 border-slate-200 text-slate-600 cursor-default focus-visible:ring-0" : ""}
          />
          {errors.price && <p className="text-sm text-rose-500">{errors.price.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
          <Input 
            id="sku" 
            placeholder="PROD-123" 
            {...register('sku')} 
            disabled={readOnly}
            className={readOnly ? "bg-slate-50 border-slate-200 text-slate-600 cursor-default focus-visible:ring-0" : ""}
          />
          {errors.sku && <p className="text-sm text-rose-500">{errors.sku.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="stock_quantity">Stock Quantity</Label>
          <Input 
            id="stock_quantity" 
            type="number" 
            placeholder="100" 
            {...register('stock_quantity')} 
            disabled={readOnly}
            className={readOnly ? "bg-slate-50 border-slate-200 text-slate-600 cursor-default focus-visible:ring-0" : ""}
          />
          {errors.stock_quantity && <p className="text-sm text-rose-500">{errors.stock_quantity.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="categoryId">Category</Label>
          <Select 
            value={categoryId || ""}
            onValueChange={(val) => setValue('categoryId', (val as string) || '')} 
            disabled={readOnly}
          >
            <SelectTrigger id="categoryId" className={readOnly ? "bg-slate-50 border-slate-200 text-slate-600 cursor-default" : "bg-white"}>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories?.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.categoryId && <p className="text-sm text-rose-500">{errors.categoryId.message}</p>}
        </div>

        <div className="flex gap-8 items-center pt-4">
          <div className="flex items-center gap-2">
            <Switch 
              id="is_active" 
              checked={isActive} 
              onCheckedChange={(val) => setValue('is_active', val)}
              disabled={readOnly}
            />
            <Label htmlFor="is_active" className="cursor-pointer">Active</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch 
              id="is_published" 
              checked={isPublished} 
              onCheckedChange={(val) => setValue('is_published', val)}
              disabled={readOnly}
            />
            <Label htmlFor="is_published" className="cursor-pointer">Published</Label>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea 
          id="description" 
          placeholder="High quality wireless headphones..." 
          {...register('description')} 
          disabled={readOnly}
          className={readOnly ? "bg-slate-50 border-slate-200 text-slate-600 cursor-default focus-visible:ring-0" : ""}
          rows={4}
        />
        {errors.description && <p className="text-sm text-rose-500">{errors.description.message}</p>}
      </div>
      
      <div className="space-y-2">
        <Label>Product Image</Label>
        <div 
          className={cn(
            "border-2 border-dashed rounded-xl p-8 transition-all flex flex-col items-center justify-center gap-4 text-center",
            isDragging ? "border-indigo-500 bg-indigo-50/50" : "border-slate-200",
            !readOnly && "hover:border-indigo-400 hover:bg-slate-50/50 cursor-pointer",
            readOnly && "opacity-75 cursor-default bg-slate-50"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !readOnly && document.getElementById('file-upload')?.click()}
        >
          {imageUrl ? (
            <div className="relative group w-full max-w-[200px] aspect-square rounded-lg overflow-hidden border border-slate-200">
              <img 
                src={imageUrl.startsWith('http') ? imageUrl : `https://api.divyasadhana.org/media/${imageUrl}`} 
                alt="Preview" 
                className="w-full h-full object-cover"
              />
              {!readOnly && (
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setValue('image', '');
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-500">
              <div className="p-4 bg-slate-100 rounded-full">
                {uploadMutation.isPending ? (
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                ) : (
                  <Upload className="h-8 w-8 text-slate-400" />
                )}
              </div>
              <div>
                <p className="font-medium text-slate-700">
                  {uploadMutation.isPending ? 'Uploading...' : 'Click or drag to upload'}
                </p>
                <p className="text-sm">PNG, JPG or WEBP (max. 5MB)</p>
              </div>
            </div>
          )}
          <input 
            id="file-upload" 
            type="file" 
            className="hidden" 
            accept="image/*"
            onChange={handleFileSelect}
            disabled={readOnly || uploadMutation.isPending}
          />
        </div>
        {errors.image && <p className="text-sm text-rose-500">{errors.image.message}</p>}
      </div>

      <div className="pt-4 flex justify-end gap-2">
        <Link href="/products">
          <Button type="button" variant="outline">
            {readOnly ? 'Back' : 'Cancel'}
          </Button>
        </Link>
        {!readOnly && (
          <Button type="submit" disabled={isPending || uploadMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 min-w-[120px]">
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (initialData ? 'Edit Product' : 'Create Product')}
          </Button>
        )}
      </div>
    </form>
  );
}
