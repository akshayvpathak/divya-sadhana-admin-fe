'use client';

import { useOrderQuery } from '@/hooks/queries/useOrdersQuery';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import OrderDetailCard from '@/components/orders/OrderDetailCard';

export default function ViewOrderPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: order, isLoading } = useOrderQuery(id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/orders">
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {isLoading ? <Skeleton className="h-9 w-48" /> : `Order #${order?.order_number}`}
          </h1>
          <p className="text-slate-500 mt-1">Detailed order information and fulfillment</p>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-[720px] w-full rounded-2xl" />
      ) : order ? (
        <OrderDetailCard order={order} />
      ) : null}
    </div>
  );
}
