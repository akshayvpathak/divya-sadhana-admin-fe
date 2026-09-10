'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { Upload, X, Loader2 } from 'lucide-react';
import {
  createSadhanaServiceSchema,
  CreateSadhanaServicePayload,
  serviceCategoryEnum,
  SADHANA_SERVICE_SLUG_MAX_LENGTH,
} from '@/schemas/sadhana-services.schema';
import { slugify } from '@/lib/slug';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useSadhanaServiceQuery } from '@/hooks/queries/useSadhanaServicesQuery';
import { useUploadImageMutation } from '@/hooks/queries/useImageUploadQuery';
import { resolveProductImageUrl, extractImageKey } from '@/hooks/useProducts';
import InputSchemaEditor from './sadhana-service/InputSchemaEditor';
import PricingOptionsEditor from './sadhana-service/PricingOptionsEditor';
import DiscountFields from '@/components/forms/shared/DiscountFields';

const CATEGORIES = serviceCategoryEnum.options;

/** Object URLs are only created for local previews; server URLs must be left alone. */
function revokeIfBlob(url: string) {
  if (url.startsWith('blob:')) URL.revokeObjectURL(url);
}

/** Mirrors the block conventions `parse-seva-description.ts` recognises on the storefront. */
const DESCRIPTION_PLACEHOLDER = `जीवन के रहस्यों का पूर्ण प्रकटीकरण

परिचय

इस सेवा का विवरण यहाँ लिखें।

क्या जानकारियां मिलेंगी

- पहला बिंदु
- दूसरा बिंदु

बुकिंग प्रक्रिया

1. पहला चरण
2. दूसरा चरण`;

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
  /** Set once the admin types in the slug field, which stops the name-driven auto-fill. */
  const slugTouchedRef = useRef(false);
  /** Id of the service already loaded into the form; see the reset effect below. */
  const loadedServiceIdRef = useRef<string | null>(null);

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
      discount_enabled: fetchedService.discount_enabled ?? false,
      discount_type: fetchedService.discount_type ?? 'percentage',
      discount_value: fetchedService.discount_value ?? 0,
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
      discount_enabled: false,
      discount_type: 'percentage',
      discount_value: 0,
      ...initialData,
    },
  });

  // Registered up here so the slug input can wrap `onChange` and still forward to RHF.
  const slugField = register('slug');

  const nameValue = watch('name');
  const categoryValue = watch('category');
  const isActive = watch('is_active');
  const requiresImage = watch('requires_image');
  const discountEnabled = watch('discount_enabled') ?? false;
  const discountType = watch('discount_type') ?? 'percentage';
  const discountValue = Number(watch('discount_value')) || 0;
  /**
   * Configured once on the service and applied to whichever option the devotee picks. Preview
   * against the cheapest option, since that is where a fixed amount bites first.
   */
  const pricingOptions = watch('pricing_options') ?? [];
  const optionAmounts = pricingOptions
    .map((o: { amount?: number | string }) => Number(o?.amount) || 0)
    .filter((n: number) => n > 0);
  const discountBasePrice = optionAmounts.length ? Math.min(...optionAmounts) : 0;
  const requiresApplication = watch('requires_application');

  /**
   * Suggest a slug from the name, but only until the admin edits the slug themselves.
   * Service names are Devanagari, so `slugify` transliterates before stripping — the
   * plain `[^a-z0-9]` strip this replaced erased the whole name and left the field
   * empty, and re-erased any slug typed by hand on the next keystroke in `name`.
   */
  useEffect(() => {
    if (readOnly || serviceId || slugTouchedRef.current || !nameValue) return;
    const generated = slugify(nameValue, { maxLength: SADHANA_SERVICE_SLUG_MAX_LENGTH });
    if (generated) setValue('slug', generated, { shouldValidate: true });
  }, [nameValue, setValue, readOnly, serviceId]);

  useEffect(() => {
    register('cover_image_key');
  }, [register]);

  /**
   * Load the fetched service into the form exactly once per service.
   *
   * `initialData` is a fresh object on every query result, and this query is refetched on
   * window focus once it goes stale (60s). Resetting on every change meant an admin who
   * alt-tabbed mid-edit came back to a form silently rewound to the server's values, with
   * their unsaved description and pricing gone. Keying on the id keeps the initial load and
   * ignores later refetches of the same record.
   */
  useEffect(() => {
    if (!fetchedService || !initialData) return;
    if (loadedServiceIdRef.current === fetchedService.id) return;
    loadedServiceIdRef.current = fetchedService.id;

    reset(initialData);

    const data = initialData as { cover_image_url?: string; cover_image_key?: string };
    if (data.cover_image_url) setPreviewUrl(data.cover_image_url);
    else if (data.cover_image_key) setPreviewUrl(resolveProductImageUrl(data.cover_image_key));
    else setPreviewUrl('');
  }, [fetchedService, initialData, reset]);

  const handleFormSubmit = (data: CreateSadhanaServicePayload) => {
    onSubmit?.(data);
  };

  /**
   * Without this, a bad pricing key or input-schema row simply made the Save button do
   * nothing: the offending field can be several screens down, so there was no way to tell
   * a failed validation from a dead button.
   */
  const handleInvalid = () => {
    toast.error('Some fields need fixing — check the highlighted rows below.');
    const firstInvalid = document.querySelector('[data-slot="form-error"]');
    firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Show the local file immediately, but be able to undo it: on a failed upload the
    // form would otherwise keep displaying a cover that was never stored, and saving
    // would drop it without a word.
    const previousPreview = previewUrl;
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    try {
      const keys = await uploadMutation.mutateAsync([file]);
      if (!keys?.length) throw new Error('Upload returned no image key');
      setValue('cover_image_key', keys[0], { shouldValidate: true });
      revokeIfBlob(previousPreview);
      toast.success('Image uploaded');
    } catch {
      setPreviewUrl(previousPreview);
      revokeIfBlob(localPreview);
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
    <form onSubmit={handleSubmit(handleFormSubmit, handleInvalid)} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name <span className="text-danger">*</span></Label>
          <Input id="name" placeholder="Service name" {...register('name')} disabled={readOnly} className={roClass} />
          {errors.name && <p data-slot="form-error" className="text-sm text-danger">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug <span className="text-danger">*</span></Label>
          <Input
            id="slug"
            placeholder="service-slug"
            maxLength={SADHANA_SERVICE_SLUG_MAX_LENGTH}
            {...slugField}
            onChange={(event) => {
              slugTouchedRef.current = true;
              slugField.onChange(event);
            }}
            disabled={readOnly}
            className={roClass}
          />
          {errors.slug && <p data-slot="form-error" className="text-sm text-danger">{errors.slug.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category <span className="text-danger">*</span></Label>
          <Select value={categoryValue || ''} onValueChange={(val) => setValue('category', val as CreateSadhanaServicePayload['category'], { shouldValidate: true })} disabled={readOnly}>
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
          {errors.category && <p data-slot="form-error" className="text-sm text-danger">{errors.category.message}</p>}
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

      {/*
        Plain text, not rich text. The storefront runs this field through
        `parse-seva-description` and renders every block as escaped text, so any HTML
        saved here shows up as literal `<p>` tags on the live seva page. A rich-text
        editor was used here by copy-paste from the product form, whose description
        *is* rendered as HTML — that difference is real and this field is the text side.
      */}
      <div className="space-y-2 pb-4">
        <Label htmlFor="description">Description <span className="text-danger">*</span></Label>
        {readOnly ? (
          <div className="min-h-[160px] whitespace-pre-line rounded-md border border-line bg-cream p-4 text-charcoal">
            {watch('description') || ''}
          </div>
        ) : (
          <>
            <Textarea
              id="description"
              rows={16}
              placeholder={DESCRIPTION_PLACEHOLDER}
              className="min-h-[320px] whitespace-pre-wrap text-sm leading-relaxed"
              {...register('description')}
            />
            <p className="text-xs text-moon">
              Plain text. Blank line = new paragraph &middot; a short line on its own = heading
              &middot; lines starting with <code className="font-mono">- </code> = bullet list
              &middot; lines starting with <code className="font-mono">1. </code> = numbered list.
            </p>
          </>
        )}
        {errors.description && <p data-slot="form-error" className="text-sm text-danger">{errors.description.message}</p>}
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
                    revokeIfBlob(previewUrl);
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

        <DiscountFields
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          control={control as any}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          register={register as any}
          errors={errors}
          basePrice={discountBasePrice}
          enabled={discountEnabled}
          type={discountType}
          value={discountValue}
          priceLabel="the lowest-priced option"
          readOnly={readOnly}
        />
      </div>

      <div className="rounded-xl border border-line p-4">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <InputSchemaEditor control={control as any} register={register as any} errors={errors} readOnly={readOnly} />
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
