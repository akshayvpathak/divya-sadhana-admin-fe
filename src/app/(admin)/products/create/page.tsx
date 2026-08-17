'use client';

import { ProductFormData } from '@/schemas/product.schema';
import { useCreateProduct } from '@/hooks/useProducts';
import { useRouter } from 'next/navigation';

import { ProductForm } from '@/components/forms/ProductForm';
import { PageHeader } from '@/components/common/PageHeader';

export default function CreateProductPage() {
  const router = useRouter();
  const { mutate: createProduct, isPending } = useCreateProduct();

  const onSubmit = (formData: ProductFormData) => {
    createProduct({ ...formData, image: formData.image || '' }, { 
      onSuccess: () => {
        router.push('/products');
      } 
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/products"
        title="Create New Product"
      />

      <div className="bg-surface rounded-xl shadow-sm border border-line p-6">
        <ProductForm 
          onSubmit={onSubmit}
          isPending={isPending}
        />
      </div>
    </div>
  );
}
