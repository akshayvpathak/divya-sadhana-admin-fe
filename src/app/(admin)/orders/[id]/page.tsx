'use client';

import { useOrderQuery } from '@/hooks/queries/useOrdersQuery';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { StatusBadge } from '@/components/ui/status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable } from '@/components/common/DataTable/DataTable';
import { formatINR } from '@/lib/currency';

export default function ViewOrderPage() {
  const params = useParams();
  const id = params.id as string;
  
  const { data, isLoading } = useOrderQuery(id);
  const order = data;

  const itemColumns = [
    {
      id: 'product',
      header: 'Product',
      headerClassName: 'px-6 py-4 text-xs font-bold uppercase text-slate-500',
      cellClassName: 'px-6 py-4',
      renderCell: (row: any) => (
        <p className="text-sm font-bold text-slate-900">{row.product_name_snapshot}</p>
      ),
    },
    {
      id: 'quantity',
      header: 'Quantity',
      headerAlign: 'center' as const,
      cellAlign: 'center' as const,
      headerClassName: 'px-6 py-4 text-xs font-bold uppercase text-slate-500 text-center',
      cellClassName: 'px-6 py-4 text-sm text-slate-600 text-center font-medium',
      accessorKey: 'quantity',
    },
    {
      id: 'line_total',
      header: 'Line Total',
      headerAlign: 'right' as const,
      cellAlign: 'right' as const,
      headerClassName: 'px-6 py-4 text-xs font-bold uppercase text-slate-500 text-right',
      cellClassName: 'px-6 py-4 text-sm font-black text-slate-900 text-right',
      renderCell: (row: any) => formatINR(row.line_total),
    },
  ];

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
          <p className="text-slate-500 mt-1">Detailed order information and summary</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      ) : order && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Customer & Status */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Customer Details</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {typeof order.user === 'string' ? order.user : `${order.user?.first_name} ${order.user?.last_name}`}
                    </p>
                    <p className="text-sm text-slate-500">{typeof order.user === 'object' && order.user?.email}</p>
                  </div>
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Shipping Address</p>
                    <p className="text-sm text-slate-600 leading-relaxed capitalize">
                      {order.shipping_status || 'Pending Delivery'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Order Status</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Payment Status</p>
                    <StatusBadge status={order.payment_status} type="payment_status" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Shipping Status</p>
                    <StatusBadge status={order.shipping_status} type="shipping_status" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Financial Summary */}
            <div className="bg-indigo-600 p-8 rounded-3xl shadow-xl shadow-indigo-100 text-white flex flex-col justify-between">
              <h3 className="text-xs font-bold text-indigo-200 uppercase tracking-widest mb-6">Financial Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-indigo-200">Subtotal</span>
                  <span className="font-bold">{formatINR(order.subtotal_amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-indigo-200">Shipping</span>
                  <span className="font-bold">{formatINR(order.shipping_amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-indigo-200">Tax</span>
                  <span className="font-bold">{formatINR(order.tax_amount)}</span>
                </div>
                <div className="pt-6 mt-6 border-t border-indigo-500/50 flex justify-between items-center">
                  <span className="font-black text-indigo-100 uppercase tracking-tighter text-lg">Total Amount</span>
                  <span className="font-black text-white text-4xl tracking-tighter">{formatINR(order.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section: Line Items */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Order Items ({order.items?.length || 0})</h3>
            </div>
            <DataTable
              columns={itemColumns}
              data={order.items || []}
              isLoading={isLoading}
              emptyMessage="No items found"
            />
          </div>
        </div>
      )}
    </div>
  );
}
