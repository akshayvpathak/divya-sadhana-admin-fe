'use client';

import { User, IndianRupee, ShoppingBag } from 'lucide-react';
import CommissionBreakdownCard from '@/components/orders/CommissionBreakdownCard';
import { ResponsiveDataView } from '@/components/common/ResponsiveDataView';
import { staticListState } from '@/hooks/queries/useInfiniteListQuery';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatINR } from '@/lib/currency';
import OrderFulfillmentPanel from '@/components/orders/OrderFulfillmentPanel';
import OrderTrackingPreview from '@/components/orders/OrderTrackingPreview';
import { SectionHeading } from '@/components/common/DetailCard';
import { Card } from '@/components/ui/card';
import type { Order } from '@/schemas/orders.schema';

type OrderItem = NonNullable<Order['items']>[number];

function formatAddress(order: Order): string {
  const lines = [
    order.shipping_name,
    order.shipping_phone,
    order.shipping_email,
    order.shipping_line1,
    order.shipping_line2,
    order.shipping_locality,
    [order.shipping_city, order.shipping_state, order.shipping_pincode]
      .filter(Boolean)
      .join(', '),
    order.shipping_country,
  ].filter((x) => x && String(x).trim());
  return lines.length ? lines.join('\n') : 'No shipping address on file';
}

function customerName(order: Order): string {
  if (typeof order.user === 'string') return order.user;
  const full = `${order.user?.first_name ?? ''} ${order.user?.last_name ?? ''}`.trim();
  return full || '—';
}

const ITEM_COLUMNS = [
  {
    id: 'product',
    header: 'Product',
    mobile: 'title' as const,
    headerClassName: 'px-6 py-3 text-xs font-bold uppercase text-moon',
    cellClassName: 'px-6 py-3',
    // The SKU is the only thing on the line that says *which* edition shipped —
    // a title sold as both an eBook and a printed copy reads identically without
    // it. Snapshots, so they still describe the sale after the catalogue moves on.
    renderCell: (row: OrderItem) => (
      <div className="min-w-0">
        <p className="text-sm font-bold text-ink">{row.product_name_snapshot}</p>
        {row.sku_snapshot ? (
          <p className="mt-0.5 font-mono text-xs text-moon">{row.sku_snapshot}</p>
        ) : null}
      </div>
    ),
    renderMobile: (row: OrderItem) => (
      <span className="block">
        <span className="block break-words">{row.product_name_snapshot}</span>
        {row.sku_snapshot ? (
          <span className="mt-0.5 block font-mono text-xs font-normal text-moon">
            {row.sku_snapshot}
          </span>
        ) : null}
      </span>
    ),
  },
  {
    id: 'unit_price',
    header: 'Unit Price',
    mobile: 'field' as const,
    headerAlign: 'right' as const,
    cellAlign: 'right' as const,
    headerClassName: 'px-6 py-3 text-xs font-bold uppercase text-moon text-right',
    cellClassName: 'px-6 py-3 text-sm text-charcoal text-right',
    // Without this the line total is unexplained arithmetic: 3 x ? = ₹897.
    renderCell: (row: OrderItem) => formatINR(row.unit_price_snapshot),
  },
  {
    id: 'quantity',
    header: 'Quantity',
    mobile: 'field' as const,
    headerAlign: 'center' as const,
    cellAlign: 'center' as const,
    headerClassName: 'px-6 py-3 text-xs font-bold uppercase text-moon text-center',
    cellClassName: 'px-6 py-3 text-sm text-charcoal text-center font-medium',
    accessorKey: 'quantity',
  },
  {
    id: 'line_total',
    header: 'Line Total',
    mobile: 'field' as const,
    headerAlign: 'right' as const,
    cellAlign: 'right' as const,
    headerClassName: 'px-6 py-3 text-xs font-bold uppercase text-moon text-right',
    cellClassName: 'px-6 py-3 text-sm font-black text-ink text-right',
    renderCell: (row: OrderItem) => formatINR(row.line_total),
  },
];

