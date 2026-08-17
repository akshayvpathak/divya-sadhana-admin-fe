'use client';

import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { useProduct, useUpdateProduct } from '@/hooks/useProducts';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { ProductForm } from '@/components/forms/ProductForm';
import { ProductFormData } from '@/schemas/product.schema';
import { PageHeader, MetaChip } from '@/components/common/PageHeader';
import { ProductDetailView } from '@/components/products/ProductDetailView';

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;

  const isEdit = searchParams.get('mode') === 'edit';

  const { data: product, isLoading } = useProduct(id);
  const { mutate: updateProduct, isPending } = useUpdateProduct();

  const onSubmit = (formData: ProductFormData) => {
    updateProduct(
      { id, data: { ...formData, image: formData.image || '' } },
      {
        onSuccess: () => {
          router.push('/products');
        },
      }
    );
  };

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        backHref="/products"
        title={isEdit ? 'Edit Product' : product?.name || 'Product'}
        identifier={product?.name ?? null}
        currentLabel={isEdit ? 'Edit' : undefined}
        loading={isLoading}
        meta={
          !isEdit && product?.sku ? <MetaChip tone="mono">{product.sku}</MetaChip> : undefined
        }
        actions={
          !isEdit && (
            <Link href={`/products/${id}?mode=edit`}>
              <Button>
                <Pencil className="h-4 w-4" /> Edit product
              </Button>
            </Link>
          )
        }
      />

      {isEdit ? (
        <Card padding="padded">
          {isLoading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <ProductForm productId={id} onSubmit={onSubmit} isPending={isPending} />
          )}
        </Card>
      ) : (
        <ProductDetailView productId={id} />
      )}
    </div>
  );
}
