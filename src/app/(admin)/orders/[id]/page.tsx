'use client';

import { useOrderQuery } from '@/hooks/queries/useOrdersQuery';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import OrderDetailCard from '@/components/orders/OrderDetailCard';
import { PageHeader } from '@/components/common/PageHeader';
import { listUrlFor } from '@/lib/list-view-memory';

export default function ViewOrderPage() {
  const params = useParams();
  const id = params.id as string;
  const [backHref, setBackHref] = useState('/orders');

  useEffect(() => {
    setBackHref(listUrlFor('/orders') || '/orders');
  }, []);

  const { data: order, isLoading } = useOrderQuery(id);

  return (
    <div className="space-y-6">
      <PageHeader
        backHref={backHref}
        title={<>{isLoading ? <Skeleton className="h-9 w-48" /> : `Order #${order?.order_number}`}</>}
      />

      {isLoading ? (
        <Skeleton className="h-[720px] w-full rounded-2xl" />
      ) : order ? (
        <OrderDetailCard order={order} />
      ) : null}
    </div>
  );
}
