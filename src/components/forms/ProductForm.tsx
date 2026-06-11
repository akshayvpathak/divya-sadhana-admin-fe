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
import { useProduct, resolveProductImageUrl } from '@/hooks/useProducts';
import { useAllCategories } from '@/hooks/useCategories';
import { cn } from '@/lib/utils';

import { Switch } from '@/components/ui/switch';
import { useUploadImageMutation } from '@/hooks/queries/useImageUploadQuery';
import { Upload, X, Loader2 } from 'lucide-react';
import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';

interface ProductFormProps {
  productId?: string;
  initialData?: ProductFormData;
  categories?: { id: string; name: string; isActive?: boolean; is_active?: boolean }[];
  onSubmit?: (data: ProductFormData) => void;
  isPending?: boolean;
  readOnly?: boolean;
}

export function ProductForm({ productId, initialData: propsInitialData, categories: propsCategories, onSubmit, isPending, readOnly = false }: ProductFormProps) {
  const { data: fetchedProduct, isLoading: isFetchingProduct } = useProduct(productId || '');
  const { data: fetchedCategories, isLoading: isFetchingCategories } = useAllCategories();
  const uploadPrimaryMutation = useUploadImageMutation();
  const uploadGalleryMutation = useUploadImageMutation();
  const [isDragging, setIsDragging] = useState(false);
  const [localPreviews, setLocalPreviews] = useState<{ id: string; url: string; isUploading: boolean; key?: string }[]>([]);
  const [primaryPreviewUrl, setPrimaryPreviewUrl] = useState<string>('');

  const categories = fetchedCategories || propsCategories;
  const isFetching = isFetchingProduct || isFetchingCategories;

  const initialData = useMemo(() => fetchedProduct ? {
    name: fetchedProduct.name || '',
    price: fetchedProduct.price,
    description: fetchedProduct.description || '',
    categoryId: fetchedProduct.categoryId || '',
    image: fetchedProduct.primary_image_key || fetchedProduct.image || '',
    sku: fetchedProduct.sku || '',
    stock_quantity: fetchedProduct.stock || 0,
    is_active: fetchedProduct.is_active ?? true,
    is_published: fetchedProduct.is_published ?? false,
    gallery_image_keys: fetchedProduct.gallery_image_keys || [],
  } : propsInitialData, [fetchedProduct, propsInitialData]);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: '',
      price: 0,
      description: '',
      categoryId: '',
      image: '',
      sku: '',
      stock_quantity: 0,
      is_active: true,
      is_published: false,
      gallery_image_keys: [],
      ...initialData,
    },
  });

  const categoryId = watch('categoryId');
  const imageKey = watch('image');
  const is_active = watch('is_active');
  const isPublished = watch('is_published');
  const galleryImageKeys = watch('gallery_image_keys') || [];

  useEffect(() => {
    register('image');
    register('is_active');
    register('is_published');
    register('gallery_image_keys');
  }, [register]);

  useEffect(() => {
    if (fetchedProduct?.primary_image_url) {
      setPrimaryPreviewUrl(fetchedProduct.primary_image_url);
    } else if (initialData?.image) {
      setPrimaryPreviewUrl(resolveProductImageUrl(initialData.image));
    } else {
      setPrimaryPreviewUrl('');
    }
  }, [initialData, fetchedProduct]);

  // Load existing gallery images into local previews on mount/reset
  useEffect(() => {
    if (initialData?.gallery_image_keys?.length) {
      const existingPreviews = initialData.gallery_image_keys.map((key, index) => {
        let url = resolveProductImageUrl(key);
        if (fetchedProduct?.gallery_image_urls?.[index]) {
          url = fetchedProduct.gallery_image_urls[index];
        }
        return {
          id: key,
          url,
          isUploading: false,
          key
        };
      });
      setLocalPreviews(existingPreviews);
    } else {
      setLocalPreviews([]);
    }
  }, [initialData, fetchedProduct]);

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
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File exceeds 5MB limit');
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setPrimaryPreviewUrl(localUrl);

    try {
      const keys = await uploadPrimaryMutation.mutateAsync([file]);
      if (keys && keys.length > 0) {
        setValue('image', keys[0]);
        toast.success('Image uploaded successfully');
      }
    } catch (error) {
      toast.error('Failed to upload image');
      setPrimaryPreviewUrl('');
    }
  };

  const handleGalleryFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`File ${file.name} is not an image`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} exceeds 5MB limit`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Create local preview URLs and add them to local state immediately
    const newPreviews = validFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      url: URL.createObjectURL(file),
      isUploading: true,
      file
    }));

    setLocalPreviews(prev => [...prev, ...newPreviews]);

    try {
      const keys = await uploadGalleryMutation.mutateAsync(validFiles);
      if (keys && keys.length > 0) {
        // Map returned keys back to the previews
        const currentKeys = watch('gallery_image_keys') || [];
        setValue('gallery_image_keys', [...currentKeys, ...keys], { shouldDirty: true });
        
        setLocalPreviews(prev => {
          let keyIndex = 0;
          return prev.map(p => {
            const isNew = newPreviews.some(np => np.id === p.id);
            if (isNew && keyIndex < keys.length) {
              const assignedKey = keys[keyIndex++];
              return { ...p, isUploading: false, key: assignedKey };
            }
            return p;
          });
        });
        toast.success(`${validFiles.length} image(s) uploaded to gallery`);
      }
    } catch (error) {
      toast.error('Failed to upload gallery images');
      // Remove all newly added previews on failure
      const newIds = newPreviews.map(np => np.id);
      setLocalPreviews(prev => prev.filter(p => !newIds.includes(p.id)));
    }
  };

  const handleRemoveGalleryImage = (idToRemove: string, keyToRemove?: string) => {
    setLocalPreviews(prev => prev.filter(p => p.id !== idToRemove));
    if (keyToRemove) {
      const currentKeys = watch('gallery_image_keys') || [];
      setValue('gallery_image_keys', currentKeys.filter(k => k !== keyToRemove), { shouldDirty: true });
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
          <Label htmlFor="name">Product Name <span className="text-rose-500">*</span></Label>
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
          <Label htmlFor="sku">SKU <span className="text-rose-500">*</span></Label>
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
              <SelectValue placeholder="Select a category">
                {categoryId 
                  ? (categories?.find(c => c.id === categoryId)?.name || categoryId) 
                  : 'Select a category'
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {categories
                ?.filter(category => {
                  const active = category.isActive ?? category.is_active;
                  return active !== false || category.id === categoryId;
                })
                ?.map(category => (
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
              checked={is_active} 
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
        <Label htmlFor="description">Description <span className="text-rose-500">*</span></Label>
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
        <Label>Product Image <span className="text-rose-500">*</span></Label>
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
          {imageKey ? (
            <div className="relative group w-full max-w-[200px] aspect-square rounded-lg overflow-hidden border border-slate-200">
              <img 
                src={primaryPreviewUrl || resolveProductImageUrl(imageKey)} 
                alt="Preview" 
                className="w-full h-full object-cover"
              />
              {!readOnly && (
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setValue('image', '');
                    setPrimaryPreviewUrl('');
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
                {uploadPrimaryMutation.isPending ? (
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                ) : (
                  <Upload className="h-8 w-8 text-slate-400" />
                )}
              </div>
              <div>
                <p className="font-medium text-slate-700">
                  {uploadPrimaryMutation.isPending ? 'Uploading...' : 'Click or drag to upload'}
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
            disabled={readOnly || uploadPrimaryMutation.isPending}
          />
        </div>
        {errors.image && <p className="text-sm text-rose-500">{errors.image.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Product Gallery <span className="text-rose-500">*</span></Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
          {localPreviews.map((item) => (
            <div key={item.id} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
              <img 
                src={item.url} 
                alt="Gallery Item" 
                className={cn("w-full h-full object-cover", item.isUploading && "opacity-40")}
              />
              {item.isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                </div>
              )}
              {!readOnly && !item.isUploading && (
                <button 
                  type="button"
                  onClick={() => handleRemoveGalleryImage(item.id, item.key)}
                  className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
          
          {!readOnly && (
            <div 
              className={cn(
                "border-2 border-dashed rounded-lg aspect-square flex flex-col items-center justify-center gap-2 text-center cursor-pointer transition-all hover:border-indigo-400 hover:bg-slate-50/50",
                uploadGalleryMutation.isPending ? "opacity-50 pointer-events-none" : "border-slate-200"
              )}
              onClick={() => document.getElementById('gallery-upload')?.click()}
            >
              {uploadGalleryMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
              ) : (
                <>
                  <Upload className="h-5 w-5 text-slate-400" />
                  <span className="text-xs text-slate-500 font-medium px-2">Upload Gallery</span>
                </>
              )}
              <input 
                id="gallery-upload" 
                type="file" 
                multiple
                className="hidden" 
                accept="image/*"
                onChange={handleGalleryFileSelect}
                disabled={uploadGalleryMutation.isPending}
              />
            </div>
          )}
        </div>
        {errors.gallery_image_keys && (
          <p className="text-sm text-rose-500 mt-2">{errors.gallery_image_keys.message}</p>
        )}
      </div>

      <div className="pt-4 flex justify-end gap-2">
        <Link href="/products">
          <Button type="button" variant="outline">
            {readOnly ? 'Back' : 'Cancel'}
          </Button>
        </Link>
        {!readOnly && (
          <Button type="submit" disabled={isPending || uploadPrimaryMutation.isPending || uploadGalleryMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 min-w-[120px]">
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
