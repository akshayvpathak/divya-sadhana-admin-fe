'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Upload, X } from 'lucide-react';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useUploadImageMutation } from '@/hooks/queries/useImageUploadQuery';
import {
  HomepageGalleryFormValues,
  HomepageGalleryItem,
  homepageGalleryFormSchema,
} from '@/schemas/homepage-gallery.schema';

type Props = {
  item?: HomepageGalleryItem;
  onSubmit: (data: HomepageGalleryFormValues) => void;
  isPending?: boolean;
};

export function HomepageGalleryForm({ item, onSubmit, isPending = false }: Props) {
  const uploadMutation = useUploadImageMutation('homepage_gallery');
  const [previewUrl, setPreviewUrl] = useState(item?.image_url || '');
  const [isDragging, setIsDragging] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<HomepageGalleryFormValues>({
    resolver: zodResolver(homepageGalleryFormSchema) as any,
    defaultValues: {
      image_key: '',
      title: '',
      caption: '',
      link_url: '',
      link_type: 'none',
      display_order: 0,
      is_active: true,
    },
  });

  useEffect(() => {
    if (!item) return;
    reset({
      image_key: '',
      title: item.title || '',
      caption: item.caption || '',
      link_url: item.link_url || '',
      link_type: item.link_type,
      display_order: item.display_order,
      is_active: item.is_active,
    });
    setPreviewUrl(item.image_url || '');
  }, [item, reset]);

  const linkType = watch('link_type');
  const isActive = watch('is_active');
  const uploadedImageKey = watch('image_key');

  useEffect(() => {
    if (linkType === 'none') {
      setValue('link_url', '', { shouldValidate: true });
    }
  }, [linkType, setValue]);

  const uploadFile = useCallback(
    async (file: File) => {
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
      if (!allowed.includes(file.type)) {
        toast.error('Use a JPG, PNG, WebP or HEIC image');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image must be 10 MB or smaller');
        return;
      }

      const localUrl = URL.createObjectURL(file);
      setPreviewUrl(localUrl);

      try {
        const keys = await uploadMutation.mutateAsync([file]);
        if (!keys[0]) throw new Error('Upload did not return an object key');
        setValue('image_key', keys[0], { shouldValidate: true, shouldDirty: true });
        toast.success('Image uploaded successfully');
      } catch {
        URL.revokeObjectURL(localUrl);
        setPreviewUrl(item?.image_url || '');
        toast.error('Failed to upload image');
      }
    },
    [item?.image_url, setValue, uploadMutation]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setIsDragging(false);
      const file = event.dataTransfer.files?.[0];
      if (file) void uploadFile(file);
    },
    [uploadFile]
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label>Gallery Image <span className="text-danger">*</span></Label>
        <div
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-6 text-center transition-colors',
            isDragging ? 'border-gold bg-tint/50' : 'border-line hover:border-gold hover:bg-cream'
          )}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('homepage-gallery-upload')?.click()}
        >
          {previewUrl ? (
            <div className="group relative aspect-[16/9] w-full max-w-xl overflow-hidden rounded-xl border border-line bg-cosmos">
              <img src={previewUrl} alt="Gallery preview" className="h-full w-full object-cover" />
              {uploadedImageKey && (
                <button
                  type="button"
                  aria-label={item ? 'Revert replacement image' : 'Remove selected image'}
                  onClick={(event) => {
                    event.stopPropagation();
                    setValue('image_key', '', { shouldDirty: true });
                    setPreviewUrl(item?.image_url || '');
                  }}
                  className="absolute right-2 top-2 rounded-full bg-danger p-1.5 text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-moon">
              <div className="rounded-full bg-cosmos p-4">
                {uploadMutation.isPending ? (
                  <Loader2 className="h-8 w-8 animate-spin text-gold-press" />
                ) : (
                  <Upload className="h-8 w-8" />
                )}
              </div>
              <p className="font-medium text-charcoal">
                {uploadMutation.isPending ? 'Uploading…' : 'Click or drag to upload'}
              </p>
              <p className="text-xs">JPG, PNG, WebP or HEIC · max 10 MB</p>
            </div>
          )}

          <input
            id="homepage-gallery-upload"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,.heic"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void uploadFile(file);
              event.currentTarget.value = '';
            }}
          />
        </div>
        {!item && !uploadedImageKey && (
          <p className="text-xs text-moon">An image is required before creating the item.</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" placeholder="Optional title" {...register('title')} />
          {errors.title && <p className="text-sm text-danger">{errors.title.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="display_order">Display Order</Label>
          <Input id="display_order" type="number" min={0} {...register('display_order')} />
          {errors.display_order && <p className="text-sm text-danger">{errors.display_order.message}</p>}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="caption">Caption</Label>
          <Textarea id="caption" rows={3} placeholder="Optional caption shown with the image" {...register('caption')} />
          {errors.caption && <p className="text-sm text-danger">{errors.caption.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="link_type">Link Type</Label>
          <Controller
            name="link_type"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="link_type" className="bg-surface">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No link</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="link_url">Link URL</Label>
          <Input
            id="link_url"
            type="url"
            placeholder={linkType === 'none' ? 'Not used' : 'https://…'}
            disabled={linkType === 'none'}
            {...register('link_url')}
          />
          {errors.link_url && <p className="text-sm text-danger">{errors.link_url.message}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-line bg-cream px-4 py-3">
        <Switch
          id="gallery-active"
          checked={isActive}
          onCheckedChange={(value) => setValue('is_active', value, { shouldDirty: true })}
        />
        <div>
          <Label htmlFor="gallery-active" className="cursor-pointer">Show on homepage</Label>
          <p className="text-xs text-moon">Inactive items stay in admin but are hidden from the public carousel.</p>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Link href="/homepage-gallery" className="w-full sm:w-auto">
          <Button type="button" variant="outline" className="w-full">Cancel</Button>
        </Link>
        <Button
          type="submit"
          disabled={isPending || uploadMutation.isPending || (!item && !uploadedImageKey)}
          className="w-full sm:w-auto"
        >
          {isPending ? 'Saving…' : item ? 'Save Changes' : 'Create Gallery Item'}
        </Button>
      </div>
    </form>
  );
}
