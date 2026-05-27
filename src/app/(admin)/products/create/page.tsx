'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema, ProductFormData } from '@/schemas/product.schema';
import { useCreateProduct } from '@/hooks/useProducts';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

import { ProductForm } from '@/components/forms/ProductForm';
import { Button } from '@/components/ui/button';

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
      <div className="flex items-center gap-4">
        <Link href="/products">
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Create New Product</h1>
          <p className="text-slate-500 mt-1">Add a new item to your inventory</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <ProductForm 
          onSubmit={onSubmit}
          isPending={isPending}
        />
      </div>
    </div>
  );
}