/**
 * The whole order detail view as one card. Previously six separate cards across
 * two columns, which made the reading order ambiguous — the sections now run
 * top to bottom inside a single surface, divided rather than detached.
 */
export default function OrderDetailCard({ order }: { order: Order }) {
  return (
    <Card divided>
      {/* At-a-glance: the two statuses and the headline total */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4 bg-cream px-4 py-4 sm:gap-x-10 sm:px-6">
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-moon">
            Payment Status
          </p>
          <StatusBadge status={order.payment_status} type="payment_status" />
        </div>
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-moon">
            Shipping Status
          </p>
          <StatusBadge status={order.shipping_status} type="shipping_status" />
        </div>
        <div className="ml-auto text-right">
          <p className="text-[10px] font-bold uppercase tracking-wide text-moon">
            Total Amount
          </p>
          <p className="text-xl font-black tracking-tight text-gold-press sm:text-2xl">
            {formatINR(order.total_amount)}
          </p>
        </div>
      </div>

      {/* What was bought */}
      <div>
        <div className="px-4 pt-5 pb-3 sm:px-6">
          <SectionHeading icon={<ShoppingBag className="h-3.5 w-3.5" />}>
            Order Items ({order.items?.length || 0})
          </SectionHeading>
        </div>
        <ResponsiveDataView
          columns={ITEM_COLUMNS}
          data={order.items || []}
          mobile={staticListState(order.items || [])}
          emptyMessage="No items found"
          emptyHint="This order has no line items."
        />
      </div>

      {/* Who it ships to, and what it comes to */}
      <div className="grid grid-cols-1 gap-x-10 gap-y-6 px-4 py-5 sm:px-6 lg:grid-cols-2">
        <div className="space-y-3">
          <SectionHeading icon={<User className="h-3.5 w-3.5" />}>
            Customer Details
          </SectionHeading>
          <div>
            <p className="text-sm font-bold text-ink">{customerName(order)}</p>
            <p className="text-sm text-moon">
              {typeof order.user === 'object' && order.user?.email}
            </p>
          </div>
          <div className="border-t border-line/60 pt-3">
            <p className="mb-2 text-[10px] font-bold uppercase text-moon">
              Shipping Address
            </p>
            <p className="whitespace-pre-line text-sm leading-relaxed text-charcoal">
              {formatAddress(order)}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <SectionHeading icon={<IndianRupee className="h-3.5 w-3.5" />}>
            Financial Summary
          </SectionHeading>
          <dl className="space-y-2.5">
            <div className="flex justify-between text-sm">
              <dt className="text-moon">Subtotal</dt>
              <dd className="font-semibold text-ink">
                {formatINR(order.subtotal_amount)}
              </dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-moon">Shipping</dt>
              <dd className="font-semibold text-ink">
                {formatINR(order.shipping_amount)}
              </dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-moon">Tax</dt>
              <dd className="font-semibold text-ink">{formatINR(order.tax_amount)}</dd>
            </div>
            <div className="flex items-center justify-between border-t border-line pt-3">
              <dt className="text-sm font-bold uppercase tracking-tight text-charcoal">
                Total Amount
              </dt>
              <dd className="text-xl font-black tracking-tight text-gold-press">
                {formatINR(order.total_amount)}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="px-4 py-5 sm:px-6">
        <CommissionBreakdownCard breakdown={order.commission_breakdown} />
      </div>

      {/* Act on the shipment. Both panels carry their own heading and status
          badge, so this section adds none of its own. */}
      <div className="px-4 py-5 sm:px-6">
        <OrderFulfillmentPanel order={order} embedded />
      </div>

      {/* Then confirm what the customer will see */}
      <div className="bg-cream px-4 py-5 sm:px-6">
        <OrderTrackingPreview orderId={order.id} embedded />
      </div>
    </Card>
  );
}
