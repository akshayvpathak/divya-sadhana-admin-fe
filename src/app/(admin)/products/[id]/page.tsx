'use client';

import { useProduct, useUpdateProduct } from '@/hooks/useProducts';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductForm } from '@/components/forms/ProductForm';
import { ProductFormData } from '@/schemas/product.schema';

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  
  const mode = searchParams.get('mode') || 'view';
  const isEdit = mode === 'edit';

  const { data: product, isLoading } = useProduct(id);
  const { mutate: updateProduct, isPending } = useUpdateProduct();

  const onSubmit = (formData: ProductFormData) => {
    updateProduct({ id, data: { ...formData, image: formData.image || '' } }, { 
      onSuccess: () => {
        router.push('/products');
      } 
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/products">
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {isEdit ? 'Edit Product' : 'View Product'}
          </h1>
          <p className="text-slate-500 mt-1">
            {isEdit ? 'Update product details and pricing' : 'Detailed information about the product'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        {isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <ProductForm 
            productId={id}
            onSubmit={isEdit ? onSubmit : undefined}
            isPending={isEdit ? isPending : undefined}
            readOnly={!isEdit}
          />
        )}
      </div>
    </div>
  );
}
