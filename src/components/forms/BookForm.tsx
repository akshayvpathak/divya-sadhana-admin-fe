'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { toast } from 'react-toastify';
import {
  Upload,
  X,
  Loader2,
  FileText,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Package,
} from 'lucide-react';
import {
  bookFormSchema,
  emptyBookForm,
  toBookFormValues,
  toBookPayload,
  type AdminBook,
  type BookFormValues,
  type BookPayload,
  type DigitalAsset,
} from '@/schemas/books.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAllCategories } from '@/hooks/useCategories';
import { useUploadEbookMutation, EBOOK_MAX_BYTES } from '@/hooks/useBooks';
import { useUploadImageMutation } from '@/hooks/queries/useImageUploadQuery';
import { resolveProductImageUrl, extractImageKey } from '@/hooks/useProducts';
import { cn } from '@/lib/utils';

interface BookFormProps {
  book?: AdminBook;
  onSubmit: (payload: BookPayload) => void;
  isPending?: boolean;
  submitLabel?: string;
}

function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return '';
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-danger">{message}</p>;
}

export function BookForm({ book, onSubmit, isPending, submitLabel = 'Save book' }: BookFormProps) {
  const { data: categories } = useAllCategories();
  const uploadEbook = useUploadEbookMutation();
  const uploadCover = useUploadImageMutation('product_gallery');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [asset, setAsset] = useState<DigitalAsset | null>(null);
  const [coverPreview, setCoverPreview] = useState('');

  const defaultValues = useMemo<BookFormValues>(
    () => (book ? toBookFormValues(book) : emptyBookForm),
    [book],
  );

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BookFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(bookFormSchema) as any,
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
    const existingAsset = (book?.variants ?? []).find((v) => v.variant_type === 'EBOOK')
      ?.digital_asset;
    setAsset(existingAsset ?? null);
    setCoverPreview(book?.primary_image_url ? resolveProductImageUrl(book.primary_image_url) : '');
  }, [defaultValues, book, reset]);

  const ebookEnabled = watch('ebook_enabled');
  const printedEnabled = watch('printed_enabled');
  const coverKey = watch('cover_image_key');
  const isEditing = Boolean(book);

  async function handleEbookFile(file: File | undefined) {
    if (!file) return;
    try {
      const registered = await uploadEbook.mutateAsync(file);
      setAsset(registered);
      setValue('ebook_digital_asset_id', registered.id, { shouldValidate: true });
      toast.success(`Uploaded — ${registered.page_count ?? '?'} pages detected`);
    } catch {
      // useUploadEbookMutation already surfaced the message.
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleCoverFile(file: File | undefined) {
    if (!file) return;
    try {
      const [key] = await uploadCover.mutateAsync([file]);
      setValue('cover_image_key', extractImageKey(key), { shouldValidate: true });
      setCoverPreview(URL.createObjectURL(file));
    } catch {
      toast.error('Cover upload failed. Please try again.');
    } finally {
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  }

  const submit = handleSubmit((values) => onSubmit(toBookPayload(values)));

  return (
    <form onSubmit={submit} className="space-y-8">
      {/* ---------------------------------------------------------------- Title */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-ink">Title</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" placeholder="Bhagavad Gita" {...register('title')} />
            <FieldError message={errors.title?.message} />
          </div>

          <div>
            <Label htmlFor="category_id">Category *</Label>
            <Controller
              name="category_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value || ''} onValueChange={field.onChange}>
                  <SelectTrigger id="category_id">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {(categories ?? []).map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {/* Merchandising only — the storefront finds books by product_type, never by
                category name, so this choice cannot break the books listing. */}
            <p className="mt-1 text-xs text-moon">Used for browsing. Not how books are identified.</p>
            <FieldError message={errors.category_id?.message} />
          </div>

          <div>
            <Label htmlFor="author">Author</Label>
            <Input id="author" placeholder="Vyasa" {...register('author')} />
          </div>

          <div>
            <Label htmlFor="language">Language</Label>
            <Input id="language" placeholder="Hindi" {...register('language')} />
          </div>

          <div>
            <Label htmlFor="publisher">Publisher</Label>
            <Input id="publisher" {...register('publisher')} />
          </div>

          <div>
            <Label htmlFor="edition">Edition</Label>
            <Input id="edition" placeholder="2nd" {...register('edition')} />
          </div>

          <div>
            <Label htmlFor="publication_year">Publication year</Label>
            <Input id="publication_year" inputMode="numeric" placeholder="2019" {...register('publication_year')} />
            <FieldError message={errors.publication_year?.message} />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="isbn">ISBN</Label>
            <Input id="isbn" placeholder="978…" {...register('isbn')} />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={5} {...register('description')} />
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- Cover */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-ink">Cover image</h3>
        <div className="flex flex-wrap items-start gap-4">
          <div className="relative h-40 w-32 shrink-0 overflow-hidden rounded-lg border border-line bg-tint">
            {coverPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverPreview} alt="Cover" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-moon">
                <BookOpen className="h-7 w-7" />
              </span>
            )}
          </div>
          <div className="space-y-2">
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void handleCoverFile(e.target.files?.[0])}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => coverInputRef.current?.click()}
              disabled={uploadCover.isPending}
            >
              {uploadCover.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {coverKey ? 'Replace cover' : 'Upload cover'}
            </Button>
            {coverKey ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setValue('cover_image_key', '');
                  setCoverPreview('');
                }}
              >
                <X className="h-4 w-4" /> Remove
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------- Formats */}
      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-ink">Formats</h3>
          <p className="mt-1 text-xs text-moon">
            Either format alone is a normal book — eBook-only and print-only are both fine.
            {isEditing ? ' Turning a format off delists it; customers who bought it keep their copy.' : ''}
          </p>
          <FieldError message={errors.ebook_enabled?.message} />
        </div>

        {/* ------------------------------------------------------------ eBook */}
        <div
          className={cn(
            'rounded-xl border p-4 transition-colors',
            ebookEnabled ? 'border-saffron/50 bg-tint/40' : 'border-line',
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <FileText className="h-4 w-4 text-saffron" />
              <div>
                <p className="text-sm font-semibold text-ink">eBook</p>
                <p className="text-xs text-moon">Downloadable PDF. No shipping, no stock.</p>
              </div>
            </div>
            <Controller
              name="ebook_enabled"
              control={control}
              render={({ field }) => (
                <Switch checked={!!field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>

          {ebookEnabled ? (
            <div className="mt-4 space-y-4 border-t border-line pt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="ebook_price">Price (₹) *</Label>
                  <Input id="ebook_price" inputMode="decimal" placeholder="199.00" {...register('ebook_price')} />
                  <FieldError message={errors.ebook_price?.message} />
                </div>
                {/* Deliberately no SKU and no stock inputs here — not disabled ones, absent
                    ones. The API rejects both on a digital format, because a stored zero is
                    what makes an eBook read as sold out on the storefront. */}
              </div>

              <div>
                <Label>PDF file *</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={(e) => void handleEbookFile(e.target.files?.[0])}
                />

                {asset ? (
                  <div className="mt-2 rounded-lg border border-line bg-page p-3">
                    <div className="flex items-start gap-3">
                      <FileText className="mt-0.5 h-4 w-4 shrink-0 text-saffron" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">{asset.file_name}</p>
                        <p className="mt-0.5 text-xs text-moon">
                          {/* Measured from the object server-side. If a 400-page title reads
                              "1 page", the upload failed — catch it here, not in support. */}
                          {asset.page_count ?? '?'} pages · {formatBytes(asset.size_bytes)}
                          {asset.version && asset.version > 1 ? ` · v${asset.version}` : ''}
                        </p>
                        {asset.page_count != null && asset.page_count <= 1 ? (
                          <p className="mt-1.5 flex items-start gap-1.5 text-xs text-danger">
                            <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
                            Only {asset.page_count} page detected. If that is wrong, the upload
                            failed — re-upload before saving.
                          </p>
                        ) : (
                          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-success">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            File registered
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadEbook.isPending}
                      >
                        {uploadEbook.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        Replace
                      </Button>
                    </div>
                    {isEditing ? (
                      <p className="mt-3 border-t border-line pt-2.5 text-xs text-moon">
                        Replacing the file creates a new version and repoints this format.
                        <strong className="font-medium text-ink"> Existing owners follow to the new
                        version</strong> — a customer who bought an edition with a typo gets the
                        corrected one without asking.
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-2"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadEbook.isPending}
                  >
                    {uploadEbook.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {uploadEbook.isPending ? 'Uploading…' : 'Upload PDF'}
                  </Button>
                )}
                <p className="mt-1.5 text-xs text-moon">
                  PDF only, up to {Math.round(EBOOK_MAX_BYTES / (1024 * 1024))} MB.
                </p>
                <FieldError message={errors.ebook_digital_asset_id?.message} />
              </div>
            </div>
          ) : null}
        </div>

        {/* ---------------------------------------------------------- Printed */}
        <div
          className={cn(
            'rounded-xl border p-4 transition-colors',
            printedEnabled ? 'border-saffron/50 bg-tint/40' : 'border-line',
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Package className="h-4 w-4 text-saffron" />
              <div>
                <p className="text-sm font-semibold text-ink">Printed</p>
                <p className="text-xs text-moon">Ships to the customer and consumes stock.</p>
              </div>
            </div>
            <Controller
              name="printed_enabled"
              control={control}
              render={({ field }) => (
                <Switch checked={!!field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>

          {printedEnabled ? (
            <div className="mt-4 grid gap-4 border-t border-line pt-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="printed_price">Price (₹) *</Label>
                <Input id="printed_price" inputMode="decimal" placeholder="499.00" {...register('printed_price')} />
                <FieldError message={errors.printed_price?.message} />
              </div>
              <div>
                <Label htmlFor="printed_sku">SKU *</Label>
                <Input id="printed_sku" placeholder="GITA-BOOK-001" {...register('printed_sku')} />
                <FieldError message={errors.printed_sku?.message} />
              </div>
              <div>
                <Label htmlFor="printed_stock">Stock *</Label>
                <Input id="printed_stock" inputMode="numeric" placeholder="100" {...register('printed_stock')} />
                <FieldError message={errors.printed_stock?.message} />
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* ------------------------------------------------------------ Visibility */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-ink">Visibility</h3>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-3">
            <Controller
              name="is_active"
              control={control}
              render={({ field }) => (
                <Switch checked={!!field.value} onCheckedChange={field.onChange} />
              )}
            />
            <Label className="mb-0">Active</Label>
          </div>
          <div className="flex items-center gap-3">
            <Controller
              name="is_published"
              control={control}
              render={({ field }) => (
                <Switch checked={!!field.value} onCheckedChange={field.onChange} />
              )}
            />
            <Label className="mb-0">Published</Label>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
        <Button type="submit" disabled={isPending || uploadEbook.isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isPending ? 'Saving…' : submitLabel}
        </Button>
        <Link href="/books">
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </Link>
        {/* One transaction: it succeeds or fails as a unit, so there is no partial book. */}
        <p className="text-xs text-moon">Saved in a single step — a book is never half-created.</p>
      </div>
    </form>
  );
}
