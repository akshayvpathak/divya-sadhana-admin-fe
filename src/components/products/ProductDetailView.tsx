'use client';

import Image from 'next/image';
import { ChevronDown, Layers, Package, Search, Tag } from 'lucide-react';
import { Card, CardBand, CardSection } from '@/components/ui/card';
import { Field, NAValue, SectionHeading } from '@/components/common/DetailCard';
import { StatusBadge } from '@/components/ui/status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatINR } from '@/lib/currency';
import { formatDateTime } from '@/lib/datetime';
import { resolveProductImageUrl, useProduct } from '@/hooks/useProducts';
import { useAllCategories } from '@/hooks/useCategories';
import { ProductGallery } from './ProductGallery';
import { ProductVariantsTable } from './ProductVariantsTable';

/** Read-only product view. */
export function ProductDetailView({ productId }: { productId: string }) {
  const { data: product, isLoading } = useProduct(productId);
  const { data: categories } = useAllCategories();

  if (isLoading) {
    return <Skeleton className="h-[640px] w-full rounded-2xl" />;
  }
  if (!product) return null;

  const images = [
    product.primary_image_url || product.primary_image_key,
    ...(product.gallery_image_urls?.length
      ? product.gallery_image_urls
      : product.gallery_image_keys ?? []),
  ]
    .map((src) => resolveProductImageUrl(src))
    .filter((src): src is string => Boolean(src));

  const variants = product.variants ?? [];
  const optionGroups = product.option_groups ?? [];

  // With variants the single `price` is only a display value; the real range
  // lives on min/max, so show that instead of a number no variant charges.
  const priceLabel =
    product.has_variants && product.min_price != null
      ? product.min_price === product.max_price
        ? formatINR(product.min_price)
        : `${formatINR(product.min_price)} – ${formatINR(product.max_price)}`
      : formatINR(product.price);

  const categoryName =
    (categories ?? []).find(
      (c: { id: string; name?: string }) => c.id === product.categoryId
    )?.name ?? null;

  const ogImage = resolveProductImageUrl(product.og_image_url || product.og_image_key);

  return (
    <div className="space-y-6">
      <Card divided>
        <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-[minmax(0,380px)_1fr]">
          <ProductGallery images={images} alt={product.name || 'Product'} />

          <div className="min-w-0 space-y-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-ink">
                {product.name || <NAValue />}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge status={product.is_active} type="active" />
                <StatusBadge status={product.is_published} type="published" />
                {product.has_variants && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-royal/15 bg-royal-tint px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-royal-ink">
                    <Layers className="h-3 w-3" />
                    {variants.length} variant{variants.length === 1 ? '' : 's'}
                  </span>
                )}
              </div>
            </div>

            <p className="text-3xl font-black tracking-tight text-gold-press">
              {priceLabel}
            </p>

            <dl className="grid grid-cols-2 gap-4 border-t border-line/60 pt-4">
              <Field label="Stock">
                <span className="tabular-nums">{product.stock}</span>
              </Field>
              <Field label="Category">{categoryName}</Field>
              <Field label="SKU">
                {product.sku ? (
                  <span className="font-mono text-xs">{product.sku}</span>
                ) : null}
              </Field>
              <Field label="Last updated">{formatDateTime(product.updated_at)}</Field>
            </dl>
          </div>
        </div>

        <CardSection>
          <SectionHeading icon={<Tag className="h-3.5 w-3.5" />}>
            Specifications
          </SectionHeading>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Slug">
              {product.slug ? (
                <span className="font-mono text-xs">{product.slug}</span>
              ) : null}
            </Field>
            <Field label="Base price">{formatINR(product.price)}</Field>
            <Field label="Created">{formatDateTime(product.created_at)}</Field>
          </div>
        </CardSection>

        <CardSection>
          <SectionHeading icon={<Package className="h-3.5 w-3.5" />}>
            Description
          </SectionHeading>
          {product.description ? (
            // Admin-authored ReactQuill HTML, rendered through the .rich-text
            // scope in globals.css.
            <div
              className="rich-text mt-4"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          ) : (
            <p className="mt-4">
              <NAValue />
            </p>
          )}
        </CardSection>

        {product.has_variants && (
          <CardSection className="px-0 pb-0">
            <div className="px-6">
              <SectionHeading icon={<Layers className="h-3.5 w-3.5" />}>
                Variants
              </SectionHeading>
            </div>
            <div className="mt-4">
              <ProductVariantsTable variants={variants} optionGroups={optionGroups} />
            </div>
          </CardSection>
        )}

        {/* SEO is reference data, not something an operator reads every visit. */}
        <CardBand className="px-0 py-0">
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-6 py-4">
              <SectionHeading icon={<Search className="h-3.5 w-3.5" />}>
                Search engine listing
              </SectionHeading>
              <ChevronDown className="h-4 w-4 text-moon transition-transform group-open:rotate-180" />
            </summary>
            <div className="grid grid-cols-1 gap-4 border-t border-line/60 px-6 py-5 sm:grid-cols-2">
              <Field label="Meta title">{product.meta_title}</Field>
              <Field label="Meta description">{product.meta_description}</Field>
              <Field label="Meta keywords">{product.meta_keywords}</Field>
              <Field label="Indexable">
                <StatusBadge
                  status={product.is_indexable ? 'true' : 'false'}
                  type="active"
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="OG image">
                  {ogImage ? (
                    <div className="relative mt-1 aspect-video w-full max-w-[240px] overflow-hidden rounded-xl border border-line bg-cosmos">
                      <Image
                        src={ogImage}
                        alt="Open Graph preview"
                        fill
                        sizes="240px"
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : null}
                </Field>
              </div>
            </div>
          </details>
        </CardBand>
      </Card>
    </div>
  );
}
