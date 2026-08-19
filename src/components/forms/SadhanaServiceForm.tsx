'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { Upload, X, Loader2 } from 'lucide-react';
import {
  createSadhanaServiceSchema,
  CreateSadhanaServicePayload,
  serviceCategoryEnum,
} from '@/schemas/sadhana-services.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useSadhanaServiceQuery } from '@/hooks/queries/useSadhanaServicesQuery';
import { useUploadImageMutation } from '@/hooks/queries/useImageUploadQuery';
import { resolveProductImageUrl, extractImageKey } from '@/hooks/useProducts';
import InputSchemaEditor from './sadhana-service/InputSchemaEditor';
import PricingOptionsEditor from './sadhana-service/PricingOptionsEditor';

const ReactQuill = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => <p className="py-4 text-sm text-moon">Loading editor...</p>,
});

const CATEGORIES = serviceCategoryEnum.options;

interface SadhanaServiceFormProps {
  serviceId?: string;
  onSubmit?: (data: CreateSadhanaServicePayload) => void;
  isPending?: boolean;
  readOnly?: boolean;
}

export function SadhanaServiceForm({ serviceId, onSubmit, isPending, readOnly = false }: SadhanaServiceFormProps) {
  const { data: fetchedService, isLoading: isFetching } = useSadhanaServiceQuery(serviceId || null);
  const uploadMutation = useUploadImageMutation('sadhana_service_cover');
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  const initialData = useMemo(() => {
    if (!fetchedService) return undefined;
    const imgKey =
      fetchedService.cover_image_key ||
      (fetchedService.cover_image_url ? extractImageKey(fetchedService.cover_image_url) : '');
    return {
      name: fetchedService.name,
      slug: fetchedService.slug || '',
      category: fetchedService.category,
      description: fetchedService.description || '',
      cover_image_key: imgKey,
      cover_image_url: fetchedService.cover_image_url || '',
      is_active: fetchedService.is_active ?? true,
      requires_image: fetchedService.requires_image ?? false,
      requires_application: fetchedService.requires_application ?? false,
      display_order: fetchedService.display_order ?? 0,
      input_schema: (fetchedService.input_schema ?? []).map((f: Record<string, unknown>) => ({
        key: (f.key as string) ?? '',
        label: (f.label as string) ?? '',
        type: (f.type as string) ?? 'text',
        required: !!f.required,
        placeholder: (f.placeholder as string) ?? '',
        help_text: (f.help_text as string) ?? '',
        options: Array.isArray(f.options)
          ? (f.options as Record<string, unknown>[]).map((o) => ({
              value: String(o.value ?? ''),
              label: String(o.label ?? ''),
            }))
          : [],
      })),
      pricing_options: (fetchedService.pricing_options ?? []).map((o: Record<string, unknown>) => ({
        key: (o.key as string) ?? '',
        label: (o.label as string) ?? '',
        amount: Number(o.amount ?? 0),
        currency: (o.currency as string) ?? 'INR',
        note: (o.note as string) ?? '',
        travel_extra: !!o.travel_extra,
        duration_days: (o.duration_days as number | null) ?? null,
      })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
  }, [fetchedService]);

  useEffect(() => {
    const data = initialData as { cover_image_url?: string; cover_image_key?: string } | undefined;
    if (data?.cover_image_url) setPreviewUrl(data.cover_image_url);
    else if (data?.cover_image_key) setPreviewUrl(resolveProductImageUrl(data.cover_image_key));
    else setPreviewUrl('');
  }, [initialData]);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateSadhanaServicePayload>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createSadhanaServiceSchema) as any,
    defaultValues: {
      name: '',
      slug: '',
      category: 'anushthan',
      description: '',
      cover_image_key: '',
      is_active: true,
      requires_image: false,
      requires_application: false,
      input_schema: [],
      pricing_options: [],
      display_order: 0,
      ...initialData,
    },
  });

  const nameValue = watch('name');
  const categoryValue = watch('category');
  const isActive = watch('is_active');
  const requiresImage = watch('requires_image');
  const requiresApplication = watch('requires_application');

  useEffect(() => {
    if (!readOnly && !serviceId && nameValue) {
      const slug = nameValue
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setValue('slug', slug, { shouldValidate: true });
    }
  }, [nameValue, setValue, readOnly, serviceId]);

  useEffect(() => {
    register('cover_image_key');
  }, [register]);

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const handleFormSubmit = (data: CreateSadhanaServicePayload) => {
    onSubmit?.(data);
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    setPreviewUrl(URL.createObjectURL(file));
    try {
      const keys = await uploadMutation.mutateAsync([file]);
      if (keys?.length) {
        setValue('cover_image_key', keys[0], { shouldValidate: true });
        toast.success('Image uploaded');
      }
    } catch {
      toast.error('Failed to upload image');
    }
  };

  if (serviceId && isFetching) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 w-full animate-pulse rounded-lg bg-cosmos" />
        ))}
      </div>
    );
  }

  const roClass = readOnly ? 'bg-ivory border-line text-charcoal cursor-default focus-visible:ring-0' : '';

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name <span className="text-danger">*</span></Label>
          <Input id="name" placeholder="Service name" {...register('name')} disabled={readOnly} className={roClass} />
          {errors.name && <p className="text-sm text-danger">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug <span className="text-danger">*</span></Label>
          <Input id="slug" placeholder="service-slug" {...register('slug')} disabled={readOnly} className={roClass} />
          {errors.slug && <p className="text-sm text-danger">{errors.slug.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category <span className="text-danger">*</span></Label>
          <Select value={categoryValue || ''} onValueChange={(val) => setValue('category', val as CreateSadhanaServicePayload['category'])} disabled={readOnly}>
            <SelectTrigger id="category" className={readOnly ? 'bg-cream border-line text-charcoal' : 'bg-surface'}>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && <p className="text-sm text-danger">{errors.category.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="display_order">Display Order</Label>
          <Input id="display_order" type="number" min={0} {...register('display_order')} disabled={readOnly} className={roClass} />
        </div>
      </div>

      <div className="flex flex-wrap gap-8 pt-1">
        <div className="flex items-center gap-2">
          <Switch id="is_active" checked={isActive} onCheckedChange={(v) => setValue('is_active', v)} disabled={readOnly} />
          <Label htmlFor="is_active" className="cursor-pointer">Active</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="requires_image" checked={requiresImage} onCheckedChange={(v) => setValue('requires_image', v)} disabled={readOnly} />
          <Label htmlFor="requires_image" className="cursor-pointer">Requires photo</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="requires_application" checked={requiresApplication} onCheckedChange={(v) => setValue('requires_application', v)} disabled={readOnly} />
          <Label htmlFor="requires_application" className="cursor-pointer">Requires application (diksha gate)</Label>
        </div>
      </div>

      <div className="space-y-2 pb-4">
        <Label htmlFor="description">Description <span className="text-danger">*</span></Label>
        <div className="rounded-md bg-surface pb-6">
          {readOnly ? (
            <div className="min-h-[160px] whitespace-pre-line rounded-md border border-line bg-cream p-4 text-charcoal">
              {watch('description') || ''}
            </div>
          ) : (
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <ReactQuill theme="snow" value={field.value} onChange={field.onChange} className="mb-12 h-[200px]" />
              )}
            />
          )}
        </div>
        {errors.description && <p className="text-sm text-danger">{errors.description.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Cover Image</Label>
        <div
          className={cn(
            'flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-8 text-center transition-all',
            isDragging ? 'border-gold bg-tint/50' : 'border-line',
            !readOnly && 'cursor-pointer hover:border-gold hover:bg-cream',
            readOnly && 'cursor-default bg-cream opacity-75',
          )}
          onDragOver={(e) => {
            e.preventDefault();
            if (!readOnly) setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (readOnly) return;
            const file = e.dataTransfer.files?.[0];
            if (file) handleFileUpload(file);
          }}
          onClick={() => !readOnly && document.getElementById('sadhana-cover-upload')?.click()}
        >
          {previewUrl ? (
            <div className="relative aspect-[16/10] w-full max-w-[200px] overflow-hidden rounded-lg border border-line group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
              {!readOnly && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setValue('cover_image_key', '', { shouldValidate: true });
                    setPreviewUrl('');
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
                  <Upload className="h-8 w-8 text-moon" />
                )}
              </div>
              <p className="font-medium text-charcoal">
                {uploadMutation.isPending ? 'Uploading...' : 'Click or drag to upload'}
              </p>
            </div>
          )}
          <input id="sadhana-cover-upload" type="file" accept="image/*" className="hidden" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
          }} disabled={readOnly} />
        </div>
      </div>

      <div className="rounded-xl border border-line p-4">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <PricingOptionsEditor control={control as any} register={register as any} errors={errors} readOnly={readOnly} />
      </div>

      <div className="rounded-xl border border-line p-4">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <InputSchemaEditor control={control as any} register={register as any} readOnly={readOnly} />
      </div>

      <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end [&>a]:w-full sm:[&>a]:w-auto [&_[data-slot=button]]:w-full sm:[&_[data-slot=button]]:w-auto">
        <Link href="/sadhana-services">
          <Button type="button" variant="outline">
            {readOnly ? 'Back' : 'Cancel'}
          </Button>
        </Link>
        {!readOnly && (
          <Button type="submit" disabled={isPending} className="bg-gold-deep hover:bg-gold-deep">
            {isPending ? 'Processing...' : serviceId ? 'Save Service' : 'Create Service'}
          </Button>
        )}
      </div>
    </form>
  );
}
