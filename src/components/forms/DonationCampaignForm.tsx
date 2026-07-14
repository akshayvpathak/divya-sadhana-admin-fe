'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false, loading: () => <p className="text-sm text-slate-500 py-4">Loading editor...</p> });
import { createDonationCampaignSchema, CreateDonationCampaignPayload } from '@/schemas/donation-campaigns.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { useEffect, useMemo } from 'react';
import { useDonationCampaignQuery } from '@/hooks/queries/useDonationCampaignsQuery';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { useUploadImageMutation } from '@/hooks/queries/useImageUploadQuery';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import { resolveProductImageUrl, extractImageKey } from '@/hooks/useProducts';

interface DonationCampaignFormProps {
  campaignId?: string;
  initialData?: CreateDonationCampaignPayload;
  onSubmit?: (data: CreateDonationCampaignPayload) => void;
  isPending?: boolean;
  readOnly?: boolean;
}

export function DonationCampaignForm({ campaignId, initialData: propsInitialData, onSubmit, isPending, readOnly = false }: DonationCampaignFormProps) {
  const { data: fetchedCampaign, isLoading: isFetching } = useDonationCampaignQuery(campaignId || null);
  const uploadMutation = useUploadImageMutation("campaign_cover");
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const initialData = useMemo(() => {
    if (fetchedCampaign) {
      const imgKey = fetchedCampaign.cover_image_key || (fetchedCampaign.cover_image_url ? extractImageKey(fetchedCampaign.cover_image_url) : '');
      return {
        title: fetchedCampaign.title,
        slug: fetchedCampaign.slug || '',
        description: fetchedCampaign.description,
        target_amount: fetchedCampaign.target_amount,
        status: fetchedCampaign.status,
        is_active: fetchedCampaign.is_active ?? true,
        starts_at: fetchedCampaign.starts_at ? dayjs(fetchedCampaign.starts_at).format('YYYY-MM-DD') : '',
        ends_at: fetchedCampaign.ends_at ? dayjs(fetchedCampaign.ends_at).format('YYYY-MM-DD') : '',
        cover_image_key: imgKey,
        cover_image_url: fetchedCampaign.cover_image_url || '',
      };
    }
    return propsInitialData;
  }, [fetchedCampaign, propsInitialData]);

  useEffect(() => {
    const data = initialData as any;
    if (data && data.cover_image_url) {
      setPreviewUrl(data.cover_image_url);
    } else if (data && data.cover_image_key) {
      setPreviewUrl(resolveProductImageUrl(data.cover_image_key));
    } else {
      setPreviewUrl('');
    }
  }, [initialData]);

  const { register, control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CreateDonationCampaignPayload>({
    resolver: zodResolver(createDonationCampaignSchema) as any,
    defaultValues: {
      title: '',
      slug: '',
      description: '',
      target_amount: 0,
      status: 'draft',
      is_active: true,
      starts_at: '',
      ends_at: '',
      cover_image_key: '',
      ...initialData,
    },
  });

  const titleValue = watch('title');
  const statusValue = watch('status');
  const isActive = watch('is_active');
  const coverImageKey = watch('cover_image_key');

  // Auto-generate slug from title if not edit mode and title changes
  useEffect(() => {
    if (!readOnly && !campaignId && titleValue) {
      const generatedSlug = titleValue
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setValue('slug', generatedSlug, { shouldValidate: true });
    }
  }, [titleValue, setValue, readOnly, campaignId]);

  // Use previewUrl state for displaying the image preview

  useEffect(() => {
    register('is_active');
    register('status');
    register('cover_image_key');
  }, [register]);

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  const handleFormSubmit = (data: CreateDonationCampaignPayload) => {
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

    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    try {
      const keys = await uploadMutation.mutateAsync([file]);
      if (keys && keys.length > 0) {
        setValue('cover_image_key', keys[0], { shouldValidate: true });
        toast.success('Image uploaded successfully');
      }
    } catch (error) {
      toast.error('Failed to upload image');
    }
  };

  if (campaignId && isFetching) {
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
          <Label htmlFor="title">Title <span className="text-rose-500">*</span></Label>
          <Input 
            id="title" 
            placeholder="Title of the campaign" 
            {...register('title')} 
            disabled={readOnly}
            className={readOnly ? "bg-slate-50 border-slate-200 text-slate-600 cursor-default focus-visible:ring-0" : ""}
          />
          {errors.title && <p className="text-sm text-rose-500">{errors.title.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug <span className="text-rose-500">*</span></Label>
          <Input 
            id="slug" 
            placeholder="sulg-of-the-campaign" 
            {...register('slug')} 
            disabled={readOnly}
            className={readOnly ? "bg-slate-50 border-slate-200 text-slate-600 cursor-default focus-visible:ring-0" : ""}
          />
          {errors.slug && <p className="text-sm text-rose-500">{errors.slug.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="target_amount">Target Amount ($)</Label>
          <Input 
            id="target_amount" 
            type="number" 
            placeholder="10000" 
            {...register('target_amount')} 
            disabled={readOnly}
            min={0}
            className={readOnly ? "bg-slate-50 border-slate-200 text-slate-600 cursor-default focus-visible:ring-0" : ""}
          />
          {errors.target_amount && <p className="text-sm text-rose-500">{errors.target_amount.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="starts_at">Start Date</Label>
          <Input 
            id="starts_at" 
            type="date" 
            {...register('starts_at')} 
            disabled={readOnly}
            className={readOnly ? "bg-slate-50 border-slate-200 text-slate-600 cursor-default focus-visible:ring-0" : ""}
          />
          {errors.starts_at && <p className="text-sm text-rose-500">{errors.starts_at.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="ends_at">End Date</Label>
          <Input 
            id="ends_at" 
            type="date" 
            {...register('ends_at')} 
            disabled={readOnly}
            className={readOnly ? "bg-slate-50 border-slate-200 text-slate-600 cursor-default focus-visible:ring-0" : ""}
          />
          {errors.ends_at && <p className="text-sm text-rose-500">{errors.ends_at.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select 
            value={statusValue || ""} 
            onValueChange={(val) => setValue('status', val as any)}
            disabled={readOnly}
          >
            <SelectTrigger id="status" className={readOnly ? "bg-slate-50 border-slate-200 text-slate-600 cursor-default" : "bg-white"}>
              <SelectValue placeholder="Select status">
                {statusValue ? (statusValue === 'draft' ? 'Draft' : statusValue === 'active' ? 'Active' : statusValue) : 'Select status'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
            </SelectContent>
          </Select>
          {errors.status && <p className="text-sm text-rose-500">{errors.status.message}</p>}
        </div>

        <div className="flex gap-8 items-center pt-4">
          <div className="flex items-center gap-2">
            <Switch 
              id="is_active" 
              checked={isActive} 
              onCheckedChange={(val) => setValue('is_active', val)}
              disabled={readOnly}
            />
            <Label htmlFor="is_active" className="cursor-pointer">Campaign Visibility</Label>
          </div>
        </div>
      </div>

      <div className="space-y-2 pb-4">
        <Label htmlFor="description">Description <span className="text-rose-500">*</span></Label>
        <div className="bg-white rounded-md pb-6">
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <ReactQuill 
                theme="snow"
                value={field.value}
                onChange={field.onChange}
                readOnly={readOnly}
                className={readOnly ? "bg-slate-50 border-slate-200 opacity-75 pointer-events-none h-[200px] mb-12" : "h-[200px] mb-12"}
              />
            )}
          />
        </div>
        {errors.description && <p className="text-sm text-rose-500">{errors.description.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Cover Image <span className="text-rose-500">*</span></Label>
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
          onClick={() => !readOnly && document.getElementById('cover-image-upload')?.click()}
        >
          {previewUrl ? (
            <div className="relative group w-full max-w-[200px] aspect-[16/10] rounded-lg overflow-hidden border border-slate-200">
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="w-full h-full object-cover"
              />
              {!readOnly && (
                <button 
                   type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setValue('cover_image_key', '', { shouldValidate: true });
                    setPreviewUrl('');
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
                <p className="text-xs text-slate-400 mt-1">PNG, JPG or JPEG up to 5MB</p>
              </div>
            </div>
          )}
          <input 
            id="cover-image-upload" 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleFileSelect}
            disabled={readOnly}
          />
        </div>
        {errors.cover_image_key && <p className="text-sm text-rose-500">{errors.cover_image_key.message}</p>}
      </div>

      <div className="pt-4 flex justify-end gap-2">
        <Link href="/donation-campaigns">
          <Button type="button" variant="outline">
            {readOnly ? 'Back' : 'Cancel'}
          </Button>
        </Link>
        {!readOnly && (
          <Button type="submit" disabled={isPending} className="bg-indigo-600 hover:bg-indigo-700">
            {isPending ? 'Processing...' : (campaignId ? 'Edit Campaign' : 'Create Campaign')}
          </Button>
        )}
      </div>
    </form>
  );
}
